// src/modules/m5-basin-dashboard/index.jsx
// M5 — Unified Basin Dashboard  |  Full UI with dummy data

import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

// ─── Dummy data ───────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { label: 'Active Gauges',    value: '47',    unit: 'of 52',  color: '#2563eb', bg: '#eff6ff', icon: '📡', trend: '+2' },
  { label: 'Avg River Level',  value: '3.24',  unit: 'm',      color: '#0891b2', bg: '#ecfeff', icon: '🌊', trend: '+0.12' },
  { label: 'Total Rainfall',   value: '118',   unit: 'mm / 24h', color: '#7c3aed', bg: '#f5f3ff', icon: '🌧️', trend: '+34' },
  { label: 'Reservoirs > 80%', value: '6',     unit: 'of 23',  color: '#d97706', bg: '#fffbeb', icon: '💧', trend: '0' },
  { label: 'Active Alerts',    value: '7',     unit: 'stations', color: '#dc2626', bg: '#fef2f2', icon: '🔔', trend: '+3' },
  { label: 'Forecast Horizon', value: '48',    unit: 'hours',  color: '#059669', bg: '#ecfdf5', icon: '📈', trend: '' },
]

const GAUGE_DATA = [
  { id: 'G01', name: 'Kalu Ganga – Millakanda',   basin: 'Kalu',     level: 4.82, threshold: 4.5,  status: 'MAJOR_FLOOD', trend: '↑' },
  { id: 'G02', name: 'Kelani River – Hanwella',    basin: 'Kelani',   level: 3.21, threshold: 3.8,  status: 'ALERT',       trend: '↑' },
  { id: 'G03', name: 'Mahaweli – Manampitiya',     basin: 'Mahaweli', level: 2.10, threshold: 4.2,  status: 'NORMAL',      trend: '→' },
  { id: 'G04', name: 'Gin Ganga – Baddegama',      basin: 'Gin',      level: 1.95, threshold: 3.5,  status: 'NORMAL',      trend: '↓' },
  { id: 'G05', name: 'Nilwala – Pitabeddara',      basin: 'Nilwala',  level: 3.78, threshold: 3.5,  status: 'MINOR_FLOOD', trend: '↑' },
  { id: 'G06', name: 'Attanagalu Oya – Horombawa', basin: 'Attanagalu', level: 2.45, threshold: 3.0, status: 'NORMAL',    trend: '→' },
  { id: 'G07', name: 'Deduru Oya – Dambulla',      basin: 'Deduru',   level: 0.88, threshold: 2.8,  status: 'NORMAL',      trend: '↓' },
  { id: 'G08', name: 'Walawe – Embilipitiya',      basin: 'Walawe',   level: 5.10, threshold: 4.5,  status: 'MAJOR_FLOOD', trend: '↑' },
]

