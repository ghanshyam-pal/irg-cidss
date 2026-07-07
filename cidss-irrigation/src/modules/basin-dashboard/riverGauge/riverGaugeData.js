// Dummy dataset for the River Gauge page.
// Deterministic ("seeded") random generation is used everywhere so the
// same station always renders the same numbers on re-render, without
// needing a backend yet. Swap each generator for a real fetch later —
// see the API notes at the bottom of RiverGaugePage.jsx.

import { GAUGE_DATA, ALERT_STATUS } from '../data'

// Anchor "now" to the same demo timestamp used elsewhere in the app.
export const NOW = new Date('2026-06-17T14:45:00')

// ── Seeded RNG helpers ──────────────────────────────────────────────
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
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rngFor = (id) => mulberry32(seedFromString(id))

// ── River names per gauge ────────────────────────────────────────
export const RIVER_NAMES = {
  G01: 'Kalu Ganga', G02: 'Kelani River', G03: 'Mahaweli Ganga', G04: 'Gin Ganga',
  G05: 'Nilwala Ganga', G06: 'Attanagalu Oya', G07: 'Deduru Oya', G08: 'Walawe Ganga',
}

// ── Hand-tuned 4-level thresholds per gauge (m) ──────────────────
export const THRESHOLDS = {
  G01: { alert: 4.0, minor: 4.3, major: 4.7, critical: 5.3 },
  G02: { alert: 2.8, minor: 3.4, major: 3.9, critical: 4.5 },
  G03: { alert: 3.0, minor: 3.6, major: 4.2, critical: 4.8 },
  G04: { alert: 2.4, minor: 3.0, major: 3.5, critical: 4.0 },
  G05: { alert: 3.0, minor: 3.5, major: 4.0, critical: 4.6 },
  G06: { alert: 2.5, minor: 2.9, major: 3.3, critical: 3.8 },
  G07: { alert: 1.8, minor: 2.2, major: 2.6, critical: 3.1 },
  G08: { alert: 3.8, minor: 4.2, major: 4.8, critical: 5.5 },
}

const DISCHARGE_K = { G01: 18, G02: 22, G03: 35, G04: 14, G05: 16, G06: 9, G07: 7, G08: 20 }

const OFFICERS = {
  Kalu: { div: 'Irrigation Engineer — Kalu Basin', name: 'D.M. Senanayake', phone: '+94 71 234 5601' },
  Kelani: { div: 'Irrigation Engineer — Kelani Basin', name: 'R.P. Wickramasinghe', phone: '+94 71 234 5602' },
  Mahaweli: { div: 'Irrigation Engineer — Mahaweli Basin', name: 'S. Karunaratne', phone: '+94 71 234 5603' },
  Gin: { div: 'Irrigation Engineer — Gin/Nilwala Basin', name: 'A.G. Fernando', phone: '+94 71 234 5604' },
  Nilwala: { div: 'Irrigation Engineer — Gin/Nilwala Basin', name: 'A.G. Fernando', phone: '+94 71 234 5604' },
  Attanagalu: { div: 'Irrigation Engineer — Western Basin', name: 'N. Jayasuriya', phone: '+94 71 234 5605' },
  Deduru: { div: 'Irrigation Engineer — North Western Basin', name: 'K.L. Rathnayake', phone: '+94 71 234 5606' },
  Walawe: { div: 'Irrigation Engineer — Walawe Basin', name: 'P.B. Gunawardena', phone: '+94 71 234 5607' },
}

const ELEVATION = { G01: 12, G02: 18, G03: 92, G04: 8, G05: 14, G06: 22, G07: 145, G08: 35 }
const CATCHMENT = { G01: 2680, G02: 2292, G03: 10448, G04: 932, G05: 972, G06: 471, G07: 2620, G08: 2452 }
const GAUGE_ZERO = { G01: 0.0, G02: 0.4, G03: 12.2, G04: -0.2, G05: 0.1, G06: 1.1, G07: 88.5, G08: 3.0 }
const SENSOR_TYPE = { G01: 'Pressure Transducer (Telemetry)', G02: 'Radar Level Sensor (Telemetry)', G03: 'Pressure Transducer (Telemetry)', G04: 'Staff Gauge (Manual)', G05: 'Radar Level Sensor (Telemetry)', G06: 'Staff Gauge (Manual)', G07: 'Pressure Transducer (Telemetry)', G08: 'Radar Level Sensor (Telemetry)' }
const DATA_SOURCE = { G01: 'Telemetry · SCADA', G02: 'Telemetry · SCADA', G03: 'Telemetry · SCADA', G04: 'Manual · Field Reading', G05: 'Telemetry · SCADA', G06: 'Manual · Field Reading', G07: 'Telemetry · SCADA', G08: 'Telemetry · SCADA' }
const CALIBRATION = { G01: '2026-02-14', G02: '2026-03-02', G03: '2026-01-20', G04: '2025-11-08', G05: '2026-02-28', G06: '2025-12-15', G07: '2026-01-05', G08: '2026-03-18' }

