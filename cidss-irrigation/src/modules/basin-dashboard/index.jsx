// Design 1 — Professional Light (Updated Live Notices, Table Spill Data & Layout Fixes)
import { useState, useMemo, Fragment } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  MapContainer, GeoJSON, CircleMarker, Popup,
  Tooltip as LeafletTooltip, useMap,
} from 'react-leaflet'
import {
  GAUGE_DATA, ALERT_STATUS, GAUGE_SERIES, RAINFALL_DATA,
  RESERVOIR_DATA, RECENT_ALERTS, FORECAST_7DAY,
  ACTIVE_ALERTS, HYDRO_LAYERS, METEO_LAYERS,
  RAINFALL_FORECAST_BASIN, BASINS,
} from './data'
import slmap from "./srilanka.geo.json"

// ─── Constants ────────────────────────────────────────────────────────────────
const SL_BOUNDS = [[5.7, 79.4], [10.05, 82.1]]
const SL_CENTER = [7.87, 80.77]

const FALLBACK_COORDS = {
  'Millakanda': [6.533, 80.133],
  'Hanwella':   [6.902, 80.082],
  'Manampitiya':[7.888, 81.098],
  'Baddegama':  [6.183, 80.183],
  'Pitabeddara':[5.983, 80.533],
  'Horombawa':  [7.133, 80.016],
  'Dambulla':   [7.866, 80.649],
  'Embilipitiya':[6.333, 80.850],
  'Kotmale':    [6.998, 80.633],
  'Ratnapura':  [6.683, 80.400],
  'Victoria':   [7.216, 80.783],
}

function resolveCoords(g) {
  if (typeof g.lat === 'number' && typeof g.lng === 'number') return [g.lat, g.lng]
  const key = Object.keys(FALLBACK_COORDS).find(k => g.name?.includes(k))
  return key ? FALLBACK_COORDS[key] : null
}

const ALL_SEARCHABLE = [
  ...GAUGE_DATA.map(g => ({ id: g.id, label: g.name, sub: `${g.basin} Basin · ${g.type}`, type: 'gauge' })),
  ...BASINS.map(b => ({ id: b.id, label: b.name, sub: `${b.gauges} gauges · ${b.area} km²`, type: 'basin' })),
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function AlertBadge({ status, small }) {
  const d = ALERT_STATUS[status] || ALERT_STATUS.NORMAL
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 5, fontSize: small ? 10 : 11, fontWeight: 700,
      background: d.bg, color: d.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.dot }} />
      {d.label}
    </span>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

function MapControls() {
  const map = useMap()
  const btn = {
    width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff',
    borderRadius: 5, cursor: 'pointer', fontSize: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: 4 }}>
      <button style={btn} onClick={() => map.zoomIn()}>+</button>
      <button style={btn} onClick={() => map.zoomOut()}>−</button>
      <button style={btn} onClick={() => map.fitBounds(SL_BOUNDS)}>⛶</button>
    </div>
  )
}

