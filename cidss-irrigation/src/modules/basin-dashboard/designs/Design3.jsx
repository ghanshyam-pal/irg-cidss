// Design 3 — Map-First  (ArcGIS-dashboard style, like reference Image 1)
// Large map dominates, collapsible layer panel on left, charts in right panel
//
// ── LEAFLET SETUP ─────────────────────────────────────────────────────────
// npm install leaflet react-leaflet
// Add once in your app's root (e.g. main.jsx / App.jsx):
//   import 'leaflet/dist/leaflet.css'
// Reuses the same srilanka.geo.json generated for Design 1 — put it next to
// this file (or adjust the import path below).
// ─────────────────────────────────────────────────────────────────────────

import { useState, Fragment } from 'react'
import L from 'leaflet'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  MapContainer, GeoJSON, CircleMarker, Circle, Marker, Popup,
  Tooltip as LeafletTooltip, useMap,
} from 'react-leaflet'
import {
  GAUGE_DATA, ALERT_STATUS, RAINFALL_DATA, RESERVOIR_DATA, RECENT_ALERTS,
} from './data'
import srilankaGeo from './srilanka.geo.json'

const BASIN_COLORS = { Kalu: '#3b82f6', Kelani: '#8b5cf6', Mahaweli: '#06b6d4', Nilwala: '#f59e0b', Other: '#94a3b8' }

const PIE_DATA = [
  { name: 'Normal',      value: 4, color: '#22c55e' },
  { name: 'Alert',       value: 1, color: '#eab308' },
  { name: 'Minor Flood', value: 1, color: '#f97316' },
  { name: 'Major Flood', value: 2, color: '#ef4444' },
]

const LAYER_ITEMS = [
  { id: 'gauges',    label: 'River Gauges',      color: '#3b82f6', active: true },
  { id: 'reservoirs',label: 'Reservoirs',        color: '#06b6d4', active: true },
  { id: 'flood',     label: 'Flood Extent',      color: '#ef4444', active: true },
  { id: 'rainfall',  label: 'Rainfall (IDW)',    color: '#8b5cf6', active: false },
  { id: 'gnDiv',     label: 'GN Divisions',      color: '#f59e0b', active: false },
  { id: 'infra',     label: 'Infrastructure',    color: '#64748b', active: false },
]
// Note: 'rainfall', 'gnDiv' and 'infra' are toggleable but have no source
// geometry wired up yet (no IDW raster / GN boundary / infrastructure layer
// in scope). Add a <GeoJSON> or raster overlay for each when that data exists.

const SL_BOUNDS = [[5.7, 79.4], [10.05, 82.1]]   // [[south, west], [north, east]]
const SL_CENTER = [7.7, 80.77]

// Approximate basin centroids — used only as a fallback so gauges render
// somewhere sensible on the map. Add real `lat` / `lng` fields to each row
// in GAUGE_DATA for accurate placement; those always take priority below.
const BASIN_CENTER_COORDS = {
  Kalu:     [6.62, 80.20],
  Kelani:   [6.95, 80.25],
  Mahaweli: [7.45, 80.85],
  Nilwala:  [5.97, 80.55],
  Walawe:   [6.40, 80.85],
}

function resolveGaugeCoords(g) {
  if (typeof g.lat === 'number' && typeof g.lng === 'number') return [g.lat, g.lng]
  const base = BASIN_CENTER_COORDS[g.basin]
  if (!base) return null
  // deterministic small spread so multiple gauges in the same basin don't stack on one point
  const hash = String(g.id || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const jitterLat = ((hash % 7) - 3) * 0.045
  const jitterLng = ((hash % 5) - 2) * 0.045
  return [base[0] + jitterLat, base[1] + jitterLng]
}

// Reservoirs aren't tied to a basin field in this dataset, and guessing real
// dam locations by name would risk placing them wrong — so a reservoir is
// only plotted once you add real `lat` / `lng` fields onto its row in
// RESERVOIR_DATA. Until then the Reservoirs layer toggle simply renders nothing.
function resolveReservoirCoords(r) {
  if (typeof r.lat === 'number' && typeof r.lng === 'number') return [r.lat, r.lng]
  return null
}

const squareIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:3px;background:${color};opacity:0.85;display:flex;align-items:center;justify-content:center;color:#fff;font-size:8px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.35);">R</div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const AlertBadge = ({ status }) => {
  const d = ALERT_STATUS[status] || ALERT_STATUS.NORMAL
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 3, background: d.bg, color: d.color }}>
      {d.label}
    </span>
  )
}

// Zoom / reset-view buttons that live inside MapContainer so they can reach
// the Leaflet map instance via useMap(). Visually matches the original ＋ － ⛶ buttons.
function MapZoomControls() {
  const map = useMap()
  const btnStyle = {
    width: 32, height: 32, background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 6, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  }
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button style={btnStyle} onClick={() => map.zoomIn()}>＋</button>
      <button style={btnStyle} onClick={() => map.zoomOut()}>－</button>
      <button style={btnStyle} onClick={() => map.fitBounds(SL_BOUNDS)}>⛶</button>
    </div>
  )
}

