// src/modules/m4-forecast-chart/index.jsx
// M4 — Forecast vs Observed Chart Overlay
// Dual-line charts per gauge: observed (solid) vs forecast horizons (dashed)
// All dummy data — wire to /api/v1/forecast and /api/v1/gauges later

import { useState, useMemo } from 'react'
import {
  ComposedChart, Line, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Brush,
} from 'recharts'

// ─── Dummy data generators ────────────────────────────────────────────────────

const HOURS_48 = Array.from({ length: 49 }, (_, i) => {
  const h = i % 24
  const day = i < 24 ? 'Today' : 'Tomorrow'
  return `${day} ${String(h).padStart(2,'0')}:00`
})

function makeObserved(base, amp, drift = 0) {
  return HOURS_48.map((label, i) => ({
    label,
    observed: +(base + amp * Math.sin(i * 0.28) + drift * i * 0.012 + (Math.random() - 0.5) * 0.12).toFixed(3),
  }))
}

function addForecasts(observed, offsets = { t6: 0.15, t12: 0.28, t24: 0.42, t48: 0.55 }) {
  return observed.map((d, i) => ({
    ...d,
    'T+6h':  i >= 42 ? undefined : +(d.observed + offsets.t6  + (Math.random()-0.5)*0.08).toFixed(3),
    'T+12h': i >= 36 ? undefined : +(d.observed + offsets.t12 + (Math.random()-0.5)*0.10).toFixed(3),
    'T+24h': i >= 24 ? undefined : +(d.observed + offsets.t24 + (Math.random()-0.5)*0.14).toFixed(3),
    'T+48h': i >= 0  ? undefined : +(d.observed + offsets.t48 + (Math.random()-0.5)*0.18).toFixed(3),
  }))
}

const GAUGES = [
  {
    id: 'G01', name: 'Kalu Ganga – Millakanda', basin: 'Kalu',
    threshold: { alert: 3.5, minor: 4.0, major: 4.5 },
    unit: 'm', status: 'MAJOR_FLOOD',
    data: addForecasts(makeObserved(4.2, 0.65, 0.08), { t6:0.18, t12:0.32, t24:0.50, t48:0.70 }),
    modelRun: '14:00 LKT · 17 Jun 2026', nse: 0.87, rmse: 0.14,
  },
  {
    id: 'G02', name: 'Kelani River – Hanwella', basin: 'Kelani',
    threshold: { alert: 3.0, minor: 3.5, major: 3.8 },
    unit: 'm', status: 'ALERT',
    data: addForecasts(makeObserved(2.9, 0.45, 0.04), { t6:0.10, t12:0.20, t24:0.32, t48:0.45 }),
    modelRun: '14:00 LKT · 17 Jun 2026', nse: 0.91, rmse: 0.09,
  },
  {
    id: 'G03', name: 'Mahaweli – Manampitiya', basin: 'Mahaweli',
    threshold: { alert: 3.2, minor: 3.8, major: 4.2 },
    unit: 'm', status: 'NORMAL',
    data: addForecasts(makeObserved(2.1, 0.30, 0.01), { t6:0.05, t12:0.10, t24:0.15, t48:0.20 }),
    modelRun: '14:00 LKT · 17 Jun 2026', nse: 0.94, rmse: 0.06,
  },
  {
    id: 'G04', name: 'Nilwala – Pitabeddara', basin: 'Nilwala',
    threshold: { alert: 3.0, minor: 3.5, major: 4.0 },
    unit: 'm', status: 'MINOR_FLOOD',
    data: addForecasts(makeObserved(3.5, 0.40, 0.05), { t6:0.12, t12:0.22, t24:0.38, t48:0.52 }),
    modelRun: '14:00 LKT · 17 Jun 2026', nse: 0.88, rmse: 0.11,
  },
  {
    id: 'G05', name: 'Walawe – Embilipitiya', basin: 'Walawe',
    threshold: { alert: 3.8, minor: 4.2, major: 4.5 },
    unit: 'm', status: 'MAJOR_FLOOD',
    data: addForecasts(makeObserved(4.7, 0.55, 0.10), { t6:0.20, t12:0.38, t24:0.58, t48:0.80 }),
    modelRun: '14:00 LKT · 17 Jun 2026', nse: 0.85, rmse: 0.17,
  },
  {
    id: 'G06', name: 'Gin Ganga – Baddegama', basin: 'Gin',
    threshold: { alert: 2.8, minor: 3.2, major: 3.8 },
    unit: 'm', status: 'NORMAL',
    data: addForecasts(makeObserved(1.9, 0.25, 0.00), { t6:0.04, t12:0.08, t24:0.12, t48:0.16 }),
    modelRun: '14:00 LKT · 17 Jun 2026', nse: 0.96, rmse: 0.04,
  },
]

