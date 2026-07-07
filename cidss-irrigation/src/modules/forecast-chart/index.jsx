import { useState, useMemo } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
  BarChart, Bar, Cell,
} from 'recharts'
import {
  generateEnsemble, generateAccuracyTable, gaugeMiniEnsemble,
  GAUGE_LIST, ALERT_STATUS, NOW,
} from './ensembleData'

const HORIZONS = [6, 12, 24, 48]
const ZOOM_OPTIONS = [12, 24, 48, 96]

const CONFIDENCE_COLOR = { High: '#16a34a', Moderate: '#d97706', Low: '#dc2626' }
const CONFIDENCE_BG    = { High: '#dcfce7', Moderate: '#fef9c3', Low: '#fee2e2' }

const fmt = (n, d = 2) => (typeof n === 'number' ? n.toFixed(d) : '—')
const pct  = (n)       => (typeof n === 'number' ? `${Math.round(n * 100)}%` : '—')

function hLabel(h) {
  if (h === 0) return 'Now'
  return h < 0 ? `${h}h` : `+${h}h`
}

const toggleBtn = (active) => ({
  fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 6, cursor: 'pointer',
  border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
  background: active ? '#2563eb' : '#fff',
  color: active ? '#fff' : '#64748b',
})

// Custom tooltip that surfaces all ensemble fields cleanly
function EnsembleTooltip({ active, payload, label, thresholds }) {
  if (!active || !payload?.length) return null
  const d = payload.reduce((acc, p) => ({ ...acc, [p.dataKey]: p.value }), {})
  const isHist = label < 0
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 11, minWidth: 200, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>t = {hLabel(label)}</div>
      {d.observed != null && <Row label="Observed" value={`${fmt(d.observed)} m`} color="#2563eb" />}
      {!isHist && d.forecast_p90 != null && (
        <>
          <Row label="P90 (worst case)" value={`${fmt(d.forecast_p90)} m`} color="#dc2626" />
          <Row label="P50 (median)"     value={`${fmt(d.forecast_median)} m`} color="#7c3aed" bold />
          <Row label="P10 (best case)"  value={`${fmt(d.forecast_p10)} m`} color="#16a34a" />
          <div style={{ borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />
          <Row label="Spread (P90-P10)" value={`${fmt(d.ensemble_spread)} m`} color="#64748b" />
          {thresholds && (
            <>
              <Row label="Exc. Minor Flood"  value={pct(d.exceedance_minor)}  color="#ea580c" />
              <Row label="Exc. Major Flood"  value={pct(d.exceedance_major)}  color="#dc2626" />
              <Row label="Exc. Critical"     value={pct(d.exceedance_critical)} color="#7f1d1d" />
            </>
          )}
        </>
      )}
    </div>
  )
}
function Row({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || '#1e293b' }}>{value}</span>
    </div>
  )
}

