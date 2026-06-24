import { useState, useRef, useMemo, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer, GeoJSON, CircleMarker, Polyline, Popup,
  Tooltip as LeafletTooltip, useMap,
} from 'react-leaflet'
import {
  BASIN_INFO, BASIN_NAMES, PROVINCES, BASIN_POLYGONS, RIVER_LINES, ROAD_LINES,
  GAUGE_STATIONS, RESERVOIR_STATIONS, RAIN_STATIONS, ALL_STATIONS,
  FLOOD_EXTENT, floodColor, GN_DIVISIONS, ALERT_STATUS,
} from './basinMapData'
import srilankaGeo from '../srilanka.geo.json'
const SL_BOUNDS = [[5.7, 79.4], [10.05, 82.1]]
const SL_CENTER = [7.87, 80.77]

const LAYER_DEFS = [
  { key: 'gauges',     label: 'River Gauges',     icon: '📡' },
  { key: 'reservoirs', label: 'Reservoirs',       icon: '💧' },
  { key: 'rain',       label: 'Rain Gauges',      icon: '🌧️' },
  { key: 'flood',      label: 'Flood Extent',     icon: '🌊' },
  { key: 'gn',         label: 'GN Divisions',     icon: '🗺️' },
  { key: 'roads',      label: 'Roads',            icon: '🛣️' },
]

const fmt = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '—')

function pill(active) {
  return {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px',
    borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
    background: active ? '#eff6ff' : '#fff',
    color: active ? '#2563eb' : '#64748b',
    transition: 'background .15s, color .15s, border-color .15s',
    userSelect: 'none',
  }
}

// Flies the map to a station / basin whenever the target changes, and
// opens the marker's popup once the camera settles.
function FlyToHandler({ target, markerRefs }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    if (target.bounds) {
      map.flyToBounds(target.bounds, { duration: 0.7, padding: [30, 30] })
      return
    }
    if (typeof target.lat === 'number') {
      map.flyTo([target.lat, target.lng], 10.5, { duration: 0.7 })
      const id = target.id
      const t = setTimeout(() => {
        markerRefs.current[id]?.openPopup?.()
      }, 720)
      return () => clearTimeout(t)
    }
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function MapControls() {
  const map = useMap()
  const btn = {
    width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff',
    borderRadius: 5, cursor: 'pointer', fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: 6 }}>
      <button style={btn} onClick={() => map.zoomIn()}>🔍+</button>
      <button style={btn} onClick={() => map.zoomOut()}>🔍-</button>
      <button style={btn} onClick={() => map.fitBounds(SL_BOUNDS)}>⛶</button>
    </div>
  )
}

