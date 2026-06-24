// Design 4 — Animated "WOW" dashboard
// Dark glassmorphism + live-scrolling charts + particle rain + glowing gauges

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { GAUGE_DATA, ALERT_STATUS, RESERVOIR_DATA, RAINFALL_DATA } from './data'

// ─── Animated live data hook ─────────────────────────────────────────────────
// Simulates real-time gauge readings that update every 2s
function useLiveGauge(base, threshold, noise = 0.08) {
  const [points, setPoints] = useState(() => {
    const now = Date.now()
    return Array.from({ length: 40 }, (_, i) => ({
      t: now - (40 - i) * 3000,
      v: +(base + (Math.random() - 0.5) * noise * 4).toFixed(3),
    }))
  })

  useEffect(() => {
    const id = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1].v
        const next = Math.max(0, +(last + (Math.random() - 0.48) * noise).toFixed(3))
        return [...prev.slice(-39), { t: Date.now(), v: next }]
      })
    }, 1800)
    return () => clearInterval(id)
  }, [noise])

  return points
}

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(+(target * p).toFixed(2))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

// ─── Rain canvas ──────────────────────────────────────────────────────────────
function RainCanvas({ color = '#38bdf8', opacity = 0.18, count = 38 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const drops = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      l: 6 + Math.random() * 14,
      s: 1.5 + Math.random() * 3,
      o: 0.05 + Math.random() * 0.25,
    }))
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drops.forEach(d => {
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.l * 0.15, d.y + d.l)
        ctx.strokeStyle = color
        ctx.globalAlpha = d.o * opacity * 6
        ctx.lineWidth = 0.8
        ctx.stroke()
        d.y += d.s
        if (d.y > canvas.height) { d.y = -d.l; d.x = Math.random() * canvas.width }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [color, opacity, count])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />
}

