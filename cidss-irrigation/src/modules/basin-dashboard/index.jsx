// src/modules/m5-basin-dashboard/index.jsx
// Design selector — wraps Design 1, 2, 3




// export default function M5BasinDashboardPage() 
 // Design 1 — Professional Light  (inspired by flood management dashboards)
// Clean white cards, prominent alert strip, jurisdiction header, key insights panel
//
// ── LEAFLET SETUP ─────────────────────────────────────────────────────────
// npm install leaflet react-leaflet
// Add once in your app's root (e.g. main.jsx / App.jsx):
//   import 'leaflet/dist/leaflet.css'
// Put srilanka.geo.json next to this file (or adjust the import path below).
// ─────────────────────────────────────────────────────────────────────────

import { useState, Fragment } from 'react'
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
} from './data'
import srilankaGeo from './srilanka.geo.json'

// Sri Lanka bounding box (derived from the simplified boundary file)
const SL_BOUNDS = [[5.7, 79.4], [10.05, 82.1]]   // [[south, west], [north, east]]
const SL_CENTER = [7.87, 80.77]

// ── Fallback coordinates for known stations mentioned in the alert cards ──
// Replace / extend this with the real lat/lng you have for each gauge —
// ideally just add `lat` / `lng` fields directly onto each row in GAUGE_DATA
// in data.js instead of relying on this lookup.
const FALLBACK_COORDS = {
  'Millakanda': [6.5333, 80.1333],   // Kalu Ganga
  'Kalu':        [6.65, 80.25],
  'Kelani':      [6.95, 80.25],
  'Nilwala':     [5.95, 80.55],
  'Walawe':      [6.27, 80.84],
}

function resolveCoords(g) {
  if (typeof g.lat === 'number' && typeof g.lng === 'number') return [g.lat, g.lng]
  const key = Object.keys(FALLBACK_COORDS).find(k => g.name?.includes(k))
  return key ? FALLBACK_COORDS[key] : null
}

const AlertBadge = ({ status, small }) => {
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

// Small control cluster (zoom +/-, reset view) that lives inside MapContainer
// so it can reach the Leaflet map instance via useMap().
function MapControls() {
  const map = useMap()
  const btnStyle = {
    width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff',
    borderRadius: 5, cursor: 'pointer', fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: 6 }}>
      <button style={btnStyle} onClick={() => map.zoomIn()}>🔍+</button>
      <button style={btnStyle} onClick={() => map.zoomOut()}>🔍-</button>
      <button style={btnStyle} onClick={() => map.fitBounds(SL_BOUNDS)}>⛶</button>
    </div>
  )
}

