// gaugeManagementData.js — dummy data layer for M11 Gauge Management
// All generators are seeded so numbers are stable across re-renders.
// Swap each section for the real API endpoints listed in comments.

export const NOW = new Date('2026-06-17T14:45:00')

// ── Seeded RNG ────────────────────────────────────────────────────
function seedFromString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rngFor = (id) => mulberry32(seedFromString(id))

// ── Reference data ────────────────────────────────────────────────
const BASINS = ['Kalu', 'Kelani', 'Mahaweli', 'Nilwala', 'Walawe', 'Deduru', 'Attanagalu', 'Gin']
const RIVERS = {
  Kalu: 'Kalu Ganga', Kelani: 'Kelani River', Mahaweli: 'Mahaweli Ganga',
  Nilwala: 'Nilwala Ganga', Walawe: 'Walawe Ganga', Deduru: 'Deduru Oya',
  Attanagalu: 'Attanagalu Oya', Gin: 'Gin Ganga',
}
const SENSOR_MAKES = ['Seba Hydrometrie', 'OTT Hydromet', 'ISCO', 'Vaisala', 'Campbell Scientific']
const SENSOR_MODELS = ['MiniSens', 'RLS Radar', 'SR50A', 'WL16', 'CS451']
const TECHNICIANS = ['P.K. Dissanayake', 'M.L. Jayasinghe', 'R.S. Perera', 'A.N. Gunaratne', 'K.B. Rajapaksa']
const OFFICERS = ['D.M. Senanayake', 'R.P. Wickramasinghe', 'S. Karunaratne', 'A.G. Fernando', 'N. Jayasuriya', 'K.L. Rathnayake', 'P.B. Gunawardena']
const DIVISIONS = ['Irrigation Engineer — Kalu Basin', 'Irrigation Engineer — Kelani Basin', 'Irrigation Engineer — Mahaweli Basin', 'Irrigation Engineer — Southern Basin', 'Irrigation Engineer — Western Basin', 'Irrigation Engineer — North Western Basin', 'Irrigation Engineer — Walawe Basin']
const FAULT_TYPES = ['Offline', 'Battery', 'Data Quality', 'Calibration', 'Physical Damage']

// Basin bounding boxes for pseudo-random coordinate generation
const BASIN_BOUNDS = {
  Kalu:        { lat: [6.40, 7.05], lng: [79.92, 80.58] },
  Kelani:      { lat: [6.60, 7.10], lng: [79.93, 80.50] },
  Mahaweli:    { lat: [7.00, 8.35], lng: [80.30, 81.30] },
  Nilwala:     { lat: [5.85, 6.40], lng: [80.30, 80.70] },
  Walawe:      { lat: [6.20, 6.80], lng: [80.60, 81.00] },
  Deduru:      { lat: [7.30, 7.90], lng: [80.00, 80.55] },
  Attanagalu:  { lat: [6.90, 7.20], lng: [79.88, 80.20] },
  Gin:         { lat: [6.00, 6.30], lng: [80.05, 80.40] },
}