function SearchBox({ onSelect }) {
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return ALL_SEARCHABLE.filter(
      s => s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [query])

  const select = (item) => {
    setQuery(item.label)
    setOpen(false)
    onSelect(item)
  }

  return (
    <div style={{ position: 'relative', width: 260 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '6px 10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>🔍</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Search basin or station…"
          style={{
            border: 'none', outline: 'none', fontSize: 12,
            color: '#1e293b', background: 'transparent', flex: 1,
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
          marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 280, overflowY: 'auto',
        }}>
          {results.map(r => (
            <div key={r.id} onMouseDown={() => select(r)}
              style={{
                padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontSize: 16 }}>{r.type === 'gauge' ? '📡' : '🗺️'}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{r.label}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{r.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LayerPanel({ mapMode, hydroLayers, setHydroLayers, meteoLayers, setMeteoLayers }) {
  const layers = mapMode === 'hydro' ? hydroLayers : meteoLayers
  const setLayers = mapMode === 'hydro' ? setHydroLayers : setMeteoLayers

  const toggle = (id) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l))

  return (
    <div style={{
      position: 'absolute', bottom: 44, left: 10, zIndex: 1000,
      background: 'rgba(255,255,255,0.97)', borderRadius: 9,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      minWidth: 180, maxHeight: 240, overflowY: 'auto',
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 8 }}>
        {mapMode === 'hydro' ? 'Hydrological Layers' : 'Meteorological Layers'}
      </div>
      {layers.map(l => (
        <div key={l.id}
          onClick={() => toggle(l.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: 3, flexShrink: 0,
            background: l.active ? l.color : 'transparent',
            border: `2px solid ${l.color}`,
            transition: 'background 0.15s',
          }} />
          <span style={{ fontSize: 11, color: l.active ? '#1e293b' : '#94a3b8' }}>{l.label}</span>
        </div>
      ))}
    </div>
  )
}

function AlertsRow({ alerts, filterBasin }) {
  const [expanded, setExpanded]   = useState(null)

  const filtered = filterBasin
    ? alerts.filter(a => a.basin === filterBasin)
    : alerts

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Active Alerts</span>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12,
          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
        }}>{alerts.length} active</span>
        {filtered.length !== alerts.length && (
          <span style={{ fontSize: 10, color: '#94a3b8' }}>{filtered.length} in {filterBasin} basin</span>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 12, 
        overflowX: 'auto', 
        paddingBottom: 6,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch'
      }}>
        {filtered.map(a => (
          <div key={a.id}
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            style={{
              flex: '0 0 290px',
              scrollSnapAlign: 'start',
              background: '#fff', borderRadius: 10,
              border: `1px solid ${a.border}`,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              cursor: 'pointer', transition: 'box-shadow 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{
                background: a.color, color: '#fff', borderRadius: 6,
                padding: '3px 9px', fontSize: 11, fontWeight: 700, display: 'inline-block',
              }}>{a.type}</div>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>⏱ {a.time}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: a.color }}>⚠ {a.severity}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{a.clock} · {a.date}</span>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: expanded === a.id ? 10 : 0 }}>📍 {a.loc}</div>

            {expanded === a.id && (
              <div style={{ borderTop: `1px solid ${a.border}`, paddingTop: 10, marginTop: 6 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Affected stations:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {a.stations.map(sid => {
                    const g = GAUGE_DATA.find(x => x.id === sid)
                    return g ? (
                      <span key={sid} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: '#f1f5f9', color: '#475569', fontWeight: 600,
                      }}>{g.name.split(' – ')[0]}</span>
                    ) : null
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{
                    flex: 1, padding: '6px', fontSize: 11, fontWeight: 600,
                    background: a.color, color: '#fff', border: 'none',
                    borderRadius: 6, cursor: 'pointer',
                  }}>Acknowledge</button>
                  <button style={{
                    flex: 1, padding: '6px', fontSize: 11, fontWeight: 600,
                    background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0',
                    borderRadius: 6, cursor: 'pointer',
                  }}>View Details</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Rainfall forecast panel ──────────────────────────────────────────────────
function RainfallForecastPanel() {
  const [forecastTab, setForecastTab] = useState('daily')
  const [selBasin, setSelBasin]       = useState('Kalu')

  const intensityColor = (mm) =>
    mm > 64 ? '#dc2626' : mm > 44 ? '#f97316' : mm > 15 ? '#f59e0b' : '#16a34a'

  return (
    <Card>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>🌧 Rainfall Forecast</span>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2, gap: 2 }}>
          {[['daily','7-Day'],['basin','By Basin']].map(([k,l]) => (
            <button key={k} onClick={() => setForecastTab(k)} style={{
              padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: forecastTab === k ? '#fff' : 'transparent',
              color: forecastTab === k ? '#2563eb' : '#64748b',
              boxShadow: forecastTab === k ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {forecastTab === 'daily' ? (
          <>
            {/* 7-day icon forecast — Using date instead of day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 14 }}>
              {FORECAST_7DAY.map(d => (
                <div key={d.date} style={{
                  textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                  background: '#f8fafc', border: '1px solid #f1f5f9',
                }}>
                  <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4, fontWeight: 700 }}>
                    {d.date}
                  </div>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: intensityColor(d.rainfall) }}>
                    {d.rainfall}
                  </div>
                  <div style={{ fontSize: 8, color: '#94a3b8' }}>mm</div>
                  <div style={{
                    fontSize: 8, marginTop: 4, fontWeight: 700,
                    color: intensityColor(d.rainfall),
                    background: intensityColor(d.rainfall) + '15',
                    borderRadius: 3, padding: '1px 3px',
                  }}>
                    {d.intensity}
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={FORECAST_7DAY} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
                barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7 }}
                  formatter={v => [`${v} mm`, 'Forecast']} />
                <Bar dataKey="rainfall" radius={[3,3,0,0]} fill="#3b82f6">
                  {FORECAST_7DAY.map((d, i) => (
                    <rect key={i} fill={intensityColor(d.rainfall)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <>
            {/* Horizontal Track arrangement for selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {['Kalu','Kelani','Mahaweli','Nilwala','Walawe'].map(b => (
                <button key={b} onClick={() => setSelBasin(b)} style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 600,
                  borderRadius: 5, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                  background: selBasin === b ? '#2563eb' : '#f1f5f9',
                  color: selBasin === b ? '#fff' : '#64748b',
                }}>{b}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={RAINFALL_FORECAST_BASIN} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
                barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} unit=" mm" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7 }} />
                <Bar dataKey={selBasin} fill="#3b82f6" radius={[3,3,0,0]} name={`${selBasin} Basin`} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, padding: '6px 10px', background: '#eff6ff',
              borderRadius: 6, fontSize: 11, color: '#2563eb' }}>
              📊 {selBasin} Basin — 7-day forecast total: {
                RAINFALL_FORECAST_BASIN.reduce((s,d) => s + (d[selBasin] || 0), 0)
              } mm
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Design1() {
  const [selGauge, setSelGauge]       = useState('G01')
  const [mapMode, setMapMode]         = useState('hydro')
  const [showLayerPanel, setLayerPanel] = useState(false)
  const [filterBasin, setFilterBasin]   = useState(null)
  const [hydroLayers, setHydroLayers]   = useState(
    HYDRO_LAYERS.map(l => ({ ...l, active: l.default }))
  )
  const [meteoLayers, setMeteoLayers]   = useState(
    METEO_LAYERS.map(l => ({ ...l, active: l.default }))
  )

  const series  = GAUGE_SERIES[selGauge] || GAUGE_SERIES['G01']
  const gauge   = GAUGE_DATA.find(g => g.id === selGauge)

  const handleSearch = (item) => {
    if (item.type === 'gauge') {
      const g = GAUGE_DATA.find(x => x.id === item.id)
      if (g) { setSelGauge(g.id); setFilterBasin(g.basin) }
    } else {
      setFilterBasin(item.id.charAt(0).toUpperCase() + item.id.slice(1))
    }
  }

  const activeLayers = hydroLayers.filter(l => l.active).map(l => l.id)
  const showGauges     = activeLayers.includes('gauges')
  const showReservoirs = activeLayers.includes('reservoirs')
  const showRainGauges = meteoLayers.find(l => l.id === 'rainGauge')?.active

  const visibleMarkers = GAUGE_DATA.filter(g => {
    if (g.type === 'river')     return showGauges
    if (g.type === 'reservoir') return showReservoirs
    if (g.type === 'rain')      return mapMode === 'meteo' && showRainGauges
    return true
  })

  // Injection of custom animations for the marquee ticker effect
  const marqueeStyle = `
    @keyframes marquee {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }
  `

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100%', fontFamily: 'inherit' }}>
      <style>{marqueeStyle}</style>

      {/* ── Top control bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexWrap: 'nowrap', overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>31°C</span>
            <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>H:33° L:26° · Humidity 74%</span>
            <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>⛅ Partly Cloudy</span>
          </div>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>🗓 Tue, 17 Jun 2026 · 14:45 LKT</span>
          <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>📍 Sri Lanka</span>
        </div>

        <div style={{ flexShrink: 0 }}>
          <SearchBox onSelect={handleSearch} />
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {[null,'Kalu','Kelani','Mahaweli','Nilwala','Walawe'].map((b) => (
            <button key={b || 'all'} onClick={() => setFilterBasin(b)} style={{
              padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: filterBasin === b ? '#2563eb' : '#f1f5f9',
              color: filterBasin === b ? '#fff' : '#64748b',
              border: filterBasin === b ? 'none' : '1px solid #e2e8f0',
            }}>{b || 'All Basins'}</button>
          ))}
        </div>
      </div>

      {/* ── Running Text / Update Notice Window ── */}
      <div style={{
        background: '#0f172a', color: '#f8fafc', overflow: 'hidden',
        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
        height: 32, boxShadow: 'inset 0 -1px 0 0 #334155'
      }}>
        <div style={{
          background: '#e11d48', color: '#fff', padding: '0 12px',
          height: '100%', display: 'flex', alignItems: 'center',
          fontSize: 11, fontWeight: 800, zIndex: 10, letterSpacing: '0.05em'
        }}>
          LIVE UPDATES
        </div>
        <div style={{
          display: 'inline-block', paddingLeft: '100%',
          animation: 'marquee 25s linear infinite'
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, marginRight: 50 }}>
            ⚠️ <strong>Kelani Ganga:</strong> Minor flood warning extended for low-lying areas of Hanwella and Kaduwela.
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, marginRight: 50 }}>
            🌧️ <strong>Meteo Dept:</strong> Heavy rainfall above 100mm expected in South-Western catchments within next 24 hours.
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, marginRight: 50 }}>
            🌊 <strong>Reservoir Spill:</strong> Victoria and Kukuleganga gates opened. Downstream populations advised to maintain high vigilance.
          </span>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        <AlertsRow alerts={ACTIVE_ALERTS} filterBasin={filterBasin} />

        {/* ── Main row: Map + Right panels ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(300px, 55%, 700px) 1fr',
          gap: 14, marginBottom: 14,
          alignItems: 'start',
        }}>

          {/* ── Map ── */}
          <Card>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                Basin Map — {mapMode === 'hydro' ? 'Hydrological' : 'Meteorological'} View
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 7, padding: 2, gap: 2 }}>
                  {[['hydro','🌊 Hydro'],['meteo','🌧 Meteo']].map(([k,l]) => (
                    <button key={k} onClick={() => { setMapMode(k); setLayerPanel(false) }} style={{
                      padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 5,
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      background: mapMode === k ? '#fff' : 'transparent',
                      color: mapMode === k ? '#2563eb' : '#64748b',
                      boxShadow: mapMode === k ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    }}>{l}</button>
                  ))}
                </div>
                <button onClick={() => setLayerPanel(v => !v)} style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 600,
                  borderRadius: 6, border: '1px solid #e2e8f0',
                  background: showLayerPanel ? '#eff6ff' : '#fff',
                  color: showLayerPanel ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                }}>
                  ☰ Layers
                </button>
              </div>
            </div>

            <div style={{ padding: '6px 14px', background: '#f8fafc',
              borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(mapMode === 'hydro' ? hydroLayers : meteoLayers)
                .filter(l => l.active)
                .map(l => (
                  <span key={l.id} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                    background: l.color + '18', color: l.color,
                    border: `1px solid ${l.color}44`,
                  }}>{l.label}</span>
                ))}
            </div>

            <div style={{ position: 'relative', height: 380 }}>
              <MapContainer
                center={SL_CENTER} zoom={6.4} minZoom={6} maxZoom={11}
                maxBounds={SL_BOUNDS} maxBoundsViscosity={0.8}
                zoomSnap={0.1} scrollWheelZoom={false}
                zoomControl={false} attributionControl={false}
                style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #e0f2fe 100%)',
                }}
              >
                <GeoJSON
                  // data={{
                  //   type: 'Feature',
                  //   geometry: {
                  //     type: 'Polygon',
                  //     coordinates: [[
                  //       [79.65,9.82],[80.15,9.85],[80.50,9.70],[80.82,9.35],[81.20,8.90],
                  //       [81.62,8.42],[81.88,7.95],[81.90,7.40],[81.72,6.90],[81.30,6.40],
                  //       [80.90,6.00],[80.40,5.92],[80.05,6.05],[79.70,6.40],[79.45,6.85],
                  //       [79.70,7.45],[79.55,7.98],[79.65,8.55],[79.80,9.15],[79.65,9.82],
                  //     ]],
                  //   },
                  // }}
                  data={ slmap}
                  style={() => ({
                    color: '#059669', weight: 1.5,
                    fillColor: '#a7f3d0', fillOpacity: 0.75,
                  })}
                />

                {visibleMarkers.map(g => {
                  const coords = resolveCoords(g)
                  if (!coords) return null
                  const d = ALERT_STATUS[g.status] || ALERT_STATUS.NORMAL
                  const isSelected = g.id === selGauge
                  const isRain = g.type === 'rain'
                  const isRes  = g.type === 'reservoir'
                  return (
                    <Fragment key={g.id}>
                      <CircleMarker center={coords} radius={isSelected ? 16 : 12}
                        pathOptions={{ stroke: false, fillColor: d.dot, fillOpacity: 0.2 }}
                        eventHandlers={{ click: () => !isRain && !isRes && setSelGauge(g.id) }} />
                      <CircleMarker
                        center={coords}
                        radius={isRes ? 8 : isRain ? 6 : (isSelected ? 7 : 5)}
                        pathOptions={{
                          color: '#fff', weight: isSelected ? 2 : 1,
                          fillColor: isRes ? '#8b5cf6' : isRain ? '#06b6d4' : d.dot,
                          fillOpacity: 1,
                        }}
                        eventHandlers={{ click: () => !isRain && !isRes && setSelGauge(g.id) }}
                      >
                        <LeafletTooltip direction="top" offset={[0, -6]}>
                          <span style={{ fontSize: 11 }}>
                            {g.name}
                            {isRain && ` · ${g.rain24h} mm/24h`}
                            {!isRain && !isRes && ` · ${g.level?.toFixed(2)} m`}
                            {isRes && ` · ${g.level}% full`}
                          </span>
                        </LeafletTooltip>
                        <Popup>
                          <div style={{ fontSize: 12, minWidth: 160 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>{g.name}</div>
                            {!isRain && !isRes && (
                              <>
                                <div>Level: <strong>{g.level?.toFixed(2)} m</strong></div>
                                <div>Threshold: {g.threshold?.toFixed(1)} m</div>
                                <div>Trend: {g.trend}</div>
                              </>
                            )}
                            {isRain && <div>Rainfall 24h: <strong>{g.rain24h} mm</strong></div>}
                            {isRes  && <div>Storage: <strong>{g.level}%</strong></div>}
                            <div style={{ marginTop: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px',
                                borderRadius: 4, background: d.bg, color: d.color }}>{d.label}</span>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </Fragment>
                  )
                })}

                <MapControls />

                {showLayerPanel && (
                  <LayerPanel
                    mapMode={mapMode}
                    hydroLayers={hydroLayers} setHydroLayers={setHydroLayers}
                    meteoLayers={meteoLayers} setMeteoLayers={setMeteoLayers}
                  />
                )}
              </MapContainer>

              {/* Legend shifted to the RIGHT side */}
              <div style={{
                position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
                background: 'rgba(255,255,255,0.95)', borderRadius: 8,
                padding: '8px 12px', fontSize: 11,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {mapMode === 'hydro' ? (
                  <>
                    {[['#dc2626','Major Flood'],['#f97316','Minor Flood'],
                      ['#eab308','Alert'],['#22c55e','Normal']].map(([c,l]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%',
                          background: c, display: 'inline-block' }} />
                        <span style={{ color: '#374151' }}>{l}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%',
                        background: '#8b5cf6', display: 'inline-block' }} />
                      <span style={{ color: '#374151' }}>Reservoir</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Rainfall 24h</div>
                    {[['#dc2626','> 100 mm'],['#f97316','65–100 mm'],
                      ['#f59e0b','30–65 mm'],['#22c55e','< 30 mm']].map(([c,l]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%',
                          background: c, display: 'inline-block' }} />
                        <span style={{ color: '#374151' }}>{l}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%',
                        background: '#06b6d4', display: 'inline-block' }} />
                      <span style={{ color: '#374151' }}>Rain Gauge</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* ── Right panel stack ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <RainfallForecastPanel />

            {/* River watch table with Up/Down Spill details */}
            <Card>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>🌊 Water Level & Discharge</span>
                <span style={{ fontSize: 11, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View All →</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Station','Current','Warning','Danger','Up Spill','Down Spill','Status'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left',
                          color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GAUGE_DATA.filter(g => g.type === 'river')
                      .filter(g => !filterBasin || g.basin === filterBasin)
                      .slice(0, 6)
                      .map(g => {
                        const d = ALERT_STATUS[g.status]
                        // Mock spill indicators calculated relative to threshold levels
                        const upSpill = (g.level * 1.05).toFixed(2);
                        const downSpill = (g.level * 0.92).toFixed(2);
                        return (
                          <tr key={g.id}
                            onClick={() => GAUGE_SERIES[g.id] && setSelGauge(g.id)}
                            style={{
                              borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                              background: selGauge === g.id ? '#eff6ff' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '7px 10px', fontWeight: 600, color: '#1e293b',
                              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {g.name.split(' – ')[0]}
                            </td>
                            <td style={{ padding: '7px 10px', fontWeight: 700, fontFamily: 'monospace',
                              color: g.level > g.threshold ? '#dc2626' : '#0f172a' }}>
                              {g.level.toFixed(2)}
                            </td>
                            <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace' }}>
                              {g.threshold.toFixed(1)}
                            </td>
                            <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace' }}>
                              {(g.threshold * 1.2).toFixed(1)}
                            </td>
                            {/* Up Spill data */}
                            <td style={{ padding: '7px 10px', color: '#475569', fontFamily: 'monospace' }}>
                              {upSpill} m³/s
                            </td>
                            {/* Down Spill data */}
                            <td style={{ padding: '7px 10px', color: '#475569', fontFamily: 'monospace' }}>
                              {downSpill} m³/s
                            </td>
                            <td style={{ padding: '7px 10px' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px',
                                borderRadius: 4, background: d.bg, color: d.color }}>{d.label}</span>
                            </td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '8px 12px', background: '#fef2f2',
                fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                ▲ {GAUGE_DATA.filter(g => g.status === 'MAJOR_FLOOD').length} stations at Major Flood level
              </div>
            </Card>
          </div>
        </div>

        {/* ── Selected gauge chart (With Observed Data Points Highlighted) ── */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                River Level — {gauge?.name}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 10 }}>
                Forecast vs Observed (with explicit timeline observation points) · 48h
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertBadge status={gauge?.status} small />
              <select
                value={selGauge}
                onChange={e => setSelGauge(e.target.value)}
                style={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 6,
                  padding: '4px 8px', color: '#374151', cursor: 'pointer' }}
              >
                {GAUGE_DATA.filter(g => g.type === 'river' && GAUGE_SERIES[g.id]).map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="90%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="m" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [`${v} m`, n === 'observed' ? 'Observed' : 'Forecast']} />
                <ReferenceLine y={gauge?.threshold}
                  stroke="#ef4444" strokeDasharray="4 3"
                  label={{ value: `Threshold ${gauge?.threshold}m`, position: 'right', fontSize: 9, fill: '#ef4444' }} />
                {/* Enabled explicit structural dynamic data point circles on the observed line */}
                <Area type="monotone" dataKey="observed" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#obsGrad)" dot={{ r: 3, strokeWidth: 1 }} name="observed" />
                <Area type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2}
                  strokeDasharray="5 3" fill="none" dot={false} name="forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── Bottom row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>

          {/* Fixed Observed Rainfall · 7 days layout alignment (Now touches the container base line) */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Observed Rainfall · 7 days</span>
            </div>
            <div style={{ flex: 1, padding: '12px 14px 0px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={RAINFALL_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} unit=" mm" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7 }} />
                  <Bar dataKey="Kalu"    fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="Kelani"  fill="#8b5cf6" radius={[3,3,0,0]} />
                  <Bar dataKey="Nilwala" fill="#f59e0b" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Reservoir Storage */}
          <Card>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Reservoir Storage</span>
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              {RESERVOIR_DATA.map(r => {
                const c = r.pct > 90 ? '#dc2626' : r.pct > 75 ? '#f59e0b' : '#3b82f6'
                return (
                  <div key={r.name} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{r.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{r.pct}%</span>
                    </div>
                    <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.pct}%`, background: c, borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Alert log */}
          <Card>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Recent Alerts</span>
              <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {RECENT_ALERTS
                .filter(a => !filterBasin || a.basin === filterBasin)
                .map((a, i, arr) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '8px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%',
                      background: a.color, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.gauge}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 3, background: a.bg, color: a.color }}>{a.level}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}