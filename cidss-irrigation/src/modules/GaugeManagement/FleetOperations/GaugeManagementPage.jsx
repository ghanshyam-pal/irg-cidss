import { useState, useMemo, Fragment } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { MapContainer, GeoJSON, CircleMarker, Popup, Tooltip as LTooltip, useMap } from 'react-leaflet'
import {
  GAUGE_FLEET, ALL_FAULT_TICKETS, computeFleetStats,
  generateTransmissionHeatmap, generateQualityChart, generateQualityFlags,
  generateMaintenanceLog, TECHNICIANS, FAULT_TYPES, NOW,
} from './gaugeManagementData'
// import srilankaGeo from './srilanka.geo.json'
import srilankaGeo from '../../../data/geojsons/slk_country.json'

const SL_BOUNDS = [[5.7, 79.4], [10.05, 82.1]]
const SL_CENTER = [7.87, 80.77]

const MARKER_COLORS = {
  ONLINE:     { fill: '#22c55e', label: 'Online',          dot: '#16a34a' },
  DELAYED:    { fill: '#eab308', label: 'Delayed',         dot: '#ca8a04' },
  OFFLINE:    { fill: '#ef4444', label: 'Offline',         dot: '#dc2626' },
  MAINTENANCE:{ fill: '#94a3b8', label: 'Maintenance',     dot: '#64748b' },
  RECENT_CAL: { fill: '#3b82f6', label: 'Recently Cal.',   dot: '#2563eb' },
}

const HEATMAP_COLORS = { OK: '#22c55e', LATE: '#eab308', MISSING: '#ef4444' }
const PRIORITY_COLOR  = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#64748b' }
const PRIORITY_BG     = { Critical: '#fee2e2', High: '#ffedd5', Medium: '#fef9c3', Low: '#f1f5f9' }

const fmt2 = (n) => typeof n === 'number' ? n.toFixed(2) : '—'
const pctColor = (p) => p >= 90 ? '#16a34a' : p >= 70 ? '#d97706' : '#dc2626'
const batColor  = (p) => p >= 50 ? '#16a34a' : p >= 20 ? '#d97706' : '#dc2626'

function statusBadge(status) {
  const map = { ONLINE: ['#dcfce7','#16a34a'], DELAYED: ['#fef9c3','#ca8a04'], OFFLINE: ['#fee2e2','#dc2626'], MAINTENANCE: ['#f1f5f9','#64748b'], DECOMMISSIONED: ['#f8fafc','#94a3b8'] }
  const [bg, color] = map[status] || ['#f8fafc','#94a3b8']
  return { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: bg, color }
}