export default function StateBasinMap() {
  const [province, setProvince] = useState('All Provinces')
  const [basin, setBasin] = useState('All Basins')
  const [layers, setLayers] = useState({
    gauges: true, reservoirs: true, rain: true, flood: true, gn: false, roads: false,
  })
  const [historicalTime, setHistoricalTime] = useState('')
  const [selectedStation, setSelectedStation] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [lastSync, setLastSync] = useState(new Date())
  const markerRefs = useRef({})

  // Demo auto-refresh tick — mirrors "auto-refreshes when new forecast run completes"
  useEffect(() => {
    const iv = setInterval(() => setLastSync(new Date()), 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  const toggleLayer = (key) => setLayers((p) => ({ ...p, [key]: !p[key] }))

  const inScope = (s) => {
    if (basin !== 'All Basins' && s.basin !== basin) return false
    if (province !== 'All Provinces' && BASIN_INFO[s.basin]?.province !== province && s.basin) return false
    return true
  }

  const visibleGauges     = useMemo(() => layers.gauges     ? GAUGE_STATIONS.filter(inScope)     : [], [layers.gauges, basin, province])
  const visibleReservoirs = useMemo(() => layers.reservoirs ? RESERVOIR_STATIONS.filter(inScope) : [], [layers.reservoirs, basin, province])
  const visibleRain       = useMemo(() => layers.rain       ? RAIN_STATIONS.filter(inScope)      : [], [layers.rain, basin, province])
  const visibleStations   = useMemo(() => ALL_STATIONS.filter(inScope), [basin, province])

  const visibleBasinPolys = useMemo(() => {
    if (basin === 'All Basins') return BASIN_POLYGONS
    return { ...BASIN_POLYGONS, features: BASIN_POLYGONS.features.filter((f) => f.properties.name === basin) }
  }, [basin])

  const visibleRivers = useMemo(
    () => RIVER_LINES.filter((r) => basin === 'All Basins' || r.basin === basin),
    [basin]
  )

  // ── Summary stats (right panel) ─────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { NORMAL: 0, ALERT: 0, MINOR_FLOOD: 0, MAJOR_FLOOD: 0, CRITICAL: 0 }
    visibleGauges.forEach((g) => { counts[g.status] = (counts[g.status] || 0) + 1 })
    return counts
  }, [visibleGauges])

  const basinsOnAlert = useMemo(() => {
    const byBasin = {}
    visibleGauges.forEach((g) => {
      if (g.status === 'NORMAL') return
      if (!byBasin[g.basin] || g.level > byBasin[g.basin].level) byBasin[g.basin] = g
    })
    return Object.entries(byBasin).map(([b, g]) => ({ basin: b, level: g.level, status: g.status }))
  }, [visibleGauges])

  const reservoirsNearCapacity = useMemo(
    () => visibleReservoirs.filter((r) => r.pct >= 80).sort((a, b) => b.pct - a.pct),
    [visibleReservoirs]
  )

  const topRainfall = useMemo(
    () => [...visibleRain].sort((a, b) => b.mm24h - a.mm24h).slice(0, 4),
    [visibleRain]
  )

  const goToStation = (s) => {
    setSelectedStation(s.id)
    setFlyTarget({ id: s.id, lat: s.lat, lng: s.lng })
  }

  const zoomToBasin = () => {
    if (basin === 'All Basins') { setFlyTarget({ bounds: SL_BOUNDS }); return }
    setFlyTarget({ bounds: BASIN_INFO[basin].bbox })
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100%', fontFamily: 'inherit' }}>

      {/* ── Filter & control bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Province</span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px', background: '#fff', cursor: 'pointer' }}
          >
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Basin</span>
          <select
            value={basin}
            onChange={(e) => setBasin(e.target.value)}
            style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px', background: '#fff', cursor: 'pointer' }}
          >
            {BASIN_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LAYER_DEFS.map((l) => (
            <div key={l.key} style={pill(layers[l.key])} onClick={() => toggleLayer(l.key)}>
              <span>{l.icon}</span><span>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>As of</span>
          <input
            type="datetime-local"
            value={historicalTime}
            onChange={(e) => setHistoricalTime(e.target.value)}
            style={{ fontSize: 12, color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 9px' }}
          />
          {historicalTime && (
            <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600, background: '#fffbeb', padding: '3px 8px', borderRadius: 5 }}>
              Historical snapshot
            </span>
          )}
        </div>

        <button
          onClick={zoomToBasin}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700,
          }}
        >
          ⛶ Zoom to {basin === 'All Basins' ? 'Sri Lanka' : basin}
        </button>
      </div>

      <div style={{ padding: 16 }}>

        {/* ── Legend | Map | Summary ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '188px 1fr 268px', gap: 14, marginBottom: 14 }}>

          {/* Left — Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Panel title="Alert Levels">
              {Object.entries(ALERT_STATUS).map(([k, d]) => (
                <LegendRow key={k} color={d.dot} label={d.label} />
              ))}
            </Panel>

            <Panel title="Flood Depth (m)">
              <GradientBar
                stops={[
                  ['<1.0', '#93c5fd'], ['1.0–1.5', '#f97316'],
                  ['1.5–2.0', '#dc2626'], ['>2.0', '#7f1d1d'],
                ]}
              />
            </Panel>

            <Panel title="Reservoir Fill">
              <GradientBar stops={[['<75%', '#3b82f6'], ['75–90%', '#f59e0b'], ['>90%', '#dc2626']]} />
            </Panel>

            <Panel title="Basins">
              {Object.entries(BASIN_INFO).map(([name, info]) => (
                <LegendRow key={name} color={info.color} label={name} square />
              ))}
            </Panel>
          </div>

          {/* Centre — Map */}
          <div style={{
            background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>State & Basin Map</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                🔄 Synced {lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} LKT
              </span>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: 560 }}>
              <MapContainer
                center={SL_CENTER}
                zoom={7}
                minZoom={6.5}
                maxZoom={12}
                maxBounds={SL_BOUNDS}
                maxBoundsViscosity={0.8}
                zoomSnap={0.1}
                scrollWheelZoom
                zoomControl={false}
                attributionControl={false}
                style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #e0f2fe 100%)',
                }}
              >
                <FlyToHandler target={flyTarget} markerRefs={markerRefs} />
                <GeoJSON
                  data={srilankaGeo}
                  style={() => ({
                    color: '#64748b',
                    weight: 1,
                    fillColor: '#f8fafc',
                    fillOpacity: 0.3,
                  })}
                />
                {/* Basin polygons */}
                <GeoJSON
                  key={`basins-${basin}`}
                  data={visibleBasinPolys}
                  style={(f) => ({
                    color: f.properties.color, weight: basin === 'All Basins' ? 1.2 : 2,
                    fillColor: f.properties.color, fillOpacity: basin === 'All Basins' ? 0.12 : 0.18,
                  })}
                  onEachFeature={(f, layer) => layer.bindTooltip(f.properties.name, { sticky: true })}
                />

                {/* Rivers */}
                {visibleRivers.map((r) => (
                  <Polyline key={r.name} positions={r.points} pathOptions={{ color: r.color, weight: 2.5, opacity: 0.85 }}>
                    <LeafletTooltip sticky>{r.name}</LeafletTooltip>
                  </Polyline>
                ))}

                {/* Roads */}
                {layers.roads && ROAD_LINES.map((r) => (
                  <Polyline key={r.name} positions={r.points} pathOptions={{ color: '#78716c', weight: 1.5, dashArray: '4 4', opacity: 0.8 }}>
                    <LeafletTooltip sticky>{r.name}</LeafletTooltip>
                  </Polyline>
                ))}

                {/* GN divisions */}
                {layers.gn && (
                  <GeoJSON
                    data={GN_DIVISIONS}
                    style={() => ({ color: '#64748b', weight: 0.8, fillOpacity: 0, dashArray: '2 3' })}
                    onEachFeature={(f, layer) => layer.bindTooltip(f.properties.name, { sticky: true })}
                  />
                )}

                {/* Flood extent */}
                {layers.flood && (
                  <GeoJSON
                    data={FLOOD_EXTENT}
                    style={(f) => ({ color: floodColor(f.properties.depth), weight: 1, fillColor: floodColor(f.properties.depth), fillOpacity: 0.45 })}
                    onEachFeature={(f, layer) => layer.bindTooltip(`${f.properties.name} — ${f.properties.depth} m`, { sticky: true })}
                  />
                )}

                {/* Reservoirs — size by capacity, fill colour by % */}
                {visibleReservoirs.map((r) => {
                  if (typeof r.lat !== 'number') return null
                  const fillColor = r.pct > 90 ? '#dc2626' : r.pct > 75 ? '#f59e0b' : '#3b82f6'
                  const radius = 6 + Math.sqrt(r.capacity) * 0.9
                  return (
                    <CircleMarker
                      key={r.id}
                      ref={(el) => (markerRefs.current[r.id] = el)}
                      center={[r.lat, r.lng]}
                      radius={radius}
                      pathOptions={{ color: '#fff', weight: 2, fillColor, fillOpacity: 0.85 }}
                      eventHandlers={{ click: () => setSelectedStation(r.id) }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -6]}>{r.name}</LeafletTooltip>
                      <Popup>
                        <StationPopup s={r} />
                      </Popup>
                    </CircleMarker>
                  )
                })}

                {/* Rain gauges */}
                {visibleRain.map((r) => {
                  if (typeof r.lat !== 'number') return null
                  const d = ALERT_STATUS[r.status] || ALERT_STATUS.NORMAL
                  return (
                    <CircleMarker
                      key={r.id}
                      ref={(el) => (markerRefs.current[r.id] = el)}
                      center={[r.lat, r.lng]}
                      radius={6}
                      pathOptions={{ color: '#fff', weight: 1.5, fillColor: d.dot, fillOpacity: 0.95 }}
                      eventHandlers={{ click: () => setSelectedStation(r.id) }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -6]}>{r.name} · {r.mm24h}mm/24h</LeafletTooltip>
                      <Popup><StationPopup s={r} /></Popup>
                    </CircleMarker>
                  )
                })}

                {/* River gauges — colour coded by alert status */}
                {visibleGauges.map((g) => {
                  if (typeof g.lat !== 'number') return null
                  const d = ALERT_STATUS[g.status] || ALERT_STATUS.NORMAL
                  const isSelected = g.id === selectedStation
                  return (
                    <Fragment key={g.id}>
                      <CircleMarker
                        center={[g.lat, g.lng]}
                        radius={isSelected ? 17 : 13}
                        pathOptions={{ stroke: false, fillColor: d.dot, fillOpacity: 0.22 }}
                        eventHandlers={{ click: () => setSelectedStation(g.id) }}
                      />
                      <CircleMarker
                        ref={(el) => (markerRefs.current[g.id] = el)}
                        center={[g.lat, g.lng]}
                        radius={isSelected ? 8 : 6}
                        pathOptions={{ color: '#fff', weight: isSelected ? 2.5 : 1.5, fillColor: d.dot, fillOpacity: 1 }}
                        eventHandlers={{ click: () => setSelectedStation(g.id) }}
                      >
                        <LeafletTooltip direction="top" offset={[0, -6]}>{g.name}</LeafletTooltip>
                        <Popup><StationPopup s={g} /></Popup>
                      </CircleMarker>
                    </Fragment>
                  )
                })}

                <MapControls />
              </MapContainer>

              <div style={{
                position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.92)',
                borderRadius: 7, padding: '6px 11px', fontSize: 11, color: '#64748b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 1000,
              }}>
                {visibleStations.length} stations in view
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Panel title="Gauges by Status">
              {['NORMAL', 'ALERT', 'MINOR_FLOOD', 'MAJOR_FLOOD', 'CRITICAL'].map((k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <LegendRow color={ALERT_STATUS[k].dot} label={ALERT_STATUS[k].label} compact />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{statusCounts[k] || 0}</span>
                </div>
              ))}
            </Panel>

            <Panel title="Basins on Alert">
              {basinsOnAlert.length === 0 && <Empty text="No basins currently on alert" />}
              {basinsOnAlert.map((b) => (
                <div key={b.basin} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{b.basin}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                    background: ALERT_STATUS[b.status].bg, color: ALERT_STATUS[b.status].color,
                  }}>{fmt(b.level, 2)} m</span>
                </div>
              ))}
            </Panel>

            <Panel title="Reservoirs Near Capacity">
              {reservoirsNearCapacity.length === 0 && <Empty text="None above 80%" />}
              {reservoirsNearCapacity.map((r) => (
                <div key={r.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.pct > 90 ? '#dc2626' : '#f59e0b' }}>{r.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pct}%`, background: r.pct > 90 ? '#dc2626' : '#f59e0b' }} />
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title="Highest 24h Rainfall">
              {topRainfall.length === 0 && <Empty text="No rain stations in view" />}
              {topRainfall.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.mm24h > 60 ? '#dc2626' : '#0891b2' }}>{r.mm24h} mm</span>
                </div>
              ))}
            </Panel>

            <div style={{
              fontSize: 11, color: '#94a3b8', background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '9px 12px', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>Last map sync</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>
                {lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} LKT
              </span>
            </div>
          </div>
        </div>

        {/* ── Bottom — Station quick list ── */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Station Quick List</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{visibleStations.length} stations · click a row to pan the map</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                  {['Station', 'Basin', 'Type', 'Current', 'Status', 'Trend'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleStations.map((s) => {
                  const d = ALERT_STATUS[s.status] || ALERT_STATUS.NORMAL
                  const reading = s.type === 'GAUGE' ? `${fmt(s.level)} m`
                    : s.type === 'RESERVOIR' ? `${s.pct}%`
                    : `${s.mm24h} mm/24h`
                  const isSel = s.id === selectedStation
                  return (
                    <tr
                      key={s.id}
                      onClick={() => goToStation(s)}
                      style={{
                        borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                        background: isSel ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{s.basin || '—'}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>
                        {s.type === 'GAUGE' ? '📡 Gauge' : s.type === 'RESERVOIR' ? '💧 Reservoir' : '🌧️ Rain'}
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{reading}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: d.bg, color: d.color }}>{d.label}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{s.trend || '→'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small presentational helpers ──────────────────────────────────

function Panel({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '13px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function LegendRow({ color, label, square, compact }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: compact ? 0 : 7 }}>
      <span style={{
        width: 10, height: 10, flexShrink: 0,
        borderRadius: square ? 3 : '50%', background: color,
      }} />
      <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function GradientBar({ stops }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
        {stops.map(([, c]) => <div key={c} style={{ flex: 1, background: c }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stops.map(([label, c]) => (
          <span key={label} style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
        ))}
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>{text}</div>
}

function StationPopup({ s }) {
  const d = ALERT_STATUS[s.status] || ALERT_STATUS.NORMAL
  return (
    <div style={{ fontSize: 12, minWidth: 170 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
      {s.type === 'GAUGE' && (
        <>
          <div>Level: <strong>{fmt(s.level)}</strong> m</div>
          <div>Threshold: {fmt(s.threshold, 1)} m</div>
          <div>Trend: {s.trend}</div>
        </>
      )}
      {s.type === 'RESERVOIR' && (
        <>
          <div>Storage: <strong>{s.current}</strong> / {s.capacity} Mm³</div>
          <div>Fill: {s.pct}%</div>
        </>
      )}
      {s.type === 'RAIN' && (
        <div>Last 24h: <strong>{s.mm24h} mm</strong></div>
      )}
      <div style={{ marginTop: 5, color: '#94a3b8', fontSize: 10.5 }}>Updated {s.lastUpdated}</div>
      <div style={{ marginTop: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: d.bg, color: d.color }}>{d.label}</span>
      </div>
      {s.type === 'GAUGE' && (
        <div style={{ marginTop: 8 }}>
          <Link to={`/forecast-discharge/forecast-vs-observed?gauge=${s.id}`} style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
            View Timeseries →
          </Link>
        </div>
      )}
    </div>
  )
}

/*
 * API wiring notes (replace dummy data with the real thing):
 *  - GET /api/v1/gauges            → GAUGE_STATIONS (lat/lng/level/status/trend)
 *  - GET /api/v1/reservoirs        → RESERVOIR_STATIONS (lat/lng/capacity/current/pct)
 *  - GET /api/v1/rainfall          → RAIN_STATIONS (lat/lng/mm24h)
 *  - GET /api/v1/flood-extent/latest → FLOOD_EXTENT GeoJSON (replace static polygons)
 *  - GeoServer WMS/XYZ             → BASIN_POLYGONS / GN_DIVISIONS / river network layers
 *  - Auto-refresh: poll the above on an interval (the lastSync ticker above
 *    is already wired to a 5-minute interval — point it at a real fetch).
 */