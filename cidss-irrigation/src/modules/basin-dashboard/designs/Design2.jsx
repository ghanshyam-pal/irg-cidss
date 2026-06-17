// Design 2 — Dark Operational  (control room / command centre feel)
// Dark navy background, glowing indicators, tight data density

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  GAUGE_DATA, ALERT_STATUS, GAUGE_SERIES, RAINFALL_DATA,
  RESERVOIR_DATA, RECENT_ALERTS, FORECAST_7DAY,
} from './data'

const C = {
  bg:       '#070f1c',
  surface:  '#0d1a2d',
  surface2: '#112240',
  border:   'rgba(255,255,255,0.07)',
  text:     '#e2e8f0',
  muted:    '#4a7fad',
  accent:   '#38bdf8',
}

const glowStyle = (color) => ({ boxShadow: `0 0 12px ${color}40` })

const DarkCard = ({ title, action, children, style = {} }) => (
  <div style={{
    background: C.surface, borderRadius: 10,
    border: `1px solid ${C.border}`, overflow: 'hidden', ...style,
  }}>
    {title && (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 16px', borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: '0.03em' }}>{title}</span>
        {action && <span style={{ fontSize: 11, color: C.accent, cursor: 'pointer' }}>{action}</span>}
      </div>
    )}
    {children}
  </div>
)

const AlertBadge = ({ status }) => {
  const d = ALERT_STATUS[status] || ALERT_STATUS.NORMAL
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: d.bg + '22', color: d.color, border: `1px solid ${d.color}44`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: d.dot, boxShadow: `0 0 4px ${d.dot}` }} />
      {d.label}
    </span>
  )
}

const customTooltipStyle = {
  background: '#0d1a2d', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, fontSize: 11, color: '#e2e8f0',
}