// Exceedance probability pill
function ExcPill({ prob, label }) {
  const p = Math.round(prob * 100)
  const color = p >= 70 ? '#dc2626' : p >= 40 ? '#d97706' : '#16a34a'
  const bg    = p >= 70 ? '#fee2e2' : p >= 40 ? '#fef9c3' : '#dcfce7'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 7, background: bg, marginBottom: 4 }}>
      <div style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: '#374151' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color }}>{p}%</div>
      <div style={{ width: 52, height: 7, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function ForecastPage() {
  const [gaugeId, setGaugeId] = useState('G01')
  const [zoomHrs, setZoomHrs] = useState(96)
  const [showSpaghetti, setShowSpaghetti] = useState(false)
  const [showInnerBand, setShowInnerBand] = useState(true)
  const [activeHorizon, setActiveHorizon] = useState(24)

  const { points, horizonSummary, peak, memberLines, thresholds, gauge, N_MEMBERS } =
    useMemo(() => generateEnsemble(gaugeId), [gaugeId])

  const accuracyTable = useMemo(() => generateAccuracyTable(gaugeId), [gaugeId])

  const chartData = useMemo(() => {
    const half = zoomHrs / 2
    return points.filter((p) => p.h >= -half && p.h <= half)
  }, [points, zoomHrs])

  const hz = horizonSummary.find((h) => h.horizon === activeHorizon) || horizonSummary[0]
  const current = points.find((p) => p.h === 0)

  const peakTime = new Date(NOW.getTime() + peak.h * 3600000)
    .toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100%', fontFamily: 'inherit' }}>

      {/* ── Filter bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '11px 24px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Station</span>
        <select
          value={gaugeId} onChange={(e) => setGaugeId(e.target.value)}
          style={{ fontSize: 12, fontWeight: 600, padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', cursor: 'pointer' }}
        >
          {GAUGE_LIST.map((g) => <option key={g.id} value={g.id}>{g.name} [{g.basin}]</option>)}
        </select>

        <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Zoom</span>
        {ZOOM_OPTIONS.map((z) => (
          <button key={z} onClick={() => setZoomHrs(z)} style={toggleBtn(zoomHrs === z)}>{z}h window</button>
        ))}

        <div style={{ width: 1, height: 26, background: '#e2e8f0' }} />
        <button onClick={() => setShowInnerBand((v) => !v)} style={toggleBtn(showInnerBand)}>P25–P75 band</button>
        <button onClick={() => setShowSpaghetti((v) => !v)} style={toggleBtn(showSpaghetti)}>Spaghetti ({N_MEMBERS} members)</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Model run</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
            {NOW.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} LKT
          </span>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Hero: chart + exceedance panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

          {/* Main chart */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{gauge?.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Ensemble forecast · {N_MEMBERS} members · ±10% rainfall perturbation</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
                <LegendPill color="#93c5fd" alpha label="P10–P90 spread" />
                <LegendPill color="#6d28d9" dash label="P50 Median" />
                <LegendPill color="#2563eb" label="Observed" />
              </div>
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="h" tickFormatter={hLabel} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                <Tooltip content={<EnsembleTooltip thresholds={thresholds} />} />

                {/* Threshold lines */}
                <ReferenceLine y={thresholds.alert}   stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Alert',    fontSize: 9, fill: '#ca8a04', position: 'insideTopRight' }} />
                <ReferenceLine y={thresholds.minor}   stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Minor',    fontSize: 9, fill: '#ea580c', position: 'insideTopRight' }} />
                <ReferenceLine y={thresholds.major}   stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Major',    fontSize: 9, fill: '#dc2626', position: 'insideTopRight' }} />
                <ReferenceLine y={thresholds.critical} stroke="#991b1b" strokeDasharray="3 3" label={{ value: 'Critical', fontSize: 9, fill: '#7f1d1d', position: 'insideTopRight' }} />

                {/* Now marker */}
                <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: 'Now', fontSize: 9, fill: '#94a3b8', position: 'insideTopLeft' }} />

                {/* Outer P10–P90 shaded band */}
                <Area
                  type="monotone"
                  dataKey="forecast_p90"
                  stroke="none"
                  fill="#dbeafe"
                  fillOpacity={0.55}
                  legendType="none"
                  name="P90 (worst case)"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="forecast_p10"
                  stroke="none"
                  fill="#f0f4f8"
                  fillOpacity={1}
                  legendType="none"
                  name="P10 fill-back"
                  connectNulls
                />

                {/* Inner P25–P75 band */}
                {showInnerBand && (
                  <>
                    <Area type="monotone" dataKey="forecast_p75" stroke="none" fill="#bfdbfe" fillOpacity={0.7} legendType="none" name="P75" connectNulls />
                    <Area type="monotone" dataKey="forecast_p25" stroke="none" fill="#f0f4f8" fillOpacity={1} legendType="none" name="P25 fill-back" connectNulls />
                  </>
                )}

                {/* Spaghetti member lines (optional) */}
                {showSpaghetti && memberLines.map((ml, i) => (
                  <Line
                    key={`m${i}`}
                    data={ml.map((p) => ({ h: p.h, [`m${i}`]: p.level }))}
                    type="monotone"
                    dataKey={`m${i}`}
                    stroke="#93c5fd"
                    strokeWidth={0.7}
                    dot={false}
                    legendType="none"
                    connectNulls
                    opacity={0.5}
                  />
                ))}

                {/* P90 boundary line */}
                <Line type="monotone" dataKey="forecast_p90" stroke="#ef4444" strokeWidth={1.2} strokeDasharray="3 3" dot={false} name="P90 (worst case)" connectNulls />
                {/* P10 boundary line */}
                <Line type="monotone" dataKey="forecast_p10" stroke="#16a34a" strokeWidth={1.2} strokeDasharray="3 3" dot={false} name="P10 (best case)" connectNulls />
                {/* Median — bold */}
                <Line type="monotone" dataKey="forecast_median" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="5 3" dot={false} name="P50 Median" connectNulls />
                {/* Observed — solid */}
                <Line type="monotone" dataKey="observed" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Observed" connectNulls />

                {/* Peak dot on P90 */}
                <ReferenceDot
                  x={peak.h} y={peak.forecast_p90} r={5}
                  fill="#dc2626" stroke="#fff" strokeWidth={2}
                  label={{ value: `P90 peak ${fmt(peak.forecast_p90)}m`, fontSize: 9.5, fill: '#dc2626', position: 'top' }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', gap: 20, marginTop: 6, fontSize: 11.5, color: '#64748b', flexWrap: 'wrap' }}>
              <span>P90 peak: <strong style={{ color: '#dc2626' }}>{fmt(peak.forecast_p90)} m</strong> at {peakTime}</span>
              <span>P50 peak: <strong style={{ color: '#7c3aed' }}>{fmt(peak.forecast_median)} m</strong></span>
              <span>P10 peak: <strong style={{ color: '#16a34a' }}>{fmt(peak.forecast_p10)} m</strong></span>
            </div>
          </div>

          {/* Exceedance probability panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Current reading */}
            <Panel title="Current Reading">
              <div style={{ fontSize: 30, fontWeight: 900, color: '#dc2626', textAlign: 'center', padding: '4px 0 2px' }}>
                {fmt(current?.observed)} m
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                {NOW.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} LKT
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 5, background: '#fee2e2', color: '#dc2626' }}>
                  {gauge?.trend} Rising
                </span>
              </div>
            </Panel>

            {/* Horizon selector + exceedance */}
            <Panel
              title="Exceedance Probability"
              action={
                <div style={{ display: 'flex', gap: 4 }}>
                  {HORIZONS.map((h) => (
                    <button key={h} onClick={() => setActiveHorizon(h)} style={{ ...toggleBtn(activeHorizon === h), padding: '3px 8px', fontSize: 10 }}>
                      +{h}h
                    </button>
                  ))}
                </div>
              }
            >
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                Probability ensemble exceeds threshold within <strong>+{activeHorizon}h</strong>:
              </div>
              {hz && (
                <>
                  <ExcPill prob={hz.exceedance_alert}    label="Alert level" />
                  <ExcPill prob={hz.exceedance_minor}    label="Minor Flood" />
                  <ExcPill prob={hz.exceedance_major}    label="Major Flood" />
                  <ExcPill prob={hz.exceedance_critical} label="Critical" />
                  <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, background: CONFIDENCE_BG[hz.confidence], fontSize: 11.5 }}>
                    <span style={{ color: '#64748b' }}>Ensemble confidence: </span>
                    <strong style={{ color: CONFIDENCE_COLOR[hz.confidence] }}>{hz.confidence}</strong>
                    <span style={{ color: '#94a3b8' }}> (spread {fmt(hz.spread)} m)</span>
                  </div>
                </>
              )}
            </Panel>

            {/* Defensible alert callout */}
            {hz && hz.exceedance_major >= 0.5 && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10,
                padding: '12px 14px', fontSize: 11.5,
              }}>
                <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>⚠ Alert Basis</div>
                <div style={{ color: '#7f1d1d', lineHeight: 1.6 }}>
                  Level currently <strong>{fmt(current?.observed)} m</strong> · <strong>{pct(hz.exceedance_major)}</strong> of {N_MEMBERS} ensemble members exceed <strong>Major Flood ({fmt(thresholds.major)} m)</strong> within +{activeHorizon}h — recommend issuing warning.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Horizon summary cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {horizonSummary.map((hz) => (
            <div
              key={hz.horizon}
              onClick={() => setActiveHorizon(hz.horizon)}
              style={{
                background: '#fff', borderRadius: 10, border: activeHorizon === hz.horizon ? '2px solid #2563eb' : '1px solid #e2e8f0',
                padding: '13px 14px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>T +{hz.horizon}h</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: CONFIDENCE_BG[hz.confidence], color: CONFIDENCE_COLOR[hz.confidence] }}>
                  {hz.confidence}
                </span>
              </div>
              <div style={{ display: 'flex', justify: 'space-between', gap: 4, marginBottom: 8 }}>
                <LevelPill label="P10" value={hz.p10} color="#16a34a" />
                <LevelPill label="P50" value={hz.p50} color="#7c3aed" bold />
                <LevelPill label="P90" value={hz.p90} color="#dc2626" />
              </div>
              {/* Spread bar */}
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>Spread: {fmt(hz.spread)} m</div>
              <SpreadBar p10={hz.p10} p90={hz.p90} current={current?.observed} thresholds={thresholds} />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b' }}>Major flood exceedance</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: hz.exceedance_major >= 0.5 ? '#dc2626' : '#16a34a' }}>
                  {pct(hz.exceedance_major)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Spread chart + Accuracy table ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Ensemble spread over time */}
          <Panel title="Ensemble Spread Width Over Forecast Horizon">
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
              Narrow = high confidence · Wide = high uncertainty. Watch it widen as the model looks further ahead.
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={points.filter((p) => p.h > 0 && p.h <= 48)} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="h" tickFormatter={(h) => `+${h}h`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v) => [`${fmt(v)} m`, 'Spread (P90-P10)']}
                  labelFormatter={(h) => `T +${h}h`}
                  contentStyle={{ fontSize: 11, borderRadius: 7 }}
                />
                <Bar dataKey="ensemble_spread" radius={[3, 3, 0, 0]} name="Spread">
                  {points.filter((p) => p.h > 0 && p.h <= 48).map((p, i) => (
                    <Cell
                      key={i}
                      fill={p.ensemble_spread < 0.3 ? '#16a34a' : p.ensemble_spread < 0.7 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* Accuracy table */}
          <Panel title="Forecast Accuracy — Last 7 Runs">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Date', 'MAE (m)', 'RMSE (m)', 'Bias (m)', 'Spread (m)', 'Confidence', 'Obs. within P90'].map((h) => (
                      <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accuracyTable.map((row) => (
                    <tr key={row.date} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{row.date}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontWeight: 700, color: row.mae > 0.15 ? '#dc2626' : '#16a34a' }}>{fmt(row.mae)}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{fmt(row.rmse)}</td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: row.bias > 0 ? '#ea580c' : '#0891b2' }}>{row.bias > 0 ? '+' : ''}{fmt(row.bias)}</td>
                      <td style={{ padding: '7px 8px' }}>
                        <SpreadCell spread={row.spread} />
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: CONFIDENCE_BG[row.confidence], color: CONFIDENCE_COLOR[row.confidence] }}>
                          {row.confidence}
                        </span>
                      </td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: row.withinP90 >= 90 ? '#16a34a' : '#d97706' }}>{row.withinP90}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ── Small presentational helpers ──────────────────────────────────

function Panel({ title, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '13px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

function LegendPill({ color, label, dash, alpha }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 22, height: 3, background: alpha ? `${color}66` : color, borderRadius: 2,
        borderTop: dash ? `2px dashed ${color}` : undefined,
        background: alpha ? `${color}55` : (dash ? 'none' : color),
      }} />
      <span style={{ fontSize: 10.5, color: '#64748b' }}>{label}</span>
    </div>
  )
}