// ── Generate the full fleet of 52 gauges ──────────────────────────
export const GAUGE_FLEET = Array.from({ length: 52 }, (_, i) => {
  const id = `G${String(i + 1).padStart(3, '0')}`
  const rng = rngFor(id)
  const basin = BASINS[i % BASINS.length]
  const bounds = BASIN_BOUNDS[basin]

  const daysOffline = rng()
  const status =
    i === 3 || i === 11 || i === 24 || i === 37 || i === 48 ? 'OFFLINE'
    : i === 7 || i === 19 ? 'MAINTENANCE'
    : i === 41 ? 'DECOMMISSIONED'
    : daysOffline > 0.88 ? 'DELAYED'
    : 'ONLINE'

  const batteryPct = Math.round(10 + rng() * 90)
  const batteryTrend = rng() > 0.65 ? 'DRAINING' : rng() > 0.35 ? 'STABLE' : 'CHARGING'
  const completeness24h = status === 'OFFLINE' ? Math.round(rng() * 30) : Math.round(70 + rng() * 30)
  const completeness7d  = status === 'OFFLINE' ? Math.round(rng() * 50) : Math.round(75 + rng() * 24)

  const lastCalDaysAgo = Math.round(30 + rng() * 300)
  const lastCalDate = new Date(NOW.getTime() - lastCalDaysAgo * 86400000)
  const nextCalDate = new Date(lastCalDate.getTime() + 180 * 86400000)
  const calOverdue = nextCalDate < NOW

  const recentlyCal = lastCalDaysAgo <= 7

  // Map marker color
  const markerStatus = recentlyCal ? 'RECENT_CAL'
    : status === 'OFFLINE' ? 'OFFLINE'
    : status === 'DELAYED' ? 'DELAYED'
    : status === 'MAINTENANCE' || status === 'DECOMMISSIONED' ? 'MAINTENANCE'
    : 'ONLINE'

  const installDaysAgo = Math.round(365 + rng() * 365 * 8)
  const installDate = new Date(NOW.getTime() - installDaysAgo * 86400000).toISOString().slice(0, 10)

  const sensorIdx = Math.floor(rng() * SENSOR_MAKES.length)
  const officerIdx = Math.floor(rng() * OFFICERS.length)
  const techIdx = Math.floor(rng() * TECHNICIANS.length)

  const lastReadingMinsAgo = status === 'OFFLINE' ? Math.round(120 + rng() * 720)
    : status === 'DELAYED' ? Math.round(31 + rng() * 89)
    : Math.round(rng() * 28)
  const lastReading = new Date(NOW.getTime() - lastReadingMinsAgo * 60000)

  const predictedFailureDays = batteryTrend === 'DRAINING' && batteryPct < 40
    ? Math.round(batteryPct / 3 + rng() * 5)
    : null

  return {
    id,
    name: `${RIVERS[basin]} — ${['Upstream', 'Midstream', 'Downstream', 'Tributary', 'Junction', 'Confluence', 'Headwater'][Math.floor(rng() * 7)]} ${i + 1}`,
    officialName: `${RIVERS[basin]} Gauging Station No. ${id}`,
    river: RIVERS[basin],
    basin,
    lat: +(bounds.lat[0] + rng() * (bounds.lat[1] - bounds.lat[0])).toFixed(4),
    lng: +(bounds.lng[0] + rng() * (bounds.lng[1] - bounds.lng[0])).toFixed(4),
    elevation: Math.round(5 + rng() * 200),
    installDate,
    division: DIVISIONS[officerIdx % DIVISIONS.length],
    officer: OFFICERS[officerIdx],
    phone: `+94 71 ${Math.floor(200 + rng() * 799)} ${Math.floor(1000 + rng() * 8999)}`,
    sensorMake: SENSOR_MAKES[sensorIdx],
    sensorModel: SENSOR_MODELS[sensorIdx],
    // Live status
    status,
    markerStatus,
    lastReading,
    lastReadingMinsAgo,
    expectedInterval: [15, 30, 60][Math.floor(rng() * 3)],
    consecutiveMissed: status === 'OFFLINE' ? Math.round(1 + rng() * 12) : status === 'DELAYED' ? 1 : 0,
    signalStrength: status === 'OFFLINE' ? null : Math.round(-110 + rng() * 60), // dBm
    batteryVoltage: +(10 + rng() * 4).toFixed(1),
    batteryPct,
    batteryTrend,
    solarStatus: rng() > 0.3 ? (rng() > 0.2 ? 'OK' : 'LOW') : null,
    // Data quality
    completeness24h,
    completeness7d,
    outlierCount: Math.floor(rng() * 8),
    frozenCount: Math.floor(rng() * 4),
    spikeCount: Math.floor(rng() * 5),
    missingGaps: generateMissingGaps(id, status),
    // Calibration
    lastCalibration: lastCalDate.toISOString().slice(0, 10),
    nextCalibration: nextCalDate.toISOString().slice(0, 10),
    calOverdue,
    calRef: `CAL-${2024 + Math.floor(rng() * 2)}-${String(Math.floor(rng() * 999) + 1).padStart(3, '0')}`,
    driftMm: +(rng() * 8 - 1).toFixed(1),
    calibratedBy: TECHNICIANS[techIdx],
    calibrationHistory: generateCalHistory(id, TECHNICIANS[techIdx]),
    // ML predictions
    predictedFailureDays,
    anomalyScore: +(rng() * 0.95).toFixed(2),
    // Open fault tickets
    faultTickets: generateFaultTickets(id, status, batteryPct, calOverdue, rng),
  }
})