// Error timeseries — diff between observed and T+6 forecast
function buildErrorSeries(data) {
  return data.slice(0, 42).map(d => ({
    label: d.label,
    error: d['T+6h'] != null ? +(d['T+6h'] - d.observed).toFixed(3) : null,
  })).filter(d => d.error !== null)
}

// ─── Alert level config ────────────────────────────────────────────────────────
const ALERT_STATUS = {
  NORMAL:      { label: 'Normal',      color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' },
  ALERT:       { label: 'Alert',       color: '#ca8a04', bg: '#fef9c3', dot: '#eab308' },
  MINOR_FLOOD: { label: 'Minor Flood', color: '#ea580c', bg: '#ffedd5', dot: '#f97316' },
  MAJOR_FLOOD: { label: 'Major Flood', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: '1px solid #e8edf2',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden', ...style,
    }}>{children}</div>
  )
}

function CardHeader({ title, sub, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '14px 18px 0',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ status }) {
  const d = ALERT_STATUS[status] || ALERT_STATUS.NORMAL
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 5,
      fontSize: 11, fontWeight: 700,
      background: d.bg, color: d.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.dot }} />
      {d.label}
    </span>
  )
}

function MetricPill({ label, value, good }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 16px',
      background: good ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${good ? '#bbf7d0' : '#fecaca'}`,
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: good ? '#16a34a' : '#dc2626', fontFamily: 'monospace' }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

// Custom tooltip for main chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: 12, minWidth: 180,
    }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        p.value != null && (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
            <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{p.value.toFixed(3)} m</span>
          </div>
        )
      ))}
    </div>
  )
}

// ─── Horizon toggle ───────────────────────────────────────────────────────────
const HORIZONS = [
  { key: 'T+6h',  color: '#f59e0b', dash: '8 3',  label: 'T+6h' },
  { key: 'T+12h', color: '#8b5cf6', dash: '6 3',  label: 'T+12h' },
  { key: 'T+24h', color: '#06b6d4', dash: '4 3',  label: 'T+24h' },
  { key: 'T+48h', color: '#ec4899', dash: '2 3',  label: 'T+48h' },
]

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function M4ForecastChartPage() {
  const [selId, setSelId]           = useState('G01')
  const [activeHorizons, setHorizons] = useState(['T+6h', 'T+12h', 'T+24h'])
  const [showError, setShowError]   = useState(false)
  const [brushRange, setBrushRange] = useState(null)

  const gauge    = GAUGES.find(g => g.id === selId)
  const errData  = useMemo(() => buildErrorSeries(gauge.data), [gauge])
  const maxError = Math.max(...errData.map(d => Math.abs(d.error)))

  const toggleHorizon = (key) =>
    setHorizons(prev =>
      prev.includes(key) ? prev.filter(h => h !== key) : [...prev, key]
    )

  // Deviation at current time (last observed point)
  const lastObs = gauge.data[gauge.data.length - 1]
  const lastT6  = gauge.data.find(d => d['T+6h'] != null && gauge.data.indexOf(d) >= 40)
  const deviation = lastT6 ? +(lastT6['T+6h'] - lastObs.observed).toFixed(3) : null

  // Tick X axis labels — show every 6th
  const xTick = (val) => {
    const parts = val.split(' ')
    if (!parts[1]) return ''
    const [h] = parts[1].split(':')
    return parseInt(h) % 6 === 0 ? parts[1] : ''
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Forecast vs Observed
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
            HEC-RAS model output overlaid on live gauge readings · 48-hour horizon
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Model run:</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#2563eb',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 6, padding: '4px 10px',
          }}>
            📊 {gauge.modelRun}
          </span>
        </div>
      </div>

      {/* ── Gauge selector cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 18 }}>
        {GAUGES.map((g) => {
          const d = ALERT_STATUS[g.status] || ALERT_STATUS.NORMAL
          const isActive = g.id === selId
          return (
            <div
              key={g.id}
              onClick={() => setSelId(g.id)}
              style={{
                background: isActive ? '#fff' : '#f8fafc',
                border: isActive ? `2px solid #2563eb` : '1px solid #e2e8f0',
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                boxShadow: isActive ? '0 2px 12px rgba(37,99,235,0.15)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 4,
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.basin} · {g.id}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.name.split(' – ')[0]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: d.color, fontFamily: 'monospace' }}>
                  {g.data[g.data.length - 1]?.observed.toFixed(2)}m
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.dot, display: 'inline-block' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Main chart card ── */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title={`${gauge.name} — River Level · Forecast vs Observed`}
          sub={`Basin: ${gauge.basin} · Flood thresholds: Alert ${gauge.threshold.alert}m · Minor ${gauge.threshold.minor}m · Major ${gauge.threshold.major}m`}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Horizon toggles */}
            {HORIZONS.map(h => (
              <button
                key={h.key}
                onClick={() => toggleHorizon(h.key)}
                style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 700,
                  borderRadius: 6, cursor: 'pointer', border: 'none',
                  background: activeHorizons.includes(h.key) ? h.color + '18' : '#f1f5f9',
                  color: activeHorizons.includes(h.key) ? h.color : '#94a3b8',
                  outline: activeHorizons.includes(h.key) ? `2px solid ${h.color}40` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {h.label}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
            <button
              onClick={() => setShowError(v => !v)}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 700,
                borderRadius: 6, cursor: 'pointer', border: 'none',
                background: showError ? '#fef3c7' : '#f1f5f9',
                color: showError ? '#d97706' : '#94a3b8',
              }}
            >
              Error Band
            </button>
          </div>
        </CardHeader>

        <div style={{ padding: '16px 18px 8px' }}>
          {/* Performance metrics */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <MetricPill label="NSE Score"      value={gauge.nse} good={gauge.nse > 0.75} />
            <MetricPill label="RMSE (m)"       value={gauge.rmse} good={gauge.rmse < 0.15} />
            <MetricPill label="T+6h Deviation" value={deviation != null ? `${deviation > 0 ? '+' : ''}${deviation}m` : '—'} good={deviation != null && Math.abs(deviation) < 0.2} />
            <div style={{ flex: 1 }} />
            <StatusBadge status={gauge.status} />
          </div>

          {/* Main chart */}
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={gauge.data} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={xTick} interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="m" domain={['auto', 'auto']} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />

              {/* Threshold reference lines */}
              <ReferenceLine y={gauge.threshold.major} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: 'Major', position: 'right', fontSize: 9, fill: '#ef4444' }} />
              <ReferenceLine y={gauge.threshold.minor} stroke="#f97316" strokeDasharray="4 3" strokeWidth={1}
                label={{ value: 'Minor', position: 'right', fontSize: 9, fill: '#f97316' }} />
              <ReferenceLine y={gauge.threshold.alert} stroke="#eab308" strokeDasharray="4 3" strokeWidth={1}
                label={{ value: 'Alert', position: 'right', fontSize: 9, fill: '#eab308' }} />

              {/* Error shading */}
              {showError && HORIZONS.slice(0,1).map(h => (
                activeHorizons.includes(h.key) && (
                  <Area
                    key={`err-${h.key}`}
                    type="monotone"
                    dataKey={h.key}
                    stroke="none"
                    fill={h.color}
                    fillOpacity={0.07}
                    legendType="none"
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                )
              ))}

              {/* Observed — solid blue area */}
              <Area
                type="monotone"
                dataKey="observed"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="#2563eb"
                fillOpacity={0.06}
                dot={false}
                name="Observed"
                activeDot={{ r: 4, fill: '#2563eb' }}
              />

              {/* Forecast horizons — dashed lines */}
              {HORIZONS.map(h =>
                activeHorizons.includes(h.key) && (
                  <Line
                    key={h.key}
                    type="monotone"
                    dataKey={h.key}
                    stroke={h.color}
                    strokeWidth={1.8}
                    strokeDasharray={h.dash}
                    dot={false}
                    name={h.key}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                )
              )}

              <Brush dataKey="label" height={24} stroke="#e2e8f0" fill="#f8fafc"
                tickFormatter={xTick}
                travellerWidth={6}
                style={{ fontSize: 9 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Bottom row: Error chart + Model accuracy table + Horizon summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr', gap: 16 }}>

        {/* Forecast error over time */}
        <Card>
          <CardHeader
            title="T+6h Forecast Error"
            sub="Forecast − Observed (m) · positive = model over-predicts"
          />
          <div style={{ padding: '12px 18px 16px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={errData} margin={{ top: 4, right: 8, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={xTick} interval={0} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} unit="m" />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [`${v > 0 ? '+' : ''}${v.toFixed(3)} m`, 'Error']}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                <ReferenceLine y={0.2}  stroke="#ef4444" strokeDasharray="3 2" strokeWidth={1} />
                <ReferenceLine y={-0.2} stroke="#ef4444" strokeDasharray="3 2" strokeWidth={1} />
                <Bar dataKey="error" radius={[3,3,0,0]}
                  fill="#94a3b8"
                  label={false}
                  isAnimationActive={true}
                  // colour each bar by sign
                  style={{ fill: 'transparent' }}
                >
                  {errData.map((d, i) => (
                    <rect key={i}
                      fill={d.error > 0.2 ? '#ef4444' : d.error < -0.2 ? '#3b82f6' : d.error > 0 ? '#f97316aa' : '#3b82f6aa'}
                    />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="error"
                  stroke={errData.some(d => Math.abs(d.error) > 0.2) ? '#ef4444' : '#94a3b8'}
                  strokeWidth={1.5} dot={false} name="Error"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {[
                { label: 'Mean Error', val: (errData.reduce((s,d)=>s+d.error,0)/errData.length).toFixed(3)+'m' },
                { label: 'Max |Error|', val: maxError.toFixed(3)+'m' },
                { label: 'Within ±0.2m', val: Math.round(errData.filter(d=>Math.abs(d.error)<0.2).length/errData.length*100)+'%' },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, textAlign: 'center', background: '#f8fafc', borderRadius: 7, padding: '7px 4px' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', fontFamily: 'monospace' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Model accuracy table — all gauges */}
        <Card>
          <CardHeader title="Model Accuracy — All Gauges" sub="Current model run · HEC-RAS v6.3" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Station', 'NSE', 'RMSE', 'T+6h Err', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left',
                      fontSize: 11, color: '#94a3b8', fontWeight: 600,
                      borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GAUGES.map((g) => {
                  const err = buildErrorSeries(g.data)
                  const meanErr = (err.reduce((s,d)=>s+d.error,0)/err.length).toFixed(3)
                  const nseGood = g.nse > 0.75
                  return (
                    <tr key={g.id}
                      onClick={() => setSelId(g.id)}
                      style={{
                        borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                        background: selId === g.id ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: '#1e293b',
                        maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.name.split(' – ')[0]}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, fontFamily: 'monospace',
                        color: nseGood ? '#16a34a' : '#dc2626' }}>{g.nse}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace',
                        color: g.rmse < 0.15 ? '#16a34a' : '#dc2626' }}>{g.rmse}m</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace',
                        color: Math.abs(meanErr) > 0.2 ? '#dc2626' : '#64748b' }}>
                        {meanErr > 0 ? '+' : ''}{meanErr}m
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <StatusBadge status={g.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Forecast horizon summary */}
        <Card>
          <CardHeader title="Forecast Summary" sub={`${gauge.name.split(' – ')[0]} · peak projections`} />
          <div style={{ padding: '12px 16px 16px' }}>

            {/* Peak level per horizon */}
            {HORIZONS.map(h => {
              const vals = gauge.data.map(d => d[h.key]).filter(v => v != null)
              if (!vals.length) return null
              const peak = Math.max(...vals)
              const peakIdx = gauge.data.findIndex(d => d[h.key] === peak)
              const atLabel = gauge.data[peakIdx]?.label || '—'
              const aboveMajor = peak >= gauge.threshold.major
              const aboveMinor = peak >= gauge.threshold.minor
              return (
                <div key={h.key} style={{
                  marginBottom: 12, padding: '10px 12px',
                  background: aboveMajor ? '#fef2f2' : aboveMinor ? '#fff7ed' : '#f8fafc',
                  border: `1px solid ${aboveMajor ? '#fecaca' : aboveMinor ? '#fed7aa' : '#f1f5f9'}`,
                  borderRadius: 8, borderLeft: `4px solid ${h.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: h.color }}>{h.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: aboveMajor ? '#dc2626' : '#0f172a',
                      fontFamily: 'monospace' }}>{peak.toFixed(2)}m</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>
                    Peak at {atLabel.replace('Today ','').replace('Tomorrow ','')}
                    {aboveMajor && <span style={{ color: '#dc2626', fontWeight: 700 }}> · MAJOR FLOOD</span>}
                    {!aboveMajor && aboveMinor && <span style={{ color: '#ea580c', fontWeight: 700 }}> · MINOR FLOOD</span>}
                  </div>
                </div>
              )
            })}

            {/* Advisory */}
            <div style={{
              marginTop: 4, padding: '10px 12px',
              background: '#eff6ff', borderRadius: 8,
              border: '1px solid #bfdbfe', fontSize: 11, color: '#1d4ed8',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 Model Advisory</div>
              {gauge.nse > 0.85
                ? 'High model confidence. T+6h and T+12h forecasts reliable for alert decisions.'
                : 'Moderate model confidence. Verify with upstream rainfall before issuing alerts.'}
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}