// Design 3 — Map-First  (ArcGIS-dashboard style, like reference Image 1)
// Large map dominates, collapsible layer panel on left, charts in right panel

import { useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  GAUGE_DATA, ALERT_STATUS, RAINFALL_DATA, RESERVOIR_DATA, RECENT_ALERTS,
} from './data'

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

const AlertBadge = ({ status }) => {
  const d = ALERT_STATUS[status] || ALERT_STATUS.NORMAL
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 3, background: d.bg, color: d.color }}>
      {d.label}
    </span>
  )
}

export default function Design3() {
  const [layers, setLayers]     = useState(LAYER_ITEMS)
  const [activeTab, setActiveTab] = useState('charts')
  const [selBasin, setSelBasin]   = useState(null)

  const toggleLayer = (id) =>
    setLayers(layers.map(l => l.id === id ? { ...l, active: !l.active } : l))

  const activeGauges = GAUGE_DATA.filter(g => !selBasin || g.basin === selBasin)

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

        {/* SVG Map */}
        <div style={{
          position: 'absolute', inset: 0, top: 44,
          background: 'linear-gradient(160deg, #dbeafe 0%, #bfdbfe 30%, #e0f2fe 60%, #cffafe 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="380" height="480" viewBox="0 0 380 480" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.12))' }}>
            {/* Sri Lanka shape */}
            <path d="M190,30 L225,50 L248,78 L258,112 L265,150 L262,192 L252,232 L238,268 L220,300 L200,328 L178,345 L155,355 L132,348 L112,330 L98,305 L90,275 L87,242 L92,208 L100,172 L112,138 L128,102 L148,72 L168,50 Z"
              fill="#93c5fd" stroke="#2563eb" strokeWidth="2" opacity="0.85" />

            {/* Flood zones */}
            <ellipse cx="185" cy="148" rx="38" ry="28" fill="#ef4444" opacity="0.35" />
            <ellipse cx="210" cy="200" rx="28" ry="20" fill="#f97316" opacity="0.3" />
            <ellipse cx="165" cy="260" rx="24" ry="18" fill="#ef4444" opacity="0.35" />
            <ellipse cx="190" cy="310" rx="20" ry="14" fill="#22c55e" opacity="0.25" />
            <ellipse cx="155" cy="175" rx="18" ry="14" fill="#eab308" opacity="0.3} " />

            {/* River lines */}
            <path d="M190,30 Q185,90 185,148 Q182,200 175,260" stroke="#1d4ed8" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M220,80 Q215,130 210,200 Q205,240 200,300" stroke="#0891b2" strokeWidth="1.5" fill="none" opacity="0.45" />

            {/* Gauge markers */}
            {[
              [185,148,'#ef4444','G01','4.82m'],
              [210,200,'#eab308','G02','3.21m'],
              [165,260,'#ef4444','G08','5.10m'],
              [200,130,'#22c55e','G03','2.10m'],
              [155,175,'#eab308','G05','3.78m'],
              [220,280,'#22c55e','G04','1.95m'],
            ].map(([x,y,c,id,val]) => (
              <g key={id} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r="16" fill={c} opacity="0.2" />
                <circle cx={x} cy={y} r="8"  fill={c} opacity="0.8" />
                <circle cx={x} cy={y} r="3"  fill="#fff" />
                <text x={x+12} y={y-4}  fontSize="9" fill="#1e293b" fontWeight="700">{id}</text>
                <text x={x+12} y={y+7} fontSize="8" fill="#64748b">{val}</text>
              </g>
            ))}

            {/* Reservoir markers */}
            {[[155,100,'#06b6d4'],[225,165,'#06b6d4']].map(([x,y,c],i) => (
              <g key={i}>
                <rect x={x-8} y={y-8} width="16" height="16" rx="3" fill={c} opacity="0.8" />
                <text x={x} y={y+4} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="700">R</text>
              </g>
            ))}
          </svg>

          {/* Map legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
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

          {/* Zoom controls */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {['＋','－','⛶'].map((b) => (
              <button key={b} style={{
                width: 32, height: 32, background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 6, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}>{b}</button>
            ))}
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