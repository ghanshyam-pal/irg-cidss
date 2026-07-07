import { useState, useMemo } from 'react'
import {
  ComposedChart, Line, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, Legend,
} from 'recharts'
import {
  STATION_IDS, STATION_META, THRESHOLDS, ALERT_STATUS,
  classify, generateSeries, readingsAt, generateHistorical,
  generateBreachLog, generateNeighbors, NOW,
} from './riverGaugeData'

const ZOOM_OPTIONS = [6, 12, 24, 48, 72]
const fmt = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '—')

// Helper function to turn relative hour offsets into beautiful absolute timestamps
const formatAbsoluteTime = (h) => {
  const dateObj = new Date(NOW.getTime() + h * 3600000)
  return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + 
         ' ' + 
         dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function badge(d, size = 11) {
  return {
    fontSize: size, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
    background: d.bg, color: d.color, display: 'inline-flex', alignItems: 'center', gap: 4,
  }
}

function toggleBtn(active) {
  return {
    fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 6,
    cursor: 'pointer', border: '1px solid #e2e8f0',
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#475569',
  }
}

function Panel({ title, children, extra }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{title}</h4>
        {extra}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5, borderBottom: '1px dotted #f1f5f9', paddingBottom: 3 }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{ fontWeight: 600, color: '#334155', textAlign: 'right' }}>{v}</span>
    </div>
  )
}