export default function Design3() {
  const [layers, setLayers]     = useState(LAYER_ITEMS)
  const [activeTab, setActiveTab] = useState('charts')
  const [selBasin, setSelBasin]   = useState(null)
  const [selGauge, setSelGauge]   = useState(null)

  const toggleLayer = (id) =>
    setLayers(layers.map(l => l.id === id ? { ...l, active: !l.active } : l))

  const isLayerActive = (id) => layers.find(l => l.id === id)?.active

  const activeGauges = GAUGE_DATA.filter(g => !selBasin || g.basin === selBasin)
  const floodGauges = activeGauges.filter(g => g.status === 'MAJOR_FLOOD' || g.status === 'MINOR_FLOOD')

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f0f4f8', fontFamily: 'inherit', gap: 0, minHeight: 'calc(100vh - 80px)' }}>

      {/* ── LEFT: Layer control panel ── */}
      <div style={{
        width: 220, flexShrink: 0, background: '#fff',
        borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {['My Data', 'Geographies'].map((t) => (
            <button key={t} style={{
              flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: 'none', borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none', color: activeTab === t ? '#2563eb' : '#64748b',
              transition: 'all 0.15s',
            }} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* Map layers */}
        <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Map Layers
          </div>
          {layers.map((l) => (
            <div
              key={l.id}
              onClick={() => toggleLayer(l.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', cursor: 'pointer',
                background: l.active ? `${l.color}0d` : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                background: l.active ? l.color : 'transparent',
                border: `2px solid ${l.color}`,
                transition: 'background 0.15s',
              }} />
              <span style={{ fontSize: 12, color: l.active ? '#1e293b' : '#94a3b8' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Basin filter */}
        <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Filter by Basin
          </div>
          {[null, 'Kalu', 'Kelani', 'Mahaweli', 'Nilwala', 'Walawe'].map((b) => (
            <div
              key={b || 'all'}
              onClick={() => setSelBasin(b)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', cursor: 'pointer',
                background: selBasin === b ? '#eff6ff' : 'transparent',
                color: selBasin === b ? '#2563eb' : '#475569',
                fontSize: 12, fontWeight: selBasin === b ? 700 : 400,
              }}
            >
              {b && <span style={{ width: 8, height: 8, borderRadius: '50%', background: BASIN_COLORS[b] || '#94a3b8' }} />}
              {b || '— All Basins —'}
            </div>
          ))}
        </div>

        {/* Attribute list (like ArcGIS field list) */}
        <div style={{ padding: '10px 0', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Attributes
          </div>
          {['Station ID','River Name','Basin','Level (m)','Threshold','Status','Trend','Last Updated'].map((a) => (
            <div key={a} style={{ padding: '5px 14px', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#cbd5e1' }}>⊞</span> {a}
            </div>
          ))}
        </div>
      </div>

      {/* ── CENTRE: Map ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Map header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
          borderBottom: '1px solid #e2e8f0', padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
            Sri Lanka Basin Flood Status Map
            {selBasin && <span style={{ fontSize: 11, color: '#2563eb', marginLeft: 8 }}>· {selBasin} Basin</span>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Map','Chart','Table'].map((v) => (
              <button key={v} style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: 'pointer',
                border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b',
              }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Map — real Sri Lanka boundary via Leaflet */}
        <div style={{
          position: 'absolute', inset: 0, top: 44,
          background: 'linear-gradient(160deg, #dbeafe 0%, #bfdbfe 30%, #e0f2fe 60%, #cffafe 100%)',
        }}>
          <MapContainer
            center={SL_CENTER}
            zoom={7.6}
            minZoom={6.5}
            maxZoom={12}
            maxBounds={SL_BOUNDS}
            maxBoundsViscosity={0.8}
            zoomSnap={0.1}
            zoomControl={false}
            attributionControl={false}
            style={{ height: '100%', width: '100%', background: 'transparent' }}
          >
            {/* No tile layer on purpose — keeps the clean illustrative look.
                If you'd rather have a real basemap underneath, add e.g.:
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                (import TileLayer from 'react-leaflet' first) */}

            <GeoJSON
              data={srilankaGeo}
              style={() => ({
                color: '#2563eb',
                weight: 2,
                fillColor: '#93c5fd',
                fillOpacity: 0.55,
              })}
            />

            {/* Flood Extent — illustrative radius around stations currently
                reporting Minor/Major flood. Swap for a real flood-extent
                GeoJSON layer once you have one. */}
            {isLayerActive('flood') && floodGauges.map((g) => {
              const coords = resolveGaugeCoords(g)
              if (!coords) return null
              const d = ALERT_STATUS[g.status]
              return (
                <Circle
                  key={`flood-${g.id}`}
                  center={coords}
                  radius={g.status === 'MAJOR_FLOOD' ? 9000 : 5500}
                  pathOptions={{ stroke: false, fillColor: d.dot, fillOpacity: 0.28 }}
                />
              )
            })}

            {/* River Gauges */}
            {isLayerActive('gauges') && activeGauges.map((g) => {
              const coords = resolveGaugeCoords(g)
              if (!coords) return null
              const d = ALERT_STATUS[g.status] || ALERT_STATUS.NORMAL
              const isSelected = g.id === selGauge
              return (
                <Fragment key={g.id}>
                  <CircleMarker
                    center={coords}
                    radius={isSelected ? 14 : 10}
                    pathOptions={{ stroke: false, fillColor: d.dot, fillOpacity: 0.2 }}
                    eventHandlers={{ click: () => setSelGauge(g.id) }}
                  />
                  <CircleMarker
                    center={coords}
                    radius={isSelected ? 8 : 6}
                    pathOptions={{ color: '#fff', weight: isSelected ? 2 : 1, fillColor: d.dot, fillOpacity: 0.9 }}
                    eventHandlers={{ click: () => setSelGauge(g.id) }}
                  >
                    <LeafletTooltip direction="top" offset={[0, -8]}>
                      {g.id} · {g.level?.toFixed?.(2) ?? g.level}m
                    </LeafletTooltip>
                    <Popup>
                      <div style={{ fontSize: 12, minWidth: 140 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{g.name || g.id}</div>
                        <div>Basin: {g.basin || '—'}</div>
                        <div>Level: <strong>{g.level?.toFixed?.(2) ?? g.level}</strong> m</div>
                        <div>Threshold: {g.threshold?.toFixed?.(1) ?? g.threshold} m</div>
                        <div style={{ marginTop: 4 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px',
                            borderRadius: 4, background: d.bg, color: d.color,
                          }}>{d.label}</span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </Fragment>
              )
            })}

            {/* Reservoirs — only plots once lat/lng exist on the row, see resolveReservoirCoords() above */}
            {isLayerActive('reservoirs') && RESERVOIR_DATA.map((r) => {
              const coords = resolveReservoirCoords(r)
              if (!coords) return null
              const c = r.pct > 90 ? '#ef4444' : r.pct > 75 ? '#f59e0b' : '#06b6d4'
              return (
                <Marker key={r.name} position={coords} icon={squareIcon(c)}>
                  <Popup>
                    <div style={{ fontSize: 12, minWidth: 130 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.name}</div>
                      <div>Storage: <strong>{r.pct}%</strong></div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

            <MapZoomControls />
          </MapContainer>

          {/* Map legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
            background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '10px 14px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)', fontSize: 11,
          }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Legend</div>
            {[
              ['#ef4444','Major Flood Zone'],['#f97316','Minor Flood Zone'],
              ['#eab308','Alert Zone'],['#22c55e','Normal Zone'],
            ].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block', opacity: 0.8 }} />
                <span style={{ color: '#374151' }}>{l}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 6, paddingTop: 6, display: 'flex', gap: 10 }}>
              <span>⬤ Gauge</span>
              <span style={{ color: '#06b6d4' }}>■ Reservoir</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Charts panel ── */}
      <div style={{
        width: 280, flexShrink: 0, background: '#fff',
        borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
        overflowY: 'auto', boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
      }}>

        {/* Status summary */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
            By Alert Status · {activeGauges.length} Stations
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {PIE_DATA.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ color: '#64748b' }}>{d.name}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#1e293b' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Basin rainfall */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>By Basin · Rainfall (mm)</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={[
                { basin: 'Kalu',     mm: 72 },
                { basin: 'Kelani',   mm: 38 },
                { basin: 'Mahaweli', mm: 30 },
                { basin: 'Nilwala',  mm: 55 },
                { basin: 'Walawe',   mm: 48 },
              ]}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="basin" tick={{ fontSize: 10, fill: '#475569' }} width={55} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7 }} />
              <Bar dataKey="mm" radius={[0,4,4,0]}>
                {['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#10b981'].map((c,i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reservoir fill */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Reservoir Storage %</div>
          {RESERVOIR_DATA.map((r) => {
            const c = r.pct > 90 ? '#ef4444' : r.pct > 75 ? '#f59e0b' : '#3b82f6'
            return (
              <div key={r.name} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#374151' }}>{r.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{r.pct}%</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: c, borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent alerts */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Recent Alerts</div>
          {RECENT_ALERTS.slice(0, 4).map((a, i) => (
            <div key={i} style={{
              padding: '8px 0', borderBottom: i < 3 ? '1px solid #f8fafc' : 'none',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.gauge.split(' – ')[0]}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <AlertBadge status={a.level === 'Major Flood' ? 'MAJOR_FLOOD' : a.level === 'Minor Flood' ? 'MINOR_FLOOD' : 'ALERT'} />
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{a.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}