export default function Design1() {
  const [selGauge, setSelGauge] = useState('G01')
  const series = GAUGE_SERIES[selGauge] || GAUGE_SERIES['G01']
  const gauge  = GAUGE_DATA.find(g => g.id === selGauge)

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100%', fontFamily: 'inherit' }}>

      {/* ── Weather / jurisdiction bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '10px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>31°C</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>H:33° L:26° · Humidity 74%</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>⛅ Partly Cloudy</span>
          </div>
          <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#475569' }}>
            <span>🗓 Tue, 17 Jun 2026 · 14:45 LKT</span>
            <span>📍 Western Province · Sri Lanka</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All Basins', 'Kalu', 'Kelani', 'Mahaweli', 'Nilwala'].map((b, i) => (
            <button key={b} style={{
              padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
              background: i === 0 ? '#2563eb' : '#f1f5f9',
              color: i === 0 ? '#fff' : '#64748b',
              border: i === 0 ? 'none' : '1px solid #e2e8f0',
            }}>{b}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 20 }}>

        {/* ── Alert cards row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
          {[
            { type: 'Rainfall Alert', sev: 'Warning', time: '15 min ago', clock: '14:30 LKT',
              date: '17 Jun 2026', title: 'Extremely heavy rainfall alert',
              loc: 'Kalu Basin · Western Province', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
            { type: 'Water Level Alert', sev: 'Danger', time: '1 hour ago', clock: '13:45 LKT',
              date: '17 Jun 2026', title: 'Severe flood situation at Millakanda',
              loc: 'Station · Kalu Ganga', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
            { type: 'Water Discharge Alert', sev: 'Watch', time: '1 day ago', clock: '10:00 LKT',
              date: '16 Jun 2026', title: 'Flood alert — rising discharge',
              loc: 'Barrage · Walawe River', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          ].map((a) => (
            <div key={a.type} style={{
              background: '#fff', borderRadius: 10, border: `1px solid ${a.border}`,
              padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                background: a.color, color: '#fff', borderRadius: 6,
                padding: '4px 10px', fontSize: 12, fontWeight: 700,
                display: 'inline-block', marginBottom: 10,
              }}>{a.type}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.color }}>⚠ {a.sev}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>⏱ {a.time}</span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{a.clock} · {a.date}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>📍 {a.loc}</div>
            </div>
          ))}
        </div>

        {/* ── Main row: Map + Key Insights ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>

          {/* Map — real Sri Lanka boundary via Leaflet */}
          <div style={{
            background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Basin Map — Flood Status</span>
            </div>

            <div style={{ position: 'relative', height: 320 }}>
              <MapContainer
                center={SL_CENTER}
                zoom={6.4}
                minZoom={6.5}
                maxZoom={11}
                maxBounds={SL_BOUNDS}
                maxBoundsViscosity={0.8}
                zoomSnap={0.1}
                scrollWheelZoom={false}
                zoomControl={false}
                attributionControl={false}
                style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 40%, #e0f2fe 100%)',
                }}
              >
                {/* No tile layer on purpose — keeps the clean card look.
                    If you'd rather have a real basemap underneath, add e.g.:
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    (import TileLayer from 'react-leaflet' first) */}

                <GeoJSON
                  data={srilankaGeo}
                  style={() => ({
                    color: '#059669',
                    weight: 1.5,
                    fillColor: '#a7f3d0',
                    fillOpacity: 0.8,
                  })}
                />

                {GAUGE_DATA.map((g) => {
                  const coords = resolveCoords(g)
                  if (!coords) return null
                  const d = ALERT_STATUS[g.status] || ALERT_STATUS.NORMAL
                  const isSelected = g.id === selGauge
                  return (
                    <Fragment key={g.id}>
                      {/* halo */}
                      <CircleMarker
                        center={coords}
                        radius={isSelected ? 16 : 12}
                        pathOptions={{ stroke: false, fillColor: d.dot, fillOpacity: 0.25 }}
                        eventHandlers={{ click: () => setSelGauge(g.id) }}
                      />
                      {/* solid dot */}
                      <CircleMarker
                        center={coords}
                        radius={isSelected ? 7 : 5}
                        pathOptions={{
                          color: '#fff', weight: isSelected ? 2 : 1,
                          fillColor: d.dot, fillOpacity: 1,
                        }}
                        eventHandlers={{ click: () => setSelGauge(g.id) }}
                      >
                        <LeafletTooltip direction="top" offset={[0, -6]}>
                          {g.name}
                        </LeafletTooltip>
                        <Popup>
                          <div style={{ fontSize: 12, minWidth: 140 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
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

                <MapControls />
              </MapContainer>

              {/* Legend */}
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'rgba(255,255,255,0.92)', borderRadius: 7,
                padding: '8px 12px', fontSize: 11,
                display: 'flex', flexDirection: 'column', gap: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 1000,
              }}>
                {[['#dc2626','Major Flood'],['#f97316','Minor Flood'],['#eab308','Alert'],['#22c55e','Normal']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
                    <span style={{ color: '#374151' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Forecast 7-day */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>🌧 Rainfall Forecast</span>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#94a3b8' }}>
                  <span style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>Prediction</span>
                  <span style={{ cursor: 'pointer' }}>Current</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {FORECAST_7DAY.map((d) => (
                  <div key={d.date} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 3 }}>{d.date.split(' ')[0]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700,
                      color: d.rainfall > 60 ? '#dc2626' : d.rainfall > 40 ? '#f59e0b' : '#16a34a',
                    }}>▲ {d.rainfall}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>mm</div>
                    <div style={{ fontSize: 9, marginTop: 3, fontWeight: 600,
                      color: d.rainfall > 60 ? '#dc2626' : d.rainfall > 40 ? '#f59e0b' : '#16a34a',
                    }}>
                      {d.rainfall > 60 ? 'Ext. Heavy' : d.rainfall > 40 ? 'Heavy' : 'Normal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* River watch table */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', flex: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>🌊 Water Level & Discharge</span>
                <span style={{ fontSize: 11, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>View Details →</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Station', 'Current', 'Warning', 'Danger', 'Status'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GAUGE_DATA.slice(0, 5).map((g) => {
                      const d = ALERT_STATUS[g.status]
                      return (
                        <tr key={g.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '7px 8px', fontWeight: 600, color: '#1e293b' }}>{g.name.split(' – ')[0]}</td>
                          <td style={{ padding: '7px 8px', fontWeight: 700, color: g.level > g.threshold ? '#dc2626' : '#0f172a', fontFamily: 'monospace' }}>{g.level.toFixed(2)}</td>
                          <td style={{ padding: '7px 8px', color: '#64748b', fontFamily: 'monospace' }}>{g.threshold.toFixed(1)}</td>
                          <td style={{ padding: '7px 8px', color: '#64748b', fontFamily: 'monospace' }}>{(g.threshold * 1.2).toFixed(1)}</td>
                          <td style={{ padding: '7px 8px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: d.bg, color: d.color }}>{d.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, padding: '6px 10px', background: '#fef2f2', borderRadius: 6, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                ▲ Kalu Ganga at warning level and rising
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom row: Rainfall chart + Reservoir + Alert log ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

          {/* Rainfall chart */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Rainfall by Basin · 7 days</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={RAINFALL_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 7 }} />
                <Bar dataKey="Kalu"   fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="Kelani" fill="#8b5cf6" radius={[3,3,0,0]} />
                <Bar dataKey="Nilwala" fill="#f59e0b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reservoir */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Reservoir Storage</div>
            {RESERVOIR_DATA.map((r) => {
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

          {/* Alert log */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Recent Alerts</span>
              <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
            </div>
            {RECENT_ALERTS.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, marginBottom: 10,
                paddingBottom: 10, borderBottom: i < RECENT_ALERTS.length - 1 ? '1px solid #f8fafc' : 'none',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.gauge}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: a.bg, color: a.color }}>{a.level}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}