export default function RiverGaugePage() {
  const [search, setSearch] = useState('')
  const [basinFilter, setBasinFilter] = useState('All Basins')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('level')
  const [selectedId, setSelectedId] = useState('G01')
  const [zoomHrs, setZoomHrs] = useState(72)
  const [metric, setMetric] = useState('level') // 'level' | 'discharge'
  const [customHrs, setCustomHrs] = useState(72)
  const [showCustom, setShowCustom] = useState(false)

  // ── Live station list (cards) ──────────────────────────────────
  const allStations = useMemo(() => STATION_IDS.map((id) => {
    const meta = STATION_META[id]
    const t = THRESHOLDS[id]
    const sd = generateSeries(id)
    const status = classify(meta.baseLevel, t)
    const change1h = +(sd.current - readingsAt(sd, 1)).toFixed(2)
    const sparkline = sd.series.slice(-6).map((p) => ({ h: p.h, level: p.observed }))
    return { id, meta, t, sd, status, change1h, sparkline }
  }), [])

  const basinNames = ['All Basins', ...new Set(allStations.map((s) => s.meta.basin))]

  const filteredStations = useMemo(() => {
    let list = allStations.filter((s) =>
      (search === '' || s.meta.name.toLowerCase().includes(search.toLowerCase())) &&
      (basinFilter === 'All Basins' || s.meta.basin === basinFilter) &&
      (statusFilter === 'All' ||
        (statusFilter === 'Alert' && s.status === 'ALERT') ||
        (statusFilter === 'Flood' && ['MINOR_FLOOD', 'MAJOR_FLOOD', 'CRITICAL'].includes(s.status)))
    )
    list = [...list].sort((a, b) => {
      if (sortBy === 'level') return b.sd.current - a.sd.current
      if (sortBy === 'name') return a.meta.name.localeCompare(b.meta.name)
      if (sortBy === 'basin') return a.meta.basin.localeCompare(b.meta.basin)
      return 0
    })
    return list
  }, [allStations, search, basinFilter, statusFilter, sortBy])

  const activeCount = allStations.filter((s) => s.status !== 'NORMAL').length

  // ── Selected station detail ────────────────────────────────────
  const meta = STATION_META[selectedId]
  const t = THRESHOLDS[selectedId]
  const sd = useMemo(() => generateSeries(selectedId), [selectedId])
  const historical = useMemo(() => generateHistorical(selectedId), [selectedId])
  const breachLog = useMemo(() => generateBreachLog(selectedId), [selectedId])
  const neighbors = useMemo(() => generateNeighbors(selectedId), [selectedId])
  const status = classify(sd.current, t)
  const statusD = ALERT_STATUS[status]

  const effectiveZoom = showCustom ? customHrs : zoomHrs
  
  const chartData = useMemo(() => {
    const past = sd.series.filter((p) => p.h >= -effectiveZoom).map((p) => {
      const isLevel = metric === 'level'
      const val = isLevel ? p.observed : p.discharge
      return {
        h: p.h,
        timestamp: formatAbsoluteTime(p.h),
        observed: val,
        // No forecast spreads during recorded past
        upperSpread: null,
        lowerSpread: null,
        forecast: null,
      }
    })

    const future = sd.forecastSeries.map((p) => {
      const isLevel = metric === 'level'
      const baseF = isLevel ? p.forecast : p.dischargeForecast
      // Generate synthetic probabilistic ensemble ranges like the GFS ensemble chart
      const multiplier = isLevel ? 0.12 : 2.5
      return {
        h: p.h,
        timestamp: formatAbsoluteTime(p.h),
        observed: null,
        // Ensemble bounds
        upperSpread: +(baseF + p.h * multiplier * 0.4).toFixed(2),
        lowerSpread: Math.max(0.1, +(baseF - p.h * multiplier * 0.25).toFixed(2)),
        forecast: baseF,
      }
    })

    // Bridge standard tracks smoothly at Now (t = 0)
    const currentVal = metric === 'level' ? sd.current : sd.series[sd.series.length - 1].discharge
    const nowPoint = {
      h: 0,
      timestamp: formatAbsoluteTime(0),
      observed: currentVal,
      upperSpread: currentVal,
      lowerSpread: currentVal,
      forecast: currentVal,
    }

    return [...past, nowPoint, ...future]
  }, [sd, effectiveZoom, metric])

  const peakTime = new Date(NOW.getTime() + sd.peak.h * 3600000)
  const rateColor = Math.abs(sd.rateOfRise) > 0.15 ? '#dc2626' : Math.abs(sd.rateOfRise) > 0.06 ? '#d97706' : '#16a34a'

  const readings = {
    '1h': readingsAt(sd, 1), '3h': readingsAt(sd, 3), '6h': readingsAt(sd, 6),
    '12h': readingsAt(sd, 12), '24h': readingsAt(sd, 24),
  }
  const today = sd.series.slice(-24)
  const maxToday = today.reduce((a, b) => (b.observed > a.observed ? b : a), today[0])
  const minToday = today.reduce((a, b) => (b.observed < a.observed ? b : a), today[0])

  const exportCsv = () => {
    const header = 'Date,Time Breached,Level at Breach (m),Peak Level (m),Duration Above Threshold (h),Alert Level Reached,Authorised By\n'
    const rows = breachLog.map((b) =>
      `${b.date},${b.timeBreached},${b.levelAtBreach},${b.peakLevel},${b.durationHrs},${b.alertLevel},${b.authorisedBy}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `breach-log-${selectedId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100%', fontFamily: 'inherit' }}>

      {/* ── Selector & filter bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search station by name..."
          style={{ fontSize: 12, padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 7, width: 220 }}
        />
        <select value={basinFilter} onChange={(e) => setBasinFilter(e.target.value)} style={{ fontSize: 12, fontWeight: 600, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff' }}>
          {basinNames.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: 12, fontWeight: 600, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff' }}>
          {['All', 'Alert', 'Flood'].map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s === 'Flood' ? 'Flood Only' : 'Alert Only'}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ fontSize: 12, fontWeight: 600, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff' }}>
          <option value="level">Sort: Level (high → low)</option>
          <option value="name">Sort: Name</option>
          <option value="basin">Sort: Basin</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Active / Alert stations</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: '#dc2626', borderRadius: 12, padding: '3px 11px' }}>{activeCount} / {STATION_IDS.length}</span>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Station cards row ── */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {filteredStations.map((s) => {
            const d = ALERT_STATUS[s.status]
            const isSel = s.id === selectedId
            return (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{
                  minWidth: 192, flexShrink: 0, background: '#fff', borderRadius: 10, cursor: 'pointer',
                  border: isSel ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  boxShadow: isSel ? '0 4px 14px rgba(37,99,235,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b', lineHeight: 1.25 }}>{s.meta.name.split(' – ')[0]}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{s.meta.basin} Basin</div>
                  </div>
                  <span style={badge(d, 10)}>{d.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: d.color }}>{fmt(s.sd.current)}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>m</span>
                  <span style={{ fontSize: 13, marginLeft: 2 }}>{s.meta.trendHint}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.change1h >= 0 ? '#dc2626' : '#16a34a', marginBottom: 6 }}>
                  {s.change1h >= 0 ? '+' : ''}{fmt(s.change1h)} m / 1h
                </div>
                <ResponsiveContainer width="100%" height={32}>
                  <BarChart data={s.sparkline}>
                    <Bar dataKey="level" fill={d.dot} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          })}
          {filteredStations.length === 0 && (
            <div style={{ fontSize: 12, color: '#94a3b8', padding: '20px 0' }}>No stations match these filters.</div>
          )}
        </div>

        {/* ── Detail chart | Primary data sub-panels ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>

          {/* Centre-left: Modernized Ensemble Chart Layout */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{meta.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{meta.river} · {meta.basin} Basin</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setMetric('level')} style={toggleBtn(metric === 'level')}>Level (m)</button>
                <button onClick={() => setMetric('discharge')} style={toggleBtn(metric === 'discharge')}>Discharge (m³/s)</button>
              </div>
            </div>

            {/* <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
              {ZOOM_OPTIONS.map((z) => (
                <button key={z} onClick={() => { setZoomHrs(z); setShowCustom(false) }} style={toggleBtn(!showCustom && zoomHrs === z)}>{z}h</button>
              ))}
              <button onClick={() => setShowCustom(true)} style={toggleBtn(showCustom)}>Custom</button>
              {showCustom && (
                <input
                  type="number" min={1} max={96} value={customHrs}
                  onChange={(e) => setCustomHrs(Math.max(1, Math.min(96, +e.target.value || 1)))}
                  style={{ width: 60, fontSize: 12, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6 }}
                />
              )}
            </div> */}

            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                {/* Fixed XAxis to show absolute calendar dates and times */}
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#94a3b8' }} minTickGap={45} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                
                <Tooltip
                  formatter={(v, name) => [v == null ? '—' : v, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 7 }}
                />
                
                {metric === 'level' && t && (
                  <>
                    <ReferenceLine y={t.alert} stroke="#eab308" strokeDasharray="4 3" label={{ value: 'Alert', fontSize: 9, fill: '#ca8a04', position: 'insideTopLeft' }} />
                    <ReferenceLine y={t.minor} stroke="#f97316" strokeDasharray="4 3" label={{ value: 'Minor', fontSize: 9, fill: '#ea580c', position: 'insideTopLeft' }} />
                    <ReferenceLine y={t.major} stroke="#ef4444" strokeDasharray="4 3" label={{ value: 'Major', fontSize: 9, fill: '#dc2626', position: 'insideTopLeft' }} />
                    <ReferenceLine y={t.critical} stroke="#991b1b" strokeDasharray="4 3" label={{ value: 'Critical', fontSize: 9, fill: '#7f1d1d', position: 'insideTopLeft' }} />
                    <ReferenceDot x={formatAbsoluteTime(sd.peak.h)} y={sd.peak.level} r={5} fill="#2563eb" stroke="#fff" strokeWidth={2}
                      label={{ value: `Peak ${fmt(sd.peak.level)}m`, fontSize: 10, fill: '#2563eb', position: 'top' }} />
                  </>
                )}
                
                {/* Ensemble Probabilistic Shaded Cone for predictions */}
                <Area 
                  type="monotone" 
                  dataKey="upperSpread" 
                  stroke="none" 
                  fill="#93c5fd" 
                  fillOpacity={0.35} 
                  name="Ensemble Upper Bound"
                  connectNulls 
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerSpread" 
                  stroke="none" 
                  fill="#2563eb" 
                  fillOpacity={0.15} 
                  name="Ensemble Lower Bound"
                  connectNulls 
                />

                {/* Primary Observed Data Line */}
                <Line type="monotone" dataKey="observed" stroke="#1e293b" strokeWidth={2.5} dot={false} name="Observed" connectNulls />
                {/* Mean Forecast Core Path */}
                <Line type="monotone" dataKey="forecast" stroke="#2563eb" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Ensemble Mean Forecast" connectNulls />
                
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11.5 }}>
              <span style={{ color: '#64748b' }}>Peak: <strong style={{ color: '#1e293b' }}>{fmt(sd.peak.level)} m</strong> at {peakTime.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: '#64748b' }}>Rate of rise: <strong style={{ color: rateColor }}>{sd.rateOfRise >= 0 ? '+' : ''}{fmt(sd.rateOfRise)} m/hr</strong></span>
            </div>
          </div>

          {/* Centre-right: dynamic stats panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Panel title="Live Readings">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Current ({NOW.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} LKT)</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: statusD.color }}>{fmt(sd.current)} m</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, marginBottom: 8 }}>
                {Object.entries(readings).map(([k, v]) => (
                  <div key={k} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 6, padding: '5px 2px' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{k} ago</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
              <InfoRow k="Max today" v={`${fmt(maxToday.observed)} m @ ${new Date(NOW.getTime() + maxToday.h * 3600000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`} />
              <InfoRow k="Min today" v={`${fmt(minToday.observed)} m @ ${new Date(NOW.getTime() + minToday.h * 3600000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Rate of rise</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: rateColor }}>{sd.rateOfRise >= 0 ? '+' : ''}{fmt(sd.rateOfRise)} m/hr</span>
              </div>
            </Panel>

            <Panel title="Threshold Table">
              {t ? ['alert', 'minor', 'major', 'critical'].map((key) => {
                const val = t[key]
                const diff = +(sd.current - val).toFixed(2)
                const labelMap = { alert: 'Alert', minor: 'Minor Flood', major: 'Major Flood', critical: 'Critical' }
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: '#374151', fontWeight: 600 }}>{labelMap[key]}</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{val.toFixed(2)} m</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: diff >= 0 ? '#dc2626' : '#16a34a' }}>
                      {diff >= 0 ? `${fmt(Math.abs(diff))}m above` : `${fmt(Math.abs(diff))}m below`}
                    </span>
                  </div>
                )
              }) : <div style={{ fontSize: 11.5, color: '#94a3b8' }}>No threshold data available for this station item.</div>}
            </Panel>
          </div>
        </div>

        {/* ── Historical | Breach log | Upstream-downstream analytics row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 0.9fr', gap: 14 }}>

          {/* Historical comparison with enhanced light theme color rendering */}
          <Panel title="Historical Comparison">
            <InfoRow k="Same date last year" v={`${fmt(historical.sameDateLastYear)} m`} />
            <InfoRow k={`Seasonal avg (${historical.season})`} v={`${fmt(historical.seasonalAvg)} m`} />
            <InfoRow k="All-time record" v={`${fmt(historical.allTimeRecord)} m (${historical.recordDate})`} />
            <div style={{ margin: '8px 0', padding: '7px 10px', background: '#eff6ff', borderRadius: 7, fontSize: 11.5, color: '#1d4ed8', fontWeight: 600 }}>
              Currently at the {historical.percentile}th percentile for {NOW.toLocaleString('en-GB', { month: 'long' })}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>This year vs last year — last 30 days</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={historical.last30ThisYear.map((d, i) => ({ day: d.day, thisYear: d.level, lastYear: historical.last30LastYear[i].level }))}>
                <XAxis dataKey="day" tick={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} width={28} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                {/* Adjusted background bar color from #cbd5e1 to #94a3b8 for perfect contrast under Light Theme */}
                <Bar dataKey="lastYear" fill="#94a3b8" radius={[2, 2, 0, 0]} name="Last year" />
                <Bar dataKey="thisYear" fill="#2563eb" radius={[2, 2, 0, 0]} name="This year" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* Incident / Breach Log */}
          <Panel title="Recent Threshold Breaches (30 Days)" extra={<button onClick={exportCsv} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>CSV ⬇️</button>}>
            <div style={{ overflowY: 'auto', maxHeight: 180 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '4px 0' }}>Date/Time</th>
                    <th>Alert Level</th>
                    <th>Level / Peak</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {breachLog.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                      <td style={{ padding: '6px 0' }}><strong>{b.date}</strong> <span style={{ color: '#94a3b8' }}>{b.timeBreached}</span></td>
                      <td><span style={{ fontWeight: 600, color: b.alertLevel === 'Critical' || b.alertLevel === 'Major Flood' ? '#dc2626' : '#d97706' }}>{b.alertLevel}</span></td>
                      <td>{fmt(b.levelAtBreach)}m / <strong style={{ color: '#1e293b' }}>{fmt(b.peakLevel)}m</strong></td>
                      <td>{b.durationHrs} hrs</td>
                    </tr>
                  ))}
                  {breachLog.length === 0 && (
                    <tr><td colSpan={4} style={{ color: '#94a3b8', padding: 10, textAlign: 'center' }}>No breaches recorded this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Hydraulic Connectivity Neighbors */}
          <Panel title="Hydraulic Context Network">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Upstream Stations</div>
            {neighbors.upstream.map((n) => (
              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: 5, marginBottom: 4, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{n.name.split(' — ')[1] || n.name}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{n.distanceKm} km away</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ALERT_STATUS[n.status].color }}>{fmt(n.level)}m</div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: ALERT_STATUS[n.status].color }}>{n.status}</div>
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Downstream Stations</div>
            {neighbors.downstream.map((n) => (
              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '4px 8px', borderRadius: 5, marginBottom: 4, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{n.name.split(' — ')[1] || n.name}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{n.distanceKm} km away</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ALERT_STATUS[n.status].color }}>{fmt(n.level)}m</div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: ALERT_STATUS[n.status].color }}>{n.status}</div>
                </div>
              </div>
            ))}
          </Panel>
        </div>

        {/* ── Relocated Station Information Panel (Shifted to Bottom) ── */}
        <div style={{ width: '100%', marginTop: 6 }}>
          <Panel title="Station Technical Specifications & Infrastructure Metadata">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 32px', padding: '4px 0' }}>
              <div>
                <InfoRow k="Station ID" v={meta.id} />
                <InfoRow k="Official Name" v={meta.officialName} />
                <InfoRow k="River / Basin" v={`${meta.river} · ${meta.basin}`} />
                <InfoRow k="Coordinates" v={`${meta.lat.toFixed(4)}, ${meta.lng.toFixed(4)}`} />
              </div>
              <div>
                <InfoRow k="Elevation" v={`${meta.elevation} m MSL`} />
                <InfoRow k="Catchment Area" v={`${meta.catchmentArea.toLocaleString()} km²`} />
                <InfoRow k="Gauge Zero (datum)" v={`${meta.gaugeZero.toFixed(1)} m MSL`} />
                <InfoRow k="Sensor Type" v={meta.sensorType} />
              </div>
              <div>
                <InfoRow k="Last Calibration" v={meta.lastCalibration} />
                <InfoRow k="Data Source" v={meta.dataSource} />
                <InfoRow k="Responsible Division" v={meta.officer.div} />
                <InfoRow k="Field Officer" v={`${meta.officer.name} · ${meta.officer.phone}`} />
              </div>
            </div>
          </Panel>
        </div>

      </div>
    </div>
  )
}