const GAUGE_COORDS = {
  G01: [6.5333, 80.1333], G02: [6.9000, 80.0800], G03: [7.9200, 81.1300], G04: [6.1700, 80.2000],
  G05: [6.1300, 80.4500], G06: [7.0500, 80.0500], G07: [7.8700, 80.6500], G08: [6.3400, 80.8500],
}

const OFFICIAL_NAME = {
  G01: 'Kalu Ganga Gauging Station — Millakanda',
  G02: 'Kelani River Gauging Station — Hanwella',
  G03: 'Mahaweli Ganga Gauging Station — Manampitiya',
  G04: 'Gin Ganga Gauging Station — Baddegama',
  G05: 'Nilwala Ganga Gauging Station — Pitabeddara',
  G06: 'Attanagalu Oya Gauging Station — Horombawa',
  G07: 'Deduru Oya Gauging Station — Dambulla',
  G08: 'Walawe Ganga Gauging Station — Embilipitiya',
}

// ── Status classification from the 4 thresholds ─────────────────
// ── Status classification from the 4 thresholds (Safe Fallback) ──
export function classify(level, t) {
  // If thresholds are missing for this item, default to NORMAL
  if (!t) return 'NORMAL';
  
  if (level >= t.critical) return 'CRITICAL'
  if (level >= t.major) return 'MAJOR_FLOOD'
  if (level >= t.minor) return 'MINOR_FLOOD'
  if (level >= t.alert) return 'ALERT'
  return 'NORMAL'
}

// ── Station metadata (merges data.js + the tables above) ────────
// ── Station metadata (Safe-merged data.js + the tables above) ────────
export const STATION_META = Object.fromEntries(
  GAUGE_DATA.map((g) => {
    // 1. Safe lookup for coordinates with a default fallback [0, 0]
    const coords = GAUGE_COORDS[g.id] || [g.lat || 0, g.lng || 0];
    
    // 2. Safe lookup for officer based on basin name
    const officer = OFFICERS[g.basin] || { div: 'Unknown Division', name: 'N/A', phone: 'N/A' };

    return [g.id, {
      id: g.id,
      name: g.name,
      officialName: OFFICIAL_NAME[g.id] || g.name,
      basin: g.basin,
      river: RIVER_NAMES[g.id] || 'Unknown River',
      lat: coords[0],
      lng: coords[1],
      elevation: ELEVATION[g.id] || 0,
      catchmentArea: CATCHMENT[g.id] || 0,
      gaugeZero: GAUGE_ZERO[g.id] || 0,
      sensorType: SENSOR_TYPE[g.id] || 'Unknown Sensor',
      lastCalibration: CALIBRATION[g.id] || 'N/A',
      dataSource: DATA_SOURCE[g.id] || 'N/A',
      officer: officer,
      baseLevel: g.level,
      trendHint: g.trend,
    }];
  })
);

export const STATION_IDS = GAUGE_DATA.map((g) => g.id)

// ── 72h observed + 24h forecast series, seeded per station ──────
// Returns hourly points. `t` is hours relative to NOW (negative = past).
export function generateSeries(id) {
  const meta = STATION_META[id]
  const rng = rngFor(id + '-series')
  const base = meta.baseLevel
  const trendDir = meta.trendHint === '↑' ? 1 : meta.trendHint === '↓' ? -1 : 0
  const k = DISCHARGE_K[id] || 12

  const points = []
  let level = base - trendDir * 0.9 - (rng() - 0.3) * 0.4 // 72h ago, lower if currently rising
  for (let h = -72; h <= 0; h++) {
    const drift = trendDir * 0.0125 // gentle drift per hour toward current trend
    const noise = (rng() - 0.5) * 0.05
    const wave = Math.sin((h + 72) / 9) * 0.08
    level = Math.max(0.1, level + drift + noise + wave * 0.1)
    points.push({ h, level: +level.toFixed(2) })
  }
  // pin the last point close to the published current level
  points[points.length - 1].level = base

  // peak within the last 36h
  let peak = points[0]
  points.slice(-36).forEach((p) => { if (p.level > peak.level) peak = p })

  // 24h forecast continuation
  const forecast = []
  let fLevel = base
  for (let h = 1; h <= 24; h++) {
    const drift = trendDir * 0.018
    const noise = (rng() - 0.5) * 0.06
    fLevel = Math.max(0.1, fLevel + drift + noise)
    forecast.push({ h, level: +fLevel.toFixed(2) })
  }

  const withDischarge = (lvl) => +(k * Math.pow(lvl, 1.8)).toFixed(1)
  const series = points.map((p) => ({
    h: p.h, observed: p.level, discharge: withDischarge(p.level),
  }))
  const forecastSeries = forecast.map((p) => ({
    h: p.h, forecast: p.level, dischargeForecast: withDischarge(p.level),
  }))

  const rateOfRise = +(points[points.length - 1].level - points[points.length - 2].level).toFixed(2)

  return { series, forecastSeries, peak, rateOfRise, current: base }
}