const ALERT_STATUS = {
  NORMAL:      { label: 'Normal',      color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' },
  ALERT:       { label: 'Alert',       color: '#ca8a04', bg: '#fef9c3', dot: '#eab308' },
  MINOR_FLOOD: { label: 'Minor Flood', color: '#ea580c', bg: '#ffedd5', dot: '#f97316' },
  MAJOR_FLOOD: { label: 'Major Flood', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  CRITICAL:    { label: 'Critical',    color: '#7f1d1d', bg: '#fecaca', dot: '#991b1b' },
}

// 48h gauge level timeseries (hourly samples)
const HOURS = Array.from({ length: 25 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`)
const makeLevel = (base, noise) =>
  HOURS.map((h, i) => ({
    time: h,
    observed: +(base + Math.sin(i * 0.4) * noise + (Math.random() - 0.5) * 0.2).toFixed(2),
    forecast:  +(base + Math.sin(i * 0.4) * noise * 1.1 + 0.15 + (Math.random() - 0.5) * 0.1).toFixed(2),
  }))

const GAUGE_SERIES = {
  G01: makeLevel(4.2, 0.7),
  G02: makeLevel(2.9, 0.5),
  G05: makeLevel(3.4, 0.5),
  G08: makeLevel(4.7, 0.6),
}

// Daily rainfall per basin (last 7 days)
const RAINFALL_DATA = [
  { day: 'Mon', Kalu: 42, Kelani: 28, Mahaweli: 10, Nilwala: 35 },
  { day: 'Tue', Kalu: 18, Kelani: 55, Mahaweli: 5,  Nilwala: 22 },
  { day: 'Wed', Kalu: 65, Kelani: 40, Mahaweli: 18, Nilwala: 48 },
  { day: 'Thu', Kalu: 30, Kelani: 12, Mahaweli: 8,  Nilwala: 30 },
  { day: 'Fri', Kalu: 88, Kelani: 70, Mahaweli: 22, Nilwala: 75 },
  { day: 'Sat', Kalu: 55, Kelani: 45, Mahaweli: 14, Nilwala: 60 },
  { day: 'Sun', Kalu: 72, Kelani: 38, Mahaweli: 30, Nilwala: 55 },
]

// Reservoir storage
const RESERVOIR_DATA = [
  { name: 'Kotmale',    capacity: 174, current: 158, pct: 91 },
  { name: 'Victoria',   capacity: 722, current: 589, pct: 82 },
  { name: 'Randenigala',capacity: 552, current: 408, pct: 74 },
  { name: 'Udawalawe', capacity: 268, current: 162, pct: 60 },
  { name: 'Kalu Ganga',capacity: 49,  current: 46,  pct: 94 },
  { name: 'Rantambe',  capacity: 49,  current: 28,  pct: 57 },
]

// Recent alerts log
const RECENT_ALERTS = [
  { time: '14:32', gauge: 'Kalu Ganga – Millakanda', level: 'Major Flood', value: '4.82 m', basin: 'Kalu' },
  { time: '13:58', gauge: 'Walawe – Embilipitiya',   level: 'Major Flood', value: '5.10 m', basin: 'Walawe' },
  { time: '13:15', gauge: 'Nilwala – Pitabeddara',   level: 'Minor Flood', value: '3.78 m', basin: 'Nilwala' },
  { time: '12:40', gauge: 'Kelani – Hanwella',        level: 'Alert',       value: '3.21 m', basin: 'Kelani' },
  { time: '11:22', gauge: 'Kalu Ganga – Millakanda', level: 'Alert',       value: '4.42 m', basin: 'Kalu' },
]

// ─── Styles (inline for self-contained module) ────────────────────────────────

const s = {
  page:         { fontFamily: 'inherit' },
  pageHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle:    { fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 },
  pageSub:      { fontSize: 13, color: '#64748b', marginTop: 3 },
  lastUpdated:  { fontSize: 12, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px' },

  // grid helpers
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr',     gap: 16 },
  grid3:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  grid6:   { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 },

  // card
  card:    { background: '#fff', borderRadius: 12, border: '1px solid #e8edf2', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardH:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px 0' },
  cardT:   { fontSize: 13, fontWeight: 600, color: '#1e293b' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  cardBody:{ padding: '12px 18px 18px' },

  // stat card
  statCard:   { background: '#fff', borderRadius: 12, border: '1px solid #e8edf2', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  statIcon:   { fontSize: 22, marginBottom: 8, display: 'block' },
  statVal:    { fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 },
  statUnit:   { fontSize: 12, color: '#94a3b8', marginLeft: 4 },
  statLabel:  { fontSize: 12, color: '#64748b', marginTop: 4 },
  statTrend:  { fontSize: 11, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ data }) {
  const isUp = data.trend?.startsWith('+')
  const isDown = data.trend?.startsWith('-')
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${data.color}` }}>
      <span style={s.statIcon}>{data.icon}</span>
      <div>
        <span style={{ ...s.statVal, color: data.color }}>{data.value}</span>
        <span style={s.statUnit}>{data.unit}</span>
      </div>
      <div style={s.statLabel}>{data.label}</div>
      {data.trend && (
        <div style={{ ...s.statTrend, color: isUp ? '#dc2626' : isDown ? '#16a34a' : '#94a3b8' }}>
          {isUp ? '▲' : isDown ? '▼' : '—'} {data.trend} since yesterday
        </div>
      )}
    </div>
  )
}