function generateMissingGaps(id, status) {
  const rng = rngFor(id + '-gaps')
  if (status === 'ONLINE') return []
  const count = status === 'OFFLINE' ? Math.floor(1 + rng() * 3) : Math.floor(rng() * 2)
  return Array.from({ length: count }, (_, i) => {
    const startHoursAgo = Math.round(2 + rng() * 168)
    const durationH = +(0.5 + rng() * 6).toFixed(1)
    return { startHoursAgo, durationH }
  })
}

function generateCalHistory(id, primaryTech) {
  const rng = rngFor(id + '-calh')
  return Array.from({ length: 5 }, (_, i) => {
    const daysAgo = Math.round((i + 1) * 180 + rng() * 30)
    const date = new Date(NOW.getTime() - daysAgo * 86400000)
    return {
      date: date.toISOString().slice(0, 10),
      tech: rng() > 0.5 ? primaryTech : TECHNICIANS[Math.floor(rng() * TECHNICIANS.length)],
      drift: +(rng() * 6 - 0.5).toFixed(1),
      ref: `CAL-${date.getFullYear()}-${String(Math.floor(rng() * 999) + 1).padStart(3, '0')}`,
    }
  })
}

function generateFaultTickets(id, status, batteryPct, calOverdue, rng) {
  const tickets = []
  if (status === 'OFFLINE') tickets.push({ type: 'Offline',        priority: 'Critical', daysOpen: Math.round(1 + rng() * 10), status: 'Open',        assignedTo: OFFICERS[0] })
  if (batteryPct < 20)      tickets.push({ type: 'Battery',        priority: 'High',     daysOpen: Math.round(1 + rng() * 5),  status: 'In Progress', assignedTo: OFFICERS[1] })
  if (calOverdue)            tickets.push({ type: 'Calibration',    priority: 'Medium',   daysOpen: Math.round(5 + rng() * 30), status: 'Open',        assignedTo: OFFICERS[2] })
  if (rng() > 0.82)          tickets.push({ type: 'Data Quality',   priority: 'Low',      daysOpen: Math.round(1 + rng() * 14), status: 'Open',        assignedTo: OFFICERS[3] })
  if (rng() > 0.93)          tickets.push({ type: 'Physical Damage',priority: 'High',     daysOpen: Math.round(1 + rng() * 7),  status: 'In Progress', assignedTo: OFFICERS[4] })
  return tickets.map((t, i) => ({ ...t, id: `TKT-${id}-${i + 1}`, gaugeId: id }))
}

// ── Transmission heatmap — 30d × 24h grid ─────────────────────────
// Returns a flat array of 720 cells: { day, hour, state }
// state: 'OK' | 'LATE' | 'MISSING'
// API: GET /api/v1/gauges/:id/transmission-history?days=30
export function generateTransmissionHeatmap(gaugeId) {
  const rng = rngFor(gaugeId + '-hm')
  const gauge = GAUGE_FLEET.find((g) => g.id === gaugeId)
  const cells = []
  for (let day = 29; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour++) {
      const r = rng()
      let state
      if (gauge?.status === 'OFFLINE' && day < 3) {
        state = r > 0.1 ? 'MISSING' : 'LATE'
      } else if (gauge?.status === 'DELAYED' && hour % 6 === 0) {
        state = r > 0.5 ? 'LATE' : 'OK'
      } else {
        state = r > 0.96 ? 'MISSING' : r > 0.91 ? 'LATE' : 'OK'
      }
      cells.push({ day, hour, state })
    }
  }
  return cells
}