function LevelPill({ label, value, color, bold }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', background: '#f8fafc', borderRadius: 6, padding: '4px 2px' }}>
      <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: 11.5, fontWeight: bold ? 800 : 600, color }}>{fmt(value)}m</div>
    </div>
  )
}

// Visual bar showing where current level sits within P10-P90 range
function SpreadBar({ p10, p90, current, thresholds }) {
  const total = Math.max(p90 - p10, 0.01)
  const curPos = Math.max(0, Math.min(1, (current - p10) / total))
  const minorPos = Math.max(0, Math.min(1, (thresholds.minor - p10) / total))
  const majorPos = Math.max(0, Math.min(1, (thresholds.major - p10) / total))
  return (
    <div style={{ position: 'relative', height: 10, background: '#dbeafe', borderRadius: 5, overflow: 'visible', marginTop: 2 }}>
      {/* Minor threshold tick */}
      {minorPos > 0 && minorPos < 1 && (
        <div style={{ position: 'absolute', left: `${minorPos * 100}%`, top: -2, width: 1.5, height: 14, background: '#f97316' }} />
      )}
      {/* Major threshold tick */}
      {majorPos > 0 && majorPos < 1 && (
        <div style={{ position: 'absolute', left: `${majorPos * 100}%`, top: -2, width: 1.5, height: 14, background: '#dc2626' }} />
      )}
      {/* Current level diamond */}
      <div style={{
        position: 'absolute', left: `${curPos * 100}%`, top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 8, height: 8, background: '#2563eb',
        borderRadius: 2, rotate: '45deg', border: '1.5px solid #fff',
      }} />
    </div>
  )
}

function SpreadCell({ spread }) {
  const color = spread < 0.3 ? '#16a34a' : spread < 0.65 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: Math.min(48, spread * 48), height: 6, background: color, borderRadius: 3 }} />
      <span style={{ fontSize: 10.5, fontFamily: 'monospace', color }}>{fmt(spread)}</span>
    </div>
  )
}

/*
 * API wiring notes:
 *  - POST /ml/ensemble-summary { gaugeId, horizonHours }
 *      → horizonSummary (percentiles, exceedance probs, confidence)
 *  - GET /api/v1/gauges/:id/timeseries
 *      → points[].observed (historical observed)
 *  - GET /api/v1/gauges/:id/forecast
 *      → points[].forecast_median/p10/p90/ensemble_spread/exceedance_* (20-member ensemble)
 *
 *  The Python service generates the ensemble by running Muskingum routing
 *  20× with ±10% rainfall perturbation in parallel on 16 cores.
 *  gaugeMiniEnsemble(id) is the function to call for M5 gauge cards —
 *  replace with a real /ml/ensemble-summary?horizon=24 fetch.
 */