function MapControls() {
  const map = useMap()
  const s = { width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', borderRadius: 5, cursor: 'pointer', fontSize: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: 6 }}>
      <button style={s} onClick={() => map.zoomIn()}>🔍+</button>
      <button style={s} onClick={() => map.zoomOut()}>🔍-</button>
      <button style={s} onClick={() => map.fitBounds(SL_BOUNDS)}>⛶</button>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 440, maxWidth: 560, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalField({ label, type = 'text', options, value, onChange }) {
  const s = { width: '100%', fontSize: 12, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 7, marginTop: 4, boxSizing: 'border-box' }
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{label}</label>
      {type === 'select'
        ? <select value={value} onChange={(e) => onChange(e.target.value)} style={s}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : type === 'textarea'
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...s, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={s} />}
    </div>
  )
}

export default function GaugeManagementPage() {
  const [selectedId, setSelectedId]   = useState('G001')
  const [tableFilter, setTableFilter] = useState({ status: 'All', basin: 'All', battery: 'All', calDue: false })
  const [tableSort, setTableSort]     = useState({ col: 'id', dir: 1 })
  const [tablePage, setTablePage]     = useState(0)
  const [ticketsOpen, setTicketsOpen] = useState(true)
  const [showMaintModal, setShowMaintModal] = useState(false)
  const [showFaultModal, setShowFaultModal] = useState(false)
  const [maintForm, setMaintForm]     = useState({ date: '', type: 'Routine Inspection', technician: TECHNICIANS[0], notes: '', nextVisit: '' })
  const [faultForm, setFaultForm]     = useState({ description: '', priority: 'High' })
  const [adminMsg, setAdminMsg]       = useState('')

  const fleet = useMemo(() => computeFleetStats(), [])
  const gauge  = useMemo(() => GAUGE_FLEET.find((g) => g.id === selectedId), [selectedId])
  const heatmap    = useMemo(() => generateTransmissionHeatmap(selectedId), [selectedId])
  const qualChart  = useMemo(() => generateQualityChart(selectedId), [selectedId])
  const qualFlags  = useMemo(() => generateQualityFlags(selectedId), [selectedId])
  const maintLog   = useMemo(() => generateMaintenanceLog(selectedId), [selectedId])

  const openTickets = ALL_FAULT_TICKETS
  const criticalCount = openTickets.filter((t) => t.priority === 'Critical').length

  const heatDays = [...new Set(heatmap.map((c) => c.day))].sort((a, b) => a - b)

  // Uptime stats
  const ok30   = heatmap.filter((c) => c.state === 'OK').length
  const uptime30 = Math.round((ok30 / heatmap.length) * 100)
  const hm7 = heatmap.filter((c) => c.day >= 23)
  const uptime7 = Math.round((hm7.filter((c) => c.state === 'OK').length / hm7.length) * 100)

  // Longest outage
  let longestOutage = 0, currentRun = 0
  heatmap.forEach((c) => {
    if (c.state === 'MISSING') { currentRun++; longestOutage = Math.max(longestOutage, currentRun) }
    else currentRun = 0
  })

  // Fleet table
  const basins = ['All', ...new Set(GAUGE_FLEET.map((g) => g.basin))]
  const filteredFleet = useMemo(() => {
    let list = GAUGE_FLEET.filter((g) =>
      (tableFilter.status === 'All' || g.status === tableFilter.status) &&
      (tableFilter.basin === 'All' || g.basin === tableFilter.basin) &&
      (tableFilter.battery === 'All' || (tableFilter.battery === 'Low' && g.batteryPct < 20) || (tableFilter.battery === 'OK' && g.batteryPct >= 20)) &&
      (!tableFilter.calDue || g.calOverdue)
    )
    const col = tableSort.col
    list = [...list].sort((a, b) => {
      const av = a[col]; const bv = b[col]
      if (av == null) return 1; if (bv == null) return -1
      return (av < bv ? -1 : av > bv ? 1 : 0) * tableSort.dir
    })
    return list
  }, [tableFilter, tableSort])

  const PAGE_SIZE = 10
  const paginated = filteredFleet.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filteredFleet.length / PAGE_SIZE)

  const sortBy = (col) => setTableSort((s) => ({ col, dir: s.col === col ? -s.dir : 1 }))

  const adminAction = (msg) => { setAdminMsg(msg); setTimeout(() => setAdminMsg(''), 3000) }

  const exportCSV = () => {
    const hdr = 'ID,Name,Basin,River,Status,Last Reading,Battery %,24h Completeness,Cal Due,Open Tickets\n'
    const rows = filteredFleet.map((g) =>
      `${g.id},"${g.name}",${g.basin},${g.river},${g.status},${g.lastReading.toISOString()},${g.batteryPct},${g.completeness24h},${g.nextCalibration},${g.faultTickets.length}`
    ).join('\n')
    const blob = new Blob([hdr + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'gauge-fleet.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const thStyle = { padding: '7px 10px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }
  const tdStyle = { padding: '7px 10px', fontSize: 11, borderBottom: '1px solid #f8fafc' }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100%', fontFamily: 'inherit' }}>

      {/* ── Fleet Health Summary Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard
            icon="📡" label="Total Gauges"
            main={`${fleet.total}`}
            sub={`${fleet.active} active · ${fleet.offline} offline`}
            color={fleet.offline > 3 ? '#dc2626' : fleet.offline > 0 ? '#d97706' : '#16a34a'}
            bg={fleet.offline > 3 ? '#fee2e2' : fleet.offline > 0 ? '#fef9c3' : '#dcfce7'}
          />
          <StatCard
            icon="📶" label="Transmission Health"
            main={`${fleet.transmissionHealth}%`}
            sub={`last 1 hour on schedule`}
            color={fleet.transmissionHealth < 80 ? '#dc2626' : fleet.transmissionHealth < 90 ? '#d97706' : '#16a34a'}
            bg={fleet.transmissionHealth < 80 ? '#fee2e2' : fleet.transmissionHealth < 90 ? '#fef9c3' : '#dcfce7'}
          />
          <StatCard
            icon="🔋" label="Battery Status"
            main={`${fleet.lowBattery}`}
            sub={`gauges below 20% battery`}
            color={fleet.lowBattery > 3 ? '#dc2626' : fleet.lowBattery > 0 ? '#d97706' : '#16a34a'}
            bg={fleet.lowBattery > 3 ? '#fee2e2' : fleet.lowBattery > 0 ? '#fef9c3' : '#dcfce7'}
          />
          <StatCard
            icon="🔧" label="Calibration Due"
            main={`${fleet.calOverdue}`}
            sub={`gauges overdue this month`}
            color={fleet.calOverdue > 5 ? '#dc2626' : fleet.calOverdue > 0 ? '#d97706' : '#16a34a'}
            bg={fleet.calOverdue > 5 ? '#fee2e2' : fleet.calOverdue > 0 ? '#fef9c3' : '#dcfce7'}
          />
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Map | Detail panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 14 }}>

          {/* Operational health map */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Operational Health Map</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {Object.entries(MARKER_COLORS).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.fill, display: 'inline-block' }} />
                    <span style={{ fontSize: 10.5, color: '#64748b' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', height: 420 }}>
              <MapContainer center={SL_CENTER} zoom={7} minZoom={6.5} maxZoom={12}
                maxBounds={SL_BOUNDS} maxBoundsViscosity={0.8} zoomSnap={0.1}
                scrollWheelZoom zoomControl={false} attributionControl={false}
                style={{ height: '100%', width: '100%', background: 'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 40%,#e0f2fe 100%)' }}>
                <GeoJSON data={srilankaGeo} style={() => ({ color: '#64748b', weight: 1.2, fillColor: '#f8fafc', fillOpacity: 0.5 })} />
                {GAUGE_FLEET.map((g) => {
                  const mc = MARKER_COLORS[g.markerStatus]
                  const isSel = g.id === selectedId
                  return (
                    <Fragment key={g.id}>
                      <CircleMarker center={[g.lat, g.lng]} radius={isSel ? 14 : 10}
                        pathOptions={{ stroke: false, fillColor: mc.fill, fillOpacity: 0.22 }}
                        eventHandlers={{ click: () => setSelectedId(g.id) }} />
                      <CircleMarker center={[g.lat, g.lng]} radius={isSel ? 7 : 5}
                        pathOptions={{ color: '#fff', weight: isSel ? 2 : 1.5, fillColor: mc.fill, fillOpacity: 1 }}
                        eventHandlers={{ click: () => setSelectedId(g.id) }}>
                        <LTooltip direction="top" offset={[0, -6]}>{g.id} · {g.status}</LTooltip>
                        <Popup>
                          <div style={{ fontSize: 12, minWidth: 160 }}>
                            <div style={{ fontWeight: 700, marginBottom: 3 }}>{g.name}</div>
                            <div>Status: <span style={{ fontWeight: 700, color: mc.fill }}>{g.status}</span></div>
                            <div>Battery: {g.batteryPct}%</div>
                            <div>Last reading: {g.lastReadingMinsAgo}m ago</div>
                            <button onClick={() => setSelectedId(g.id)} style={{ marginTop: 6, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', width: '100%' }}>
                              Load detail →
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    </Fragment>
                  )
                })}
                <MapControls />
              </MapContainer>
            </div>
          </div>

          {/* Gauge detail panel */}
          {gauge && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 470 }}>

              {/* Identity */}
              <Panel title={`${gauge.id} — ${gauge.name.split(' — ')[0]}`}>
                <InfoRow k="Official name" v={gauge.officialName} />
                <InfoRow k="River / Basin" v={`${gauge.river} · ${gauge.basin}`} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>GPS</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', fontFamily: 'monospace', cursor: 'pointer' }}
                    onClick={() => { navigator.clipboard?.writeText?.(`${gauge.lat}, ${gauge.lng}`); adminAction('Coordinates copied!') }}>
                    {gauge.lat}, {gauge.lng} 📋
                  </span>
                </div>
                <InfoRow k="Elevation" v={`${gauge.elevation} m MSL`} />
                <InfoRow k="Installed" v={gauge.installDate} />
                <InfoRow k="Sensor" v={`${gauge.sensorMake} ${gauge.sensorModel}`} />
                <InfoRow k="Division" v={gauge.division} />
                <InfoRow k="Field Officer" v={`${gauge.officer} · ${gauge.phone}`} />
              </Panel>

              {/* Live status */}
              <Panel title="Live Status">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Transmission</span>
                  <span style={statusBadge(gauge.status)}>{gauge.status}</span>
                </div>
                <InfoRow k="Last reading" v={`${gauge.lastReadingMinsAgo} min ago`} />
                <InfoRow k="Tx interval" v={`Every ${gauge.expectedInterval} min`} />
                <InfoRow k="Missed (consecutive)" v={gauge.consecutiveMissed === 0 ? '—' : gauge.consecutiveMissed} />
                {gauge.signalStrength != null && <InfoRow k="Signal strength" v={`${gauge.signalStrength} dBm`} />}
                <InfoRow k="Battery" v={
                  <span style={{ fontWeight: 700, color: batColor(gauge.batteryPct) }}>
                    {gauge.batteryVoltage}V · {gauge.batteryPct}% ({gauge.batteryTrend.toLowerCase()})
                  </span>
                } />
                {gauge.solarStatus && <InfoRow k="Solar panel" v={gauge.solarStatus} />}
                {gauge.predictedFailureDays && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: '#fef9c3', borderRadius: 6, fontSize: 11.5, color: '#92400e', fontWeight: 600 }}>
                    ⚡ ML: Predicted failure in ~{gauge.predictedFailureDays} days based on battery drain rate
                  </div>
                )}
              </Panel>

              {/* Data quality */}
              <Panel title="Data Quality">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <QualPill label="24h completeness" value={`${gauge.completeness24h}%`} color={pctColor(gauge.completeness24h)} />
                  <QualPill label="7-day completeness" value={`${gauge.completeness7d}%`} color={pctColor(gauge.completeness7d)} />
                </div>
                <InfoRow k="Outliers" v={gauge.outlierCount} />
                <InfoRow k="Frozen values" v={gauge.frozenCount} />
                <InfoRow k="Spike flags" v={gauge.spikeCount} />
                <InfoRow k="Anomaly score (ML)" v={
                  <span style={{ fontWeight: 700, color: gauge.anomalyScore > 0.7 ? '#dc2626' : gauge.anomalyScore > 0.4 ? '#d97706' : '#16a34a' }}>
                    {gauge.anomalyScore} {gauge.anomalyScore > 0.7 ? '⚠' : ''}
                  </span>
                } />
                {gauge.missingGaps.map((g2, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                    Gap: {g2.startHoursAgo}h ago · {g2.durationH}h duration
                  </div>
                ))}
              </Panel>

              {/* Calibration */}
              <Panel title="Calibration">
                <InfoRow k="Last calibration" v={gauge.lastCalibration} />
                <InfoRow k="Next due" v={
                  <span style={{ fontWeight: 700, color: gauge.calOverdue ? '#dc2626' : '#16a34a' }}>
                    {gauge.nextCalibration} {gauge.calOverdue ? '⚠ OVERDUE' : ''}
                  </span>
                } />
                <InfoRow k="Certificate ref" v={gauge.calRef} />
                <InfoRow k="Drift (mm)" v={fmt2(gauge.driftMm)} />
                <InfoRow k="Calibrated by" v={gauge.calibratedBy} />
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Last 5 calibrations</div>
                {gauge.calibrationHistory.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 3, color: '#64748b' }}>
                    <span>{c.date}</span><span>{c.tech}</span><span style={{ fontFamily: 'monospace' }}>{c.drift > 0 ? '+' : ''}{c.drift}mm</span><span style={{ color: '#94a3b8' }}>{c.ref}</span>
                  </div>
                ))}
              </Panel>

              {/* Admin actions */}
              <Panel title="Admin Actions">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    ['🔧 Mark Maintenance', 'amber', () => adminAction(`${gauge.id} marked as Under Maintenance`)],
                    ['🚫 Decommission', 'red', () => adminAction(`${gauge.id} decommissioned`)],
                    ['🔄 Force Re-fetch', 'blue', () => adminAction(`Manual poll triggered for ${gauge.id}`)],
                    ['✏️ Override Reading', 'slate', () => adminAction('Override mode — select reading in quality flags table')],
                  ].map(([label, tone, fn]) => (
                    <button key={label} onClick={fn} style={{
                      fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', border: 'none',
                      background: { amber: '#fef9c3', red: '#fee2e2', blue: '#eff6ff', slate: '#f1f5f9' }[tone],
                      color: { amber: '#92400e', red: '#dc2626', blue: '#2563eb', slate: '#374151' }[tone],
                    }}>{label}</button>
                  ))}
                </div>
                {adminMsg && <div style={{ marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ {adminMsg}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setShowMaintModal(true)} style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: '7px', borderRadius: 7, cursor: 'pointer', border: 'none', background: '#2563eb', color: '#fff' }}>
                    + Add Maintenance Record
                  </button>
                  <button onClick={() => setShowFaultModal(true)} style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: '7px', borderRadius: 7, cursor: 'pointer', border: '1px solid #dc2626', background: '#fff', color: '#dc2626' }}>
                    ⚠ Raise Fault Report
                  </button>
                </div>
              </Panel>
            </div>
          )}
        </div>

        {/* ── Heatmap | Data Quality | Maintenance ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr', gap: 14 }}>

          {/* Transmission heatmap */}
          <Panel title="Transmission Timeline — Last 30 Days">
            <div style={{ display: 'flex', gap: 4, fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>
              {['OK', 'LATE', 'MISSING'].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: HEATMAP_COLORS[s], display: 'inline-block' }} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            {/* Hour axis */}
            <div style={{ display: 'flex', gap: 1, marginBottom: 2, paddingLeft: 28 }}>
              {[0, 6, 12, 18, 23].map((h) => (
                <span key={h} style={{ fontSize: 8.5, color: '#94a3b8', flex: h === 0 ? '6' : '6', textAlign: 'left' }}>
                  {String(h).padStart(2, '0')}h
                </span>
              ))}
            </div>
            {/* Grid: days as rows, hours as columns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {heatDays.map((day) => {
                const dayCells = heatmap.filter((c) => c.day === day)
                const daysAgo = 29 - day
                const d = new Date(NOW.getTime() - daysAgo * 86400000)
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ width: 26, fontSize: 8.5, color: '#94a3b8', textAlign: 'right', marginRight: 2, flexShrink: 0 }}>
                      {d.getDate()}/{d.getMonth() + 1}
                    </span>
                    {dayCells.map((c) => (
                      <div
                        key={c.hour}
                        title={`${d.toLocaleDateString('en-GB')} ${String(c.hour).padStart(2, '0')}:00 — ${c.state}`}
                        style={{ flex: 1, height: 9, borderRadius: 1.5, background: HEATMAP_COLORS[c.state], cursor: 'default', opacity: 0.88 }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
              <UptimeStat label="7-day"  value={`${uptime7}%`}  color={pctColor(uptime7)} />
              <UptimeStat label="30-day" value={`${uptime30}%`} color={pctColor(uptime30)} />
              <UptimeStat label="Longest outage" value={`${longestOutage}h`} color={longestOutage > 24 ? '#dc2626' : '#d97706'} />
              <UptimeStat label="Missed total" value={heatmap.filter((c) => c.state === 'MISSING').length} color="#64748b" />
            </div>
          </Panel>

          {/* Data quality */}
          <Panel title="Data Quality — Last 30 Days">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={qualChart} margin={{ left: -16, right: 4, top: 2, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 7 }} labelFormatter={(l) => l} formatter={(v, n) => [v, n]} />
                <Bar dataKey="expected" fill="#e2e8f0" radius={[2, 2, 0, 0]} name="Expected" />
                <Bar dataKey="good"     fill="#3b82f6" radius={[0, 0, 0, 0]} name="Received (good)" stackId="a" />
                <Bar dataKey="flagged"  fill="#ef4444" radius={[2, 2, 0, 0]} name="Flagged" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '8px 0 5px' }}>Recent Quality Flags</div>
            <div style={{ maxHeight: 130, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  {['Time', 'Value', 'Reason', 'Decision'].map((h) => (
                    <th key={h} style={{ ...thStyle, fontSize: 10, cursor: 'default' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {qualFlags.slice(0, 8).map((f) => (
                    <tr key={f.id}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{f.timestamp}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{f.value}m</td>
                      <td style={{ ...tdStyle, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.reason}>{f.reason}</td>
                      <td style={tdStyle}>
                        {!f.reviewed ? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending</span>
                          : f.accepted ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Accepted</span>
                          : <span style={{ color: '#dc2626', fontWeight: 700 }}>✕ Rejected</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Maintenance log */}
          <Panel title="Maintenance Log">
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {maintLog.map((m) => (
                <div key={m.id} style={{ borderLeft: '3px solid #2563eb', paddingLeft: 10, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>{m.type}</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>{m.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{m.technician}</div>
                  <div style={{ fontSize: 11, color: '#374151', margin: '3px 0' }}>{m.description}</div>
                  {m.partsReplaced !== 'None' && <div style={{ fontSize: 10.5, color: '#7c3aed' }}>🔩 {m.partsReplaced} replaced</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>Next: {m.nextVisit}</span>
                    {m.photos > 0 && <span style={{ fontSize: 10.5, color: '#2563eb' }}>📷 {m.photos} photos</span>}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Fleet table + Fault tickets ── */}
        <div style={{ display: 'grid', gridTemplateColumns: ticketsOpen ? '1fr 340px' : '1fr 36px', gap: 14, transition: 'grid-template-columns .2s' }}>

          {/* Fleet table */}
          <Panel title={`Full Gauge Fleet — ${filteredFleet.length} of ${GAUGE_FLEET.length} stations`}
            action={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Filters */}
                {[
                  { label: 'Status', key: 'status', opts: ['All', 'ONLINE', 'DELAYED', 'OFFLINE', 'MAINTENANCE'] },
                  { label: 'Basin',  key: 'basin',  opts: basins },
                  { label: 'Battery', key: 'battery', opts: ['All', 'OK', 'Low'] },
                ].map(({ label, key, opts }) => (
                  <select key={key} value={tableFilter[key]}
                    onChange={(e) => { setTableFilter((f) => ({ ...f, [key]: e.target.value })); setTablePage(0) }}
                    style={{ fontSize: 11, padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff' }}>
                    {opts.map((o) => <option key={o} value={o}>{label}: {o}</option>)}
                  </select>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={tableFilter.calDue} onChange={(e) => setTableFilter((f) => ({ ...f, calDue: e.target.checked }))} />
                  Cal. overdue
                </label>
                <button onClick={exportCSV} style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, border: '1px solid #2563eb', background: '#fff', color: '#2563eb', cursor: 'pointer' }}>
                  ⬇ CSV
                </button>
              </div>
            }>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {[['id','ID'],['name','Name'],['basin','Basin'],['status','Status'],['lastReadingMinsAgo','Last Reading'],['batteryPct','Bat %'],['completeness24h','24h Comp.'],['completeness7d','7d Comp.'],['nextCalibration','Cal. Due'],].map(([col, label]) => (
                      <th key={col} style={thStyle} onClick={() => sortBy(col)}>
                        {label} {tableSort.col === col ? (tableSort.dir === 1 ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    <th style={{ ...thStyle, cursor: 'default' }}>Tickets</th>
                    <th style={{ ...thStyle, cursor: 'default' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((g) => (
                    <tr key={g.id} style={{ background: g.id === selectedId ? '#eff6ff' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedId(g.id)}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>{g.id}</td>
                      <td style={{ ...tdStyle, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</td>
                      <td style={tdStyle}>{g.basin}</td>
                      <td style={tdStyle}><span style={statusBadge(g.status)}>{g.status}</span></td>
                      <td style={{ ...tdStyle, color: g.lastReadingMinsAgo > 60 ? '#dc2626' : '#64748b' }}>{g.lastReadingMinsAgo}m ago</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: batColor(g.batteryPct) }}>{g.batteryPct}%</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: pctColor(g.completeness24h) }}>{g.completeness24h}%</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: pctColor(g.completeness7d) }}>{g.completeness7d}%</td>
                      <td style={{ ...tdStyle, color: g.calOverdue ? '#dc2626' : '#64748b', fontWeight: g.calOverdue ? 700 : 400 }}>{g.nextCalibration}</td>
                      <td style={tdStyle}>
                        {g.faultTickets.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#fee2e2', color: '#dc2626' }}>{g.faultTickets.length}</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedId(g.id) }} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', marginRight: 3 }}>View</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedId(g.id); setShowFaultModal(true) }} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Fault</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Page {tablePage + 1} of {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button disabled={tablePage === 0} onClick={() => setTablePage((p) => p - 1)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: tablePage === 0 ? '#f8fafc' : '#fff', cursor: tablePage === 0 ? 'default' : 'pointer', color: '#64748b' }}>← Prev</button>
                <button disabled={tablePage >= totalPages - 1} onClick={() => setTablePage((p) => p + 1)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: tablePage >= totalPages - 1 ? '#f8fafc' : '#fff', cursor: tablePage >= totalPages - 1 ? 'default' : 'pointer', color: '#64748b' }}>Next →</button>
              </div>
            </div>
          </Panel>

          {/* Fault ticket panel */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '11px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setTicketsOpen((v) => !v)}>
              {ticketsOpen
                ? <><span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>Fault Tickets</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#fee2e2', color: '#dc2626' }}>{criticalCount} critical</span></>
                : <span style={{ fontSize: 12, color: '#94a3b8', writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'block', padding: '8px 0' }}>Fault Tickets ({openTickets.length})</span>
              }
            </div>
            {ticketsOpen && (
              <>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                  <span><strong style={{ color: '#dc2626' }}>{openTickets.filter(t=>t.priority==='Critical').length}</strong> critical</span>
                  <span><strong style={{ color: '#ea580c' }}>{openTickets.filter(t=>t.priority==='High').length}</strong> high</span>
                  <span><strong>{openTickets.length}</strong> total</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
                  {openTickets.map((t) => (
                    <div key={t.id} style={{ borderBottom: '1px solid #f8fafc', padding: '8px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', cursor: 'pointer' }} onClick={() => setSelectedId(t.gaugeId)}>{t.gaugeId}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: PRIORITY_BG[t.priority], color: PRIORITY_COLOR[t.priority] }}>{t.priority}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>{t.type} · {t.daysOpen}d open</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 4 }}>{t.assignedTo}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: t.status === 'In Progress' ? '#d97706' : '#dc2626' }}>{t.status}</span>
                        <button onClick={() => adminAction(`Ticket ${t.id} marked Resolved`)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #16a34a', background: '#fff', color: '#16a34a', cursor: 'pointer' }}>Resolve</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Maintenance Modal ── */}
      {showMaintModal && (
        <Modal title={`Add Maintenance Record — ${gauge?.id}`} onClose={() => setShowMaintModal(false)}>
          <ModalField label="Date" type="date" value={maintForm.date} onChange={(v) => setMaintForm((f) => ({ ...f, date: v }))} />
          <ModalField label="Type" type="select" options={['Routine Inspection','Calibration','Repair','Replacement','Emergency']} value={maintForm.type} onChange={(v) => setMaintForm((f) => ({ ...f, type: v }))} />
          <ModalField label="Technician" type="select" options={TECHNICIANS} value={maintForm.technician} onChange={(v) => setMaintForm((f) => ({ ...f, technician: v }))} />
          <ModalField label="Work done / Notes" type="textarea" value={maintForm.notes} onChange={(v) => setMaintForm((f) => ({ ...f, notes: v }))} />
          <ModalField label="Next scheduled visit" type="date" value={maintForm.nextVisit} onChange={(v) => setMaintForm((f) => ({ ...f, nextVisit: v }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { adminAction(`Maintenance record saved for ${gauge?.id}`); setShowMaintModal(false) }} style={{ flex: 1, padding: '9px', borderRadius: 7, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Record</button>
            <button onClick={() => setShowMaintModal(false)} style={{ padding: '9px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Raise Fault Modal ── */}
      {showFaultModal && (
        <Modal title={`Raise Fault Report — ${gauge?.id}`} onClose={() => setShowFaultModal(false)}>
          <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 7, marginBottom: 12, fontSize: 11.5 }}>
            <InfoRow k="Station" v={gauge?.name} />
            <InfoRow k="Basin" v={gauge?.basin} />
            <InfoRow k="Current status" v={gauge?.status} />
          </div>
          <ModalField label="Fault type" type="select" options={FAULT_TYPES} value={faultForm.type || 'Offline'} onChange={(v) => setFaultForm((f) => ({ ...f, type: v }))} />
          <ModalField label="Priority" type="select" options={['Low','Medium','High','Critical']} value={faultForm.priority} onChange={(v) => setFaultForm((f) => ({ ...f, priority: v }))} />
          <ModalField label="Description" type="textarea" value={faultForm.description} onChange={(v) => setFaultForm((f) => ({ ...f, description: v }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { adminAction(`Fault ticket raised for ${gauge?.id} [${faultForm.priority}]`); setShowFaultModal(false) }} style={{ flex: 1, padding: '9px', borderRadius: 7, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Submit Fault Report</button>
            <button onClick={() => setShowFaultModal(false)} style={{ padding: '9px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Small presentational helpers ──────────────────────────────────

function StatCard({ icon, label, main, sub, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '14px 18px', border: `1px solid ${color}22` }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1.1 }}>{main}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

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

function InfoRow({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 11.5, color: '#1e293b', fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  )
}

function QualPill({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 7, padding: '6px 4px' }}>
      <div style={{ fontSize: 9.5, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function UptimeStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 6, padding: '5px 3px' }}>
      <div style={{ fontSize: 9, color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

/*
 * API wiring notes:
 *  - GET /api/v1/gauges                      → GAUGE_FLEET (with status, battery, quality, cal fields)
 *  - GET /api/v1/gauges/:id/transmission     → generateTransmissionHeatmap(:id) (?days=30)
 *  - GET /api/v1/gauges/:id/quality-stats    → generateQualityChart(:id) (?days=30)
 *  - GET /api/v1/gauges/:id/quality-flags    → generateQualityFlags(:id) (?limit=10)
 *  - GET /api/v1/gauges/:id/maintenance      → generateMaintenanceLog(:id)
 *  - POST /api/v1/gauges/:id/maintenance     → Add Maintenance Record form submit
 *  - POST /api/v1/fault-tickets              → Raise Fault Report form submit
 *  - GET /api/v1/fault-tickets               → ALL_FAULT_TICKETS (open tickets panel)
 *  - POST /ml/gauge-health/:id              → predictedFailureDays, anomalyScore
 *  - PATCH /api/v1/gauges/:id               → admin actions (maintenance mode, decommission, force-poll)
 *  - POST /api/v1/gauges/:id/override-reading → Override a bad reading
 */