// ── 30-day data quality chart data ───────────────────────────────
// API: GET /api/v1/gauges/:id/quality-stats?days=30
export function generateQualityChart(gaugeId) {
  const rng = rngFor(gaugeId + '-qc')
  const gauge = GAUGE_FLEET.find((g) => g.id === gaugeId)
  return Array.from({ length: 30 }, (_, i) => {
    const daysAgo = 29 - i
    const date = new Date(NOW.getTime() - daysAgo * 86400000).toISOString().slice(0, 10)
    const expected = 48 // 30-min interval
    const isOfflinePeriod = gauge?.status === 'OFFLINE' && daysAgo < 3
    const received = isOfflinePeriod ? Math.round(rng() * 10) : Math.round(expected * (0.7 + rng() * 0.3))
    const flagged = Math.round(received * rng() * 0.08)
    return { date, label: `D-${daysAgo}`, expected, received, good: received - flagged, flagged }
  })
}

// ── Last 10 data quality flags ────────────────────────────────────
// API: GET /api/v1/gauges/:id/quality-flags?limit=10
const FLAG_REASONS = ['Spike — value jump > 0.5m/step', 'Frozen value — 6 identical readings', 'Physically implausible — below gauge datum', 'Out of range — exceeds sensor max', 'Transmission gap — interpolated', 'Clock drift — timestamp anomaly']
export function generateQualityFlags(gaugeId) {
  const rng = rngFor(gaugeId + '-flags')
  return Array.from({ length: 10 }, (_, i) => {
    const minsAgo = Math.round(60 + rng() * 700)
    return {
      id: `F${i + 1}`,
      timestamp: new Date(NOW.getTime() - minsAgo * 60000).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      value: +(1 + rng() * 6).toFixed(2),
      reason: FLAG_REASONS[Math.floor(rng() * FLAG_REASONS.length)],
      reviewed: rng() > 0.5,
      accepted: rng() > 0.5,
    }
  })
}

// ── Maintenance log ───────────────────────────────────────────────
// API: GET /api/v1/gauges/:id/maintenance
const MAINT_TYPES = ['Routine Inspection', 'Calibration', 'Repair', 'Replacement', 'Emergency']
const MAINT_PARTS = ['None', 'Solar panel', 'Battery pack', 'Pressure transducer', 'Data logger', 'Antenna', 'Staff gauge plate', 'Communication module']
export function generateMaintenanceLog(gaugeId) {
  const rng = rngFor(gaugeId + '-maint')
  return Array.from({ length: 6 }, (_, i) => {
    const daysAgo = Math.round((i + 1) * 45 + rng() * 30)
    const date = new Date(NOW.getTime() - daysAgo * 86400000)
    const type = MAINT_TYPES[Math.floor(rng() * MAINT_TYPES.length)]
    const nextDaysAhead = Math.round(30 + rng() * 150)
    return {
      id: `M${gaugeId}-${i + 1}`,
      date: date.toISOString().slice(0, 10),
      type,
      technician: TECHNICIANS[Math.floor(rng() * TECHNICIANS.length)],
      description: `${type} performed. Sensor checked, data logger verified, housing inspected for damage.`,
      partsReplaced: MAINT_PARTS[Math.floor(rng() * MAINT_PARTS.length)],
      nextVisit: new Date(NOW.getTime() + nextDaysAhead * 86400000).toISOString().slice(0, 10),
      photos: Math.floor(rng() * 5),
    }
  }).sort((a, b) => (a.date < b.date ? 1 : -1))
}

// ── Fleet-wide fault tickets ──────────────────────────────────────
export const ALL_FAULT_TICKETS = GAUGE_FLEET.flatMap((g) =>
  g.faultTickets.map((t) => ({ ...t, gaugeName: g.name, basin: g.basin }))
)

// ── Fleet summary stats ───────────────────────────────────────────
export function computeFleetStats() {
  const total = GAUGE_FLEET.length
  const active = GAUGE_FLEET.filter((g) => g.status === 'ONLINE' || g.status === 'DELAYED').length
  const offline = GAUGE_FLEET.filter((g) => g.status === 'OFFLINE').length
  const onSchedule = GAUGE_FLEET.filter((g) => g.status === 'ONLINE').length
  const transmissionHealth = Math.round((onSchedule / total) * 100)
  const lowBattery = GAUGE_FLEET.filter((g) => g.batteryPct < 20).length
  const calOverdue = GAUGE_FLEET.filter((g) => g.calOverdue).length
  return { total, active, offline, transmissionHealth, lowBattery, calOverdue }
}

export { TECHNICIANS, FAULT_TYPES }