// ─── Glowing arc gauge ────────────────────────────────────────────────────────
function ArcGauge({ value, max, threshold, label, color, size = 120 }) {
  const pct   = Math.min(value / max, 1)
  const danger = value >= threshold
  const r     = (size / 2) - 12
  const circ  = Math.PI * r          // half circle
  const dash  = pct * circ
  const cx = size / 2, cy = size / 2 + 10

  const displayVal = useCounter(value, 900)

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <svg width={size} height={size * 0.65} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`ag-${label}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={danger ? '#ef4444' : color} />
            <stop offset="100%" stopColor={danger ? '#f97316' : color + 'aa'} />
          </linearGradient>
          <filter id={`gf-${label}`}>
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={`url(#ag-${label})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          filter={`url(#gf-${label})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Threshold tick */}
        <line
          x1={cx + r * Math.cos(Math.PI - (threshold / max) * Math.PI)}
          y1={cy - r * Math.sin((threshold / max) * Math.PI)}
          x2={cx + (r + 10) * Math.cos(Math.PI - (threshold / max) * Math.PI)}
          y2={cy - (r + 10) * Math.sin((threshold / max) * Math.PI)}
          stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
        />
        {/* Value */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="800"
          fill={danger ? '#f87171' : '#f1f5f9'}
          style={{ fontFamily: "'SF Mono','Fira Code',monospace" }}>
          {displayVal.toFixed(2)}m
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="9" fill="#4a7fad" fontWeight="600"
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </text>
      </svg>
      {danger && (
        <div style={{
          position: 'absolute', top: 2, right: 2,
          width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
          boxShadow: '0 0 8px #ef4444', animation: 'pulse4 1s infinite',
        }} />
      )}
    </div>
  )
}

// ─── Live sparkline ───────────────────────────────────────────────────────────
function Sparkline({ points, color, threshold }) {
  const data = points.map((p, i) => ({ i, v: p.v }))
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sp-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={color} stopOpacity={0.35}/>
            <stop offset="90%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        {threshold && <ReferenceLine y={threshold} stroke="#ef444466" strokeDasharray="3 2" strokeWidth={1}/>}
        <Area type="monotoneX" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sp-${color.replace('#','')})`} dot={false} isAnimationActive={false}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Glass card ───────────────────────────────────────────────────────────────
const Glass = ({ children, style = {}, glow }) => (
  <div style={{
    background: 'rgba(10,22,44,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: glow ? `0 0 40px ${glow}18, inset 0 1px 0 rgba(255,255,255,0.06)` : 'inset 0 1px 0 rgba(255,255,255,0.06)',
    ...style,
  }}>
    {children}
  </div>
)

// ─── Scroll alert ticker ──────────────────────────────────────────────────────
const ALERTS_LIVE = [
  { gauge: 'Kalu Ganga – Millakanda', val: '4.82m', st: 'MAJOR FLOOD', c: '#ef4444' },
  { gauge: 'Walawe – Embilipitiya',   val: '5.10m', st: 'MAJOR FLOOD', c: '#ef4444' },
  { gauge: 'Nilwala – Pitabeddara',   val: '3.78m', st: 'MINOR FLOOD', c: '#f97316' },
  { gauge: 'Kelani – Hanwella',       val: '3.21m', st: 'ALERT',       c: '#eab308' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Design4() {
  const [selGauge, setSelGauge] = useState(0)
  const [alertIdx, setAlertIdx] = useState(0)

  // Live data streams per gauge
  const live0 = useLiveGauge(4.82, 4.5, 0.06)
  const live1 = useLiveGauge(3.21, 3.8, 0.07)
  const live2 = useLiveGauge(3.78, 3.5, 0.07)
  const live3 = useLiveGauge(5.10, 4.5, 0.05)
  const streams = [live0, live1, live2, live3]

  const LIVE_GAUGES = [
    { name: 'Kalu Ganga – Millakanda', short: 'Kalu Ganga', color: '#ef4444', base: 4.82, threshold: 4.5, status: 'MAJOR_FLOOD' },
    { name: 'Kelani River – Hanwella',  short: 'Kelani R.',  color: '#eab308', base: 3.21, threshold: 3.8, status: 'ALERT' },
    { name: 'Nilwala – Pitabeddara',    short: 'Nilwala',    color: '#f97316', base: 3.78, threshold: 3.5, status: 'MINOR_FLOOD' },
    { name: 'Walawe – Embilipitiya',    short: 'Walawe',     color: '#ef4444', base: 5.10, threshold: 4.5, status: 'MAJOR_FLOOD' },
  ]

  // Rotate alert banner
  useEffect(() => {
    const id = setInterval(() => setAlertIdx(i => (i + 1) % ALERTS_LIVE.length), 3500)
    return () => clearInterval(id)
  }, [])

  const curAlert = ALERTS_LIVE[alertIdx]
  const curGauge = LIVE_GAUGES[selGauge]
  const curStream = streams[selGauge]
  const curLive = curStream[curStream.length - 1]?.v || curGauge.base

  const rainfallTotal = RAINFALL_DATA.map(d => d.Kalu + d.Kelani + d.Mahaweli + d.Nilwala)
  const maxRain = Math.max(...rainfallTotal)

  return (
    <div style={{
      background: 'linear-gradient(160deg, #030810 0%, #060f1e 50%, #040c18 100%)',
      minHeight: '100%', padding: 18, position: 'relative',
      fontFamily: 'inherit',
    }}>
      <style>{`
        @keyframes pulse4  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{top:-100%} 100%{top:200%} }
        @keyframes borderFlow {
          0%{box-shadow: 0 0 0 0 rgba(239,68,68,0)}
          50%{box-shadow: 0 0 0 4px rgba(239,68,68,0.3)}
          100%{box-shadow: 0 0 0 0 rgba(239,68,68,0)}
        }
        @keyframes shimmer {
          0%{background-position:-200% 0}
          100%{background-position:200% 0}
        }
        @keyframes floatUp {
          0%{transform:translateY(0)} 50%{transform:translateY(-4px)} 100%{transform:translateY(0)}
        }
      `}</style>

      {/* Background rain */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <RainCanvas color="#38bdf8" opacity={0.12} count={45}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Alert banner (rotates) ── */}
        <div key={alertIdx} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 16, padding: '10px 18px',
          background: `linear-gradient(90deg, ${curAlert.c}22 0%, ${curAlert.c}08 60%, transparent 100%)`,
          border: `1px solid ${curAlert.c}44`,
          borderRadius: 10,
          animation: 'fadeSlide 0.4s ease, borderFlow 2s ease-in-out infinite',
        }}>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
            background: curAlert.c, color: '#fff', letterSpacing: '0.1em',
            animation: 'pulse4 1.2s ease-in-out infinite',
          }}>{curAlert.st}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{curAlert.gauge}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: curAlert.c, fontFamily: 'monospace' }}>{curAlert.val}</span>
          <span style={{ fontSize: 11, color: '#334e6e', marginLeft: 4 }}>
            above flood threshold · automated alert dispatched
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {ALERTS_LIVE.map((_, i) => (
              <div key={i} style={{
                width: i === alertIdx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === alertIdx ? curAlert.c : 'rgba(255,255,255,0.1)',
                transition: 'width 0.3s, background 0.3s',
              }}/>
            ))}
          </div>
        </div>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Active Gauges',  val: 47,    unit: '/ 52',   color: '#38bdf8', sub: '+2 today' },
            { label: 'Flood Alerts',   val: 7,     unit: 'active', color: '#ef4444', sub: '3 major', pulse: true },
            { label: 'Max Level',      val: 5.10,  unit: 'm',      color: '#f97316', sub: 'Walawe' },
            { label: 'Rainfall 24h',   val: 118,   unit: 'mm',     color: '#a855f7', sub: 'system avg' },
            { label: 'Reservoirs>80%', val: 6,     unit: '/ 23',   color: '#eab308', sub: 'Kalu Ganga 94%' },
            { label: 'Forecast',       val: 48,    unit: 'h',      color: '#22c55e', sub: 'model run 14:00' },
          ].map((k) => {
            const displayVal = useCounter(k.val, 900)
            return (
              <Glass key={k.label} glow={k.color} style={{ padding: '14px 16px' }}>
                {k.pulse && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10, width: 8, height: 8,
                    borderRadius: '50%', background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444', animation: 'pulse4 1s infinite',
                  }}/>
                )}
                <div style={{ fontSize: 10, color: '#334e6e', fontWeight: 600, marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: k.color,
                    fontFamily: "'SF Mono','Fira Code',monospace",
                    textShadow: `0 0 20px ${k.color}60` }}>
                    {Number.isInteger(k.val) ? Math.round(displayVal) : displayVal.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 11, color: '#334e6e' }}>{k.unit}</span>
                </div>
                <div style={{ fontSize: 10, color: '#1e3a5f' }}>{k.sub}</div>
                {/* Shimmer bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  borderRadius: '0 0 14px 14px',
                  background: `linear-gradient(90deg, transparent, ${k.color}, transparent)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }}/>
              </Glass>
            )
          })}
        </div>

        {/* ── Row 1: Live gauge chart + Arc gauges + Alert log ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.9fr', gap: 14, marginBottom: 14 }}>

          {/* Live chart */}
          <Glass glow={curGauge.color} style={{ padding: '16px 18px' }}>
            <RainCanvas color={curGauge.color} opacity={0.08} count={20}/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                      background: ALERT_STATUS[curGauge.status]?.bg + '22',
                      color: ALERT_STATUS[curGauge.status]?.color,
                      border: `1px solid ${ALERT_STATUS[curGauge.status]?.color}44`,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{ALERT_STATUS[curGauge.status]?.label}</span>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                      display: 'inline-block', boxShadow: '0 0 8px #22c55e',
                      animation: 'pulse4 1.5s infinite' }}/>
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>LIVE</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{curGauge.name}</div>
                  <div style={{ fontSize: 10, color: '#334e6e', marginTop: 2 }}>
                    Real-time level · updates every 1.8s · threshold {curGauge.threshold}m
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: curGauge.color,
                    fontFamily: 'monospace', lineHeight: 1,
                    textShadow: `0 0 30px ${curGauge.color}80`,
                    animation: 'floatUp 3s ease-in-out infinite',
                  }}>
                    {curLive.toFixed(3)}
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#4a7fad', marginLeft: 4 }}>m</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#334e6e', marginTop: 3 }}>
                    Peak today: 5.22m
                  </div>
                </div>
              </div>

              {/* Gauge selector tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {LIVE_GAUGES.map((g, i) => (
                  <button key={i} onClick={() => setSelGauge(i)} style={{
                    padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 20,
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                    background: selGauge === i ? g.color + '22' : 'rgba(255,255,255,0.04)',
                    color: selGauge === i ? g.color : '#334e6e',
                    boxShadow: selGauge === i ? `0 0 12px ${g.color}30` : 'none',
                  }}>{g.short}</button>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={curStream.map((p, i) => ({ i, v: p.v }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={curGauge.color} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={curGauge.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="i" hide />
                  <YAxis tick={{ fontSize: 9, fill: '#334e6e' }} unit="m" domain={['auto','auto']} />
                  <Tooltip
                    contentStyle={{ background: '#0a1628', border: `1px solid ${curGauge.color}44`,
                      borderRadius: 8, fontSize: 11, color: '#e2e8f0' }}
                    formatter={(v) => [`${v.toFixed(3)} m`, 'Level']}
                    labelFormatter={() => ''}
                  />
                  <ReferenceLine y={curGauge.threshold} stroke="#ef4444" strokeDasharray="4 3"
                    strokeWidth={1.5} label={{ value: 'Threshold', position: 'right', fontSize: 9, fill: '#ef4444' }}/>
                  <Area type="monotoneX" dataKey="v" stroke={curGauge.color} strokeWidth={2.5}
                    fill="url(#liveGrad)" dot={false} isAnimationActive={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Glass>

          {/* Arc gauges */}
          <Glass style={{ padding: '16px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7fad', marginBottom: 14,
              textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              Gauge Levels
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LIVE_GAUGES.map((g, i) => (
                <div key={i} onClick={() => setSelGauge(i)} style={{
                  cursor: 'pointer', padding: '8px 4px',
                  background: selGauge === i ? g.color + '0d' : 'transparent',
                  borderRadius: 10, border: selGauge === i ? `1px solid ${g.color}33` : '1px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  <ArcGauge
                    value={streams[i][streams[i].length - 1]?.v || g.base}
                    max={g.threshold * 1.4}
                    threshold={g.threshold}
                    label={g.short}
                    color={g.color}
                    size={110}
                  />
                </div>
              ))}
            </div>
          </Glass>

          {/* Alert log */}
          <Glass style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                boxShadow: '0 0 8px #ef4444', animation: 'pulse4 1s infinite' }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Alerts</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                padding: '2px 6px', borderRadius: 4, background: '#ef44441a', color: '#ef4444' }}>7</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {[
                { gauge: 'Kalu Ganga',  val: '4.82m', st: 'MAJOR', c: '#ef4444', ago: '2m' },
                { gauge: 'Walawe',      val: '5.10m', st: 'MAJOR', c: '#ef4444', ago: '7m' },
                { gauge: 'Nilwala',     val: '3.78m', st: 'MINOR', c: '#f97316', ago: '15m' },
                { gauge: 'Kelani',      val: '3.21m', st: 'ALERT', c: '#eab308', ago: '34m' },
                { gauge: 'Kalu Ganga',  val: '4.42m', st: 'ALERT', c: '#eab308', ago: '1h' },
                { gauge: 'Walawe',      val: '4.88m', st: 'MINOR', c: '#f97316', ago: '2h' },
                { gauge: 'Nilwala',     val: '3.52m', st: 'ALERT', c: '#eab308', ago: '3h' },
              ].map((a, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: `3px solid ${a.c}`,
                  background: i === 0 ? `${a.c}08` : 'transparent',
                  animation: i === 0 ? 'fadeSlide 0.4s ease' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: a.c,
                      textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.st}</span>
                    <span style={{ fontSize: 9, color: '#1e3a5f' }}>{a.ago} ago</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{a.gauge}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: a.c,
                    fontFamily: 'monospace', textShadow: `0 0 10px ${a.c}60` }}>{a.val}</div>
                </div>
              ))}
            </div>
          </Glass>
        </div>

        {/* ── Row 2: Rainfall animated bars + Reservoir rings + Map ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 14 }}>

          {/* Rainfall animated bars */}
          <Glass style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7fad', marginBottom: 14,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>🌧 Basin Rainfall — 7 Days (mm)</div>
            {RAINFALL_DATA.map((d, i) => {
              const total = d.Kalu + d.Kelani + d.Mahaweli + d.Nilwala
              const pct = total / (maxRain * 4) * 100
              const c = total > 200 ? '#ef4444' : total > 150 ? '#f97316' : '#38bdf8'
              return (
                <div key={d.day} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{d.day}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c,
                      fontFamily: 'monospace' }}>{total} mm</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${c}, ${c}aa)`,
                      borderRadius: 4,
                      boxShadow: `0 0 8px ${c}60`,
                      transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                      animationDelay: `${i * 0.1}s`,
                    }}/>
                  </div>
                </div>
              )
            })}
          </Glass>

          {/* Reservoir rings */}
          <Glass style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7fad', marginBottom: 14,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>💧 Reservoir Storage</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {RESERVOIR_DATA.map((r) => {
                const c = r.pct > 90 ? '#ef4444' : r.pct > 75 ? '#eab308' : '#38bdf8'
                const size = 72
                const radius = 28, circ = 2 * Math.PI * radius
                const dash = (r.pct / 100) * circ
                return (
                  <div key={r.name} style={{ textAlign: 'center' }}>
                    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
                      <defs>
                        <filter id={`rf-${r.name}`}>
                          <feGaussianBlur stdDeviation="1.5" result="b"/>
                          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      <circle cx={size/2} cy={size/2} r={radius} fill="none"
                        stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
                      <circle cx={size/2} cy={size/2} r={radius} fill="none"
                        stroke={c} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeDashoffset={circ/4}
                        filter={`url(#rf-${r.name})`}
                        style={{ transition: 'stroke-dasharray 1.2s ease' }}/>
                      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="central"
                        fontSize="12" fontWeight="800" fill={c}
                        style={{ fontFamily: 'monospace' }}>{r.pct}%</text>
                    </svg>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{r.name}</div>
                  </div>
                )
              })}
            </div>
          </Glass>

          {/* Sparkline grid — all 4 gauges live */}
          <Glass style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4a7fad', marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: '0.08em' }}>📡 Live Streams — All Gauges</div>
            {LIVE_GAUGES.map((g, i) => (
              <div key={i} style={{
                marginBottom: 8, padding: '8px 10px',
                background: selGauge === i ? `${g.color}0d` : 'rgba(255,255,255,0.02)',
                borderRadius: 8, border: `1px solid ${selGauge === i ? g.color + '33' : 'rgba(255,255,255,0.04)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
              }} onClick={() => setSelGauge(i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: g.color }}>{g.short}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: g.color,
                    fontFamily: 'monospace', textShadow: `0 0 8px ${g.color}60` }}>
                    {(streams[i][streams[i].length - 1]?.v || g.base).toFixed(2)}m
                  </span>
                </div>
                <Sparkline points={streams[i]} color={g.color} threshold={g.threshold}/>
              </div>
            ))}
          </Glass>

        </div>
      </div>
    </div>
  )
}