export default function Design2() {
  const [selGauge, setSelGauge] = useState('G01')
  const series = GAUGE_SERIES[selGauge] || GAUGE_SERIES['G01']
  const gauge  = GAUGE_DATA.find(g => g.id === selGauge)

  const alertCount = GAUGE_DATA.filter(g => g.status !== 'NORMAL').length

  return (
    <div style={{ background: C.bg, minHeight: '100%', fontFamily: 'inherit', color: C.text }}>

      {/* ── Top status bar ── */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>SYSTEM ONLINE</span>
          </div>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: 11, color: C.muted }}>47 / 52 gauges active</span>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: 11, color: C.muted }}>Last sync: 14:44:58 LKT</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {alertCount > 0 && (
            <div style={{
              background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 6,
              padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fca5a5',
              animation: 'none', ...glowStyle('#ef4444'),
            }}>
              ⚠ {alertCount} THRESHOLD BREACHES
            </div>
          )}
          <span style={{ fontSize: 11, color: C.muted }}>Tue 17 Jun 2026 · 14:45 LKT</span>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* ── KPI strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Active Gauges',  value: '47',   unit: '/ 52',    color: '#38bdf8' },
            { label: 'Alerts',         value: '7',    unit: 'active',  color: '#f87171' },
            { label: 'Max Level',      value: '5.10', unit: 'm',       color: '#fb923c' },
            { label: 'Avg Level',      value: '3.24', unit: 'm',       color: '#38bdf8' },
            { label: 'Rainfall 24h',   value: '118',  unit: 'mm',      color: '#a78bfa' },
            { label: 'Reservoirs>80%', value: '6',    unit: '/ 23',    color: '#facc15' },
          ].map((k) => (
            <div key={k.label} style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '12px 14px',
              borderTop: `2px solid ${k.color}`,
            }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k.label}</div>
              <div>
                <span style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</span>
                <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>{k.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 12, marginBottom: 12 }}>

          {/* Gauge list */}
          <DarkCard title="⬤ GAUGE STATUS">
            <div style={{ padding: '6px 0' }}>
              {GAUGE_DATA.map((g) => (
                <div
                  key={g.id}
                  onClick={() => GAUGE_SERIES[g.id] && setSelGauge(g.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 16px', cursor: GAUGE_SERIES[g.id] ? 'pointer' : 'default',
                    borderBottom: `1px solid ${C.border}`,
                    background: selGauge === g.id ? 'rgba(56,189,248,0.07)' : 'transparent',
                    borderLeft: selGauge === g.id ? '2px solid #38bdf8' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                      {g.name.split(' – ')[0]}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>{g.basin} Basin · {g.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: g.level > g.threshold ? '#f87171' : '#38bdf8', fontFamily: 'monospace' }}>
                      {g.level.toFixed(2)}m
                    </div>
                    <AlertBadge status={g.status} />
                  </div>
                </div>
              ))}
            </div>
          </DarkCard>

          {/* Chart */}
          <DarkCard title={`📈 ${gauge?.name} — 48h TIMESERIES`} action="EXPAND">
            <div style={{ padding: '14px 16px 10px' }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {[
                  { label: 'Current Level', val: `${gauge?.level.toFixed(2)} m`, color: '#38bdf8' },
                  { label: 'Threshold',     val: `${gauge?.threshold.toFixed(1)} m`, color: '#f87171' },
                  { label: 'Status',        val: ALERT_STATUS[gauge?.status]?.label, color: ALERT_STATUS[gauge?.status]?.dot },
                ].map((s) => (
                  <div key={s.label} style={{ background: C.surface2, borderRadius: 7, padding: '8px 14px', flex: 1, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="d2obs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="10%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="90%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: C.muted }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: C.muted }} unit="m" />
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v, n) => [`${v}m`, n]} />
                  <ReferenceLine y={gauge?.threshold} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="observed" stroke="#38bdf8" strokeWidth={2} fill="url(#d2obs)" dot={false} />
                  <Area type="monotone" dataKey="forecast"  stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                {[['#38bdf8','— Observed'],['#f59e0b','- - Forecast'],['#f87171','— Threshold']].map(([c,l]) => (
                  <span key={l} style={{ fontSize: 10, color: c }}>{l}</span>
                ))}
              </div>
            </div>
          </DarkCard>

          {/* Alert log */}
          <DarkCard title="🔔 ALERT LOG" action="VIEW ALL">
            <div style={{ padding: '6px 0' }}>
              {RECENT_ALERTS.map((a, i) => (
                <div key={i} style={{
                  padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${a.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: a.color }}>{a.level.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>{a.time}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.gauge}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: a.color, fontFamily: 'monospace' }}>{a.value}</div>
                </div>
              ))}
            </div>
          </DarkCard>
        </div>

        {/* ── Bottom row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

          {/* Rainfall */}
          <DarkCard title="🌧 RAINFALL · 7 DAYS (mm)">
            <div style={{ padding: '12px 16px 10px' }}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={RAINFALL_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 9, fill: C.muted }} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="Kalu"    fill="#38bdf8" radius={[3,3,0,0]} />
                  <Bar dataKey="Kelani"  fill="#a78bfa" radius={[3,3,0,0]} />
                  <Bar dataKey="Nilwala" fill="#facc15" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DarkCard>

          {/* 7-day level forecast */}
          <DarkCard title="📊 7-DAY LEVEL FORECAST">
            <div style={{ padding: '12px 16px 10px' }}>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={FORECAST_7DAY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="d2lvl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="10%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="90%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 9, fill: C.muted }} unit="m" />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <ReferenceLine y={4.5} stroke="#f87171" strokeDasharray="4 3" />
                  <Area type="monotone" dataKey="level" stroke="#a78bfa" strokeWidth={2} fill="url(#d2lvl)" dot={{ r: 3, fill: '#a78bfa' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DarkCard>

          {/* Reservoir */}
          <DarkCard title="💧 RESERVOIR STORAGE">
            <div style={{ padding: '12px 16px' }}>
              {RESERVOIR_DATA.map((r) => {
                const c = r.pct > 90 ? '#f87171' : r.pct > 75 ? '#facc15' : '#38bdf8'
                return (
                  <div key={r.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: C.text }}>{r.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: 'monospace' }}>{r.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${r.pct}%`, background: c, borderRadius: 3, boxShadow: `0 0 6px ${c}88` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </DarkCard>
        </div>

      </div>
    </div>
  )
}