function AlertBadge({ status }) {
  const def = ALERT_STATUS[status] || ALERT_STATUS.NORMAL
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 5,
      fontSize: 11, fontWeight: 700,
      background: def.bg, color: def.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: def.dot, display: 'inline-block' }} />
      {def.label}
    </span>
  )
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BasinDashboardPage() {
  const [selectedGauge, setSelectedGauge] = useState('G01')
  const [rainfallMode, setRainfallMode] = useState('daily')
  const chartData = GAUGE_SERIES[selectedGauge] || GAUGE_SERIES['G01']
  const gauge = GAUGE_DATA.find(g => g.id === selectedGauge)

  return (
    <div style={s.page}>

      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Basin Dashboard</h1>
          <p style={s.pageSub}>Real-time river gauges, reservoir storage, and rainfall — Sri Lanka</p>
        </div>
        <span style={s.lastUpdated}>⏱ Last updated 14:45 LKT</span>
      </div>

      {/* ── Stat cards ── */}
      <div style={s.grid6}>
        {STAT_CARDS.map((c) => <StatCard key={c.label} data={c} />)}
      </div>

      {/* ── Row 1: Gauge chart + Gauge table ── */}
      <div style={{ ...s.grid2, marginBottom: 16 }}>

        {/* Gauge timeseries chart */}
        <div style={s.card}>
          <div style={s.cardH}>
            <div>
              <div style={s.cardT}>River Level — Forecast vs Observed</div>
              <div style={s.cardSub}>{gauge?.name} · last 48 hours</div>
            </div>
            <select
              value={selectedGauge}
              onChange={(e) => setSelectedGauge(e.target.value)}
              style={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', color: '#374151', cursor: 'pointer' }}
            >
              {GAUGE_DATA.filter(g => GAUGE_SERIES[g.id]).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div style={s.cardBody}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="obsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="90%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="m" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [`${v} m`, n === 'observed' ? 'Observed' : 'Forecast']}
                />
                <ReferenceLine y={gauge?.threshold} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'Threshold', position: 'right', fontSize: 10, fill: '#ef4444' }} />
                <Area type="monotone" dataKey="observed" stroke="#3b82f6" strokeWidth={2} fill="url(#obsGrad)" dot={false} />
                <Line type="monotone" dataKey="forecast"  stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active alerts log */}
        <div style={s.card}>
          <div style={s.cardH}>
            <div>
              <div style={s.cardT}>Active Alert Log</div>
              <div style={s.cardSub}>Today · threshold breaches</div>
            </div>
            <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>
              7 active
            </span>
          </div>
          <div style={{ ...s.cardBody, padding: '8px 0 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Time', 'Gauge', 'Level', 'Reading'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_ALERTS.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '9px 14px', color: '#64748b', fontFamily: 'monospace' }}>{a.time}</td>
                    <td style={{ padding: '9px 14px', color: '#1e293b', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.gauge}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                        background: a.level === 'Major Flood' ? '#fee2e2' : a.level === 'Minor Flood' ? '#ffedd5' : '#fef9c3',
                        color: a.level === 'Major Flood' ? '#dc2626' : a.level === 'Minor Flood' ? '#ea580c' : '#ca8a04',
                      }}>{a.level}</span>
                    </td>
                    <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Row 2: Rainfall bar chart + Reservoir storage ── */}
      <div style={{ ...s.grid2, marginBottom: 16 }}>

        {/* Rainfall */}
        <div style={s.card}>
          <div style={s.cardH}>
            <div>
              <div style={s.cardT}>Rainfall by Basin</div>
              <div style={s.cardSub}>Last 7 days · mm</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['daily', 'cumulative'].map((m) => (
                <button key={m} onClick={() => setRainfallMode(m)} style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontWeight: 600,
                  background: rainfallMode === m ? '#eff6ff' : '#f8fafc',
                  color: rainfallMode === m ? '#2563eb' : '#94a3b8',
                  border: rainfallMode === m ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={s.cardBody}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={RAINFALL_DATA} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" mm" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Kalu"     fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="Kelani"   fill="#8b5cf6" radius={[3,3,0,0]} />
                <Bar dataKey="Mahaweli" fill="#06b6d4" radius={[3,3,0,0]} />
                <Bar dataKey="Nilwala"  fill="#f59e0b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reservoir storage bars */}
        <div style={s.card}>
          <div style={s.cardH}>
            <div>
              <div style={s.cardT}>Reservoir Storage</div>
              <div style={s.cardSub}>Current vs capacity · MCM</div>
            </div>
          </div>
          <div style={s.cardBody}>
            {RESERVOIR_DATA.map((r) => {
              const color = r.pct > 90 ? '#dc2626' : r.pct > 75 ? '#f59e0b' : '#3b82f6'
              return (
                <div key={r.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>
                      {r.pct}% · {r.current} MCM
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${r.pct}%`, borderRadius: 4,
                      background: color, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Gauge status table + Basin summary ── */}
      <div style={{ ...s.grid2, marginBottom: 0 }}>

        {/* Gauge status table */}
        <div style={s.card}>
          <div style={s.cardH}>
            <div>
              <div style={s.cardT}>Gauge Status — All Basins</div>
              <div style={s.cardSub}>Click a row to view timeseries</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Station', 'Basin', 'Level', 'Threshold', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GAUGE_DATA.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => GAUGE_SERIES[g.id] && setSelectedGauge(g.id)}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      cursor: GAUGE_SERIES[g.id] ? 'pointer' : 'default',
                      background: selectedGauge === g.id ? '#eff6ff' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (selectedGauge !== g.id) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (selectedGauge !== g.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '9px 12px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>{g.id}</td>
                    <td style={{ padding: '9px 12px', color: '#1e293b', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</td>
                    <td style={{ padding: '9px 12px', color: '#64748b' }}>{g.basin}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{g.level.toFixed(2)} m</td>
                    <td style={{ padding: '9px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{g.threshold.toFixed(1)} m</td>
                    <td style={{ padding: '9px 12px' }}><AlertBadge status={g.status} /></td>
                    <td style={{ padding: '9px 12px', color: g.trend === '↑' ? '#dc2626' : g.trend === '↓' ? '#16a34a' : '#94a3b8', fontSize: 14, fontWeight: 700 }}>{g.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Basin summary + mini trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Basin overview cards */}
          <div style={s.card}>
            <div style={s.cardH}>
              <div style={s.cardT}>Basin Overview</div>
            </div>
            <div style={{ ...s.cardBody, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { basin: 'Kalu',      gauges: 8,  alerts: 2, rain: 72 },
                { basin: 'Kelani',    gauges: 12, alerts: 1, rain: 38 },
                { basin: 'Mahaweli',  gauges: 15, alerts: 0, rain: 30 },
                { basin: 'Nilwala',   gauges: 6,  alerts: 1, rain: 55 },
              ].map((b) => (
                <div key={b.basin} style={{
                  border: '1px solid #e8edf2', borderRadius: 8, padding: '10px 12px',
                  background: b.alerts > 0 ? '#fffbeb' : '#f8fafc',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{b.basin} Basin</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
                    <div>Gauges: <strong style={{ color: '#0f172a' }}>{b.gauges}</strong></div>
                    <div>Alerts: <strong style={{ color: b.alerts > 0 ? '#dc2626' : '#16a34a' }}>{b.alerts}</strong></div>
                    <div>Rain: <strong style={{ color: '#0f172a' }}>{b.rain} mm</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day system-wide rainfall trend */}
          <div style={s.card}>
            <div style={s.cardH}>
              <div style={s.cardT}>System-wide Rainfall Trend</div>
              <div style={s.cardSub}>7-day total · all basins</div>
            </div>
            <div style={s.cardBody}>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart
                  data={RAINFALL_DATA.map(d => ({ day: d.day, total: d.Kalu + d.Kelani + d.Mahaweli + d.Nilwala }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="10%" stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="90%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" mm" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => [`${v} mm`, 'Total rainfall']} />
                  <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} fill="url(#rainGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}