// ── Readings at fixed lookback windows ───────────────────────────
export function readingsAt(seriesData, hoursBack) {
  const idx = seriesData.series.length - 1 - hoursBack
  return seriesData.series[Math.max(0, idx)]?.observed
}

// ── Historical comparison (seasonal avg, all-time record, percentile) ──
export function generateHistorical(id) {
  const meta = STATION_META[id]
  const rng = rngFor(id + '-hist')
  const base = meta.baseLevel
  const month = NOW.getMonth() + 1 // 6 = June
  const season = (month >= 4 && month <= 9) ? 'Yala' : 'Maha'

  const sameDateLastYear = +(base * (0.7 + rng() * 0.5)).toFixed(2)
  const seasonalAvg = +(base * (0.75 + rng() * 0.2)).toFixed(2)
  const allTimeRecord = +(base * (1.25 + rng() * 0.25)).toFixed(2)
  const recordYear = 2012 + Math.floor(rng() * 13)
  const recordDate = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Math.floor(rng()*12)]} ${recordYear}`
  const percentile = Math.min(99, Math.max(40, Math.round((base / allTimeRecord) * 100 + rng() * 6)))

  const last30ThisYear = Array.from({ length: 30 }, (_, i) => {
    const t = 30 - i
    const v = base * (0.55 + 0.45 * Math.sin(i / 6)) * (0.85 + rng() * 0.3)
    return { day: `D-${t}`, level: +v.toFixed(2) }
  })
  const last30LastYear = last30ThisYear.map((d) => ({
    day: d.day, level: +(d.level * (0.7 + rng() * 0.35)).toFixed(2),
  }))

  return { season, sameDateLastYear, seasonalAvg, allTimeRecord, recordDate, percentile, last30ThisYear, last30LastYear }
}

// ── Breach log (last 30 days) ────────────────────────────────────
const ALERT_LEVEL_NAMES = ['Alert', 'Minor Flood', 'Major Flood', 'Critical']

export function generateBreachLog(id) {
  const meta = STATION_META[id]
  const t = THRESHOLDS[id]
  const rng = rngFor(id + '-breach')
  const count = 2 + Math.floor(rng() * 4) // 2–5 records
  const officerName = meta.officer.name

  return Array.from({ length: count }, (_, i) => {
    const daysAgo = Math.floor(rng() * 29) + 1
    const date = new Date(NOW.getTime() - daysAgo * 86400000)
    const hh = String(Math.floor(rng() * 24)).padStart(2, '0')
    const mm = String(Math.floor(rng() * 60)).padStart(2, '0')
    const severityIdx = Math.floor(rng() * 4)
    const thresholdVal = [t.alert, t.minor, t.major, t.critical][severityIdx]
    const levelAtBreach = +(thresholdVal + rng() * 0.15).toFixed(2)
    const peak = +(levelAtBreach + rng() * 0.4).toFixed(2)
    const durationHrs = +(1 + rng() * 11).toFixed(1)
    return {
      id: `${id}-BR${i + 1}`,
      date: date.toISOString().slice(0, 10),
      timeBreached: `${hh}:${mm}`,
      levelAtBreach,
      peakLevel: peak,
      durationHrs,
      alertLevel: ALERT_LEVEL_NAMES[severityIdx],
      authorisedBy: officerName,
    }
  }).sort((a, b) => (a.date < b.date ? 1 : -1))
}

// ── Upstream / downstream neighbours (synthetic, same river) ────
export function generateNeighbors(id) {
  const meta = STATION_META[id]
  const t = THRESHOLDS[id]
  const base = meta.baseLevel
  const mk = (suffix, label, distanceKm, factor) => {
    const level = +(base * factor).toFixed(2)
    return {
      id: `${id}-${suffix}`,
      name: `${meta.river} — ${label}`,
      distanceKm,
      level,
      status: classify(level, t),
    }
  }
  return {
    upstream: [mk('U2', '18km upstream', 18, 0.66), mk('U1', '8km upstream', 8, 0.81)],
    downstream: [mk('D1', '11km downstream', 11, 0.91), mk('D2', '24km downstream', 24, 0.78)],
  }
}

export { ALERT_STATUS, GAUGE_DATA }