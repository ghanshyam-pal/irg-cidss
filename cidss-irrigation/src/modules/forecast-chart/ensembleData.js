// ensembleData.js  — dummy data layer for M4 Forecast vs Observed
//
// Simulates what POST /ml/ensemble-summary returns.
// 20 ensemble members are generated via ±10% rainfall perturbation
// of the base forecast — same conceptual approach as the real Python
// service will use.  All generators are seeded so numbers are stable
// across re-renders.

import { GAUGE_DATA, ALERT_STATUS } from '../basin-dashboard/data'

export const NOW = new Date('2026-06-17T14:45:00')

// ── Seeded RNG (same helper as riverGaugeData.js) ──────────────────
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

// ── Thresholds (same as riverGaugeData.js — keep in sync or extract to shared) ──
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

export const GAUGE_LIST = GAUGE_DATA.map((g) => ({ id: g.id, name: g.name, basin: g.basin, baseLevel: g.level, trend: g.trend }))

// ── Core ensemble generator ────────────────────────────────────────
// Returns an array of hourly time-points covering 48h observed + 48h forecast.
// Each point has the full dummy data structure described in the brief.
//
//   h < 0   → observed period
//   h === 0 → now (bridge)
//   h > 0   → forecast horizon
//
export function generateEnsemble(gaugeId) {
  const gauge = GAUGE_LIST.find((g) => g.id === gaugeId)
  if (!gauge) return { points: [], members: [], summary: {} }

  const t = THRESHOLDS[gaugeId]
  const rng = rngFor(gaugeId + '-ens')
  const base = gauge.baseLevel
  const trendDir = gauge.trend === '↑' ? 1 : gauge.trend === '↓' ? -1 : 0

  // ── Build 20 ensemble members (±10% rainfall perturbation) ──────
  // Each member has its own offset applied to the base forecast curve.
  const N_MEMBERS = 20
  const memberOffsets = Array.from({ length: N_MEMBERS }, () => (rng() - 0.5) * 0.8)

  // ── Observed series (48h) ────────────────────────────────────────
  const observedPoints = []
  let level = base - trendDir * 0.65 - (rng() - 0.3) * 0.3
  for (let h = -48; h <= 0; h++) {
    const drift = trendDir * 0.014
    const noise = (rng() - 0.5) * 0.04
    const wave = Math.sin((h + 48) / 8) * 0.07
    level = Math.max(0.1, level + drift + noise + wave * 0.1)
    observedPoints.push({ h, observed: +level.toFixed(2) })
  }
  // Pin h=0 to the published level
  observedPoints[observedPoints.length - 1].observed = base

  // ── Forecast horizon (48h) — 1 median curve + percentile bands ──
  const forecastRaw = [] // Array<{ h, memberValues: number[] }>
  let fBase = base
  for (let h = 1; h <= 48; h++) {
    const drift = trendDir * 0.016
    const noise = (rng() - 0.5) * 0.04
    fBase = Math.max(0.1, fBase + drift + noise)
    const memberValues = memberOffsets.map((off) => {
      // Each member diverges more as horizon grows
      const divergence = off * (h / 48) * 0.55
      return Math.max(0.1, +(fBase + divergence).toFixed(2))
    })
    memberValues.sort((a, b) => a - b)
    forecastRaw.push({ h, memberValues, baseMedian: fBase })
  }

  // ── Derive percentiles ────────────────────────────────────────────
  function percentile(sorted, p) {
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.round((p / 100) * (sorted.length - 1))))
    return sorted[idx]
  }

  function exceedanceProb(sorted, threshold) {
    const count = sorted.filter((v) => v >= threshold).length
    return +(count / sorted.length).toFixed(2)
  }

  const forecastPoints = forecastRaw.map(({ h, memberValues, baseMedian }) => {
    const p10 = percentile(memberValues, 10)
    const p25 = percentile(memberValues, 25)
    const p50 = percentile(memberValues, 50)
    const p75 = percentile(memberValues, 75)
    const p90 = percentile(memberValues, 90)
    const spread = +(p90 - p10).toFixed(2)
    return {
      h,
      forecast_p10: p10,
      forecast_p25: p25,
      forecast_median: p50,
      forecast_p75: p75,
      forecast_p90: p90,
      ensemble_spread: spread,
      exceedance_alert: exceedanceProb(memberValues, t.alert),
      exceedance_minor: exceedanceProb(memberValues, t.minor),
      exceedance_major: exceedanceProb(memberValues, t.major),
      exceedance_critical: exceedanceProb(memberValues, t.critical),
      // For chart shading: band between P10 and P90 as [low, high]
      band_inner: [p25, p75],   // inner (P25-P75) — darker shade
      band_outer: [p10, p90],   // outer (P10-P90) — lighter shade
    }
  })

  // ── Merge into one timeline ──────────────────────────────────────
  const observedMap = Object.fromEntries(observedPoints.map((p) => [p.h, p]))
  const forecastMap = Object.fromEntries(forecastPoints.map((p) => [p.h, p]))

  const points = []
  for (let h = -48; h <= 48; h++) {
    points.push({
      h,
      label: h === 0 ? 'Now' : h < 0 ? `${h}h` : `+${h}h`,
      observed: observedMap[h]?.observed ?? null,
      ...(forecastMap[h] ?? {}),
    })
  }

  // ── Horizon summary (6h / 12h / 24h / 48h) ──────────────────────
  const HORIZONS = [6, 12, 24, 48]
  const horizonSummary = HORIZONS.map((hz) => {
    const fp = forecastMap[hz]
    if (!fp) return null
    const spread = fp.ensemble_spread
    const confidence = spread < 0.3 ? 'High' : spread < 0.7 ? 'Moderate' : 'Low'
    return {
      horizon: hz,
      confidence,
      spread,
      p10: fp.forecast_p10,
      p50: fp.forecast_median,
      p90: fp.forecast_p90,
      exceedance_alert: fp.exceedance_alert,
      exceedance_minor: fp.exceedance_minor,
      exceedance_major: fp.exceedance_major,
      exceedance_critical: fp.exceedance_critical,
    }
  }).filter(Boolean)

  // ── Max-P90 peak and time ────────────────────────────────────────
  let peak = forecastPoints[0]
  forecastPoints.forEach((fp) => { if (fp.forecast_p90 > peak.forecast_p90) peak = fp })

  // ── Individual member lines (for optional "spaghetti" view) ─────
  const memberLines = Array.from({ length: N_MEMBERS }, (_, mi) => {
    const offset = memberOffsets[mi]
    return forecastPoints.map((fp) => ({
      h: fp.h,
      level: +(fp.forecast_median + offset * (fp.h / 48) * 0.55).toFixed(2),
    }))
  })

  return { points, horizonSummary, peak, memberLines, thresholds: t, gauge, N_MEMBERS }
}

// ── Mini ensemble summary for M5 gauge cards ─────────────────────
// Returns { p10, p50, p90, spread, confidence } for the next 24h peak.
export function gaugeMiniEnsemble(gaugeId) {
  const { horizonSummary } = generateEnsemble(gaugeId)
  return horizonSummary.find((h) => h.horizon === 24) || horizonSummary[0]
}

// ── Accuracy table — last 7 forecast runs ──────────────────────────
export function generateAccuracyTable(gaugeId) {
  const rng = rngFor(gaugeId + '-acc')
  return Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 7 - i
    const date = new Date(NOW.getTime() - daysAgo * 86400000).toISOString().slice(0, 10)
    const spread = +(0.2 + rng() * 0.8).toFixed(2)
    const mae = +(0.05 + rng() * 0.25).toFixed(2)
    const rmse = +(mae * 1.2 + rng() * 0.1).toFixed(2)
    const bias = +((rng() - 0.5) * 0.2).toFixed(2)
    const confidence = spread < 0.3 ? 'High' : spread < 0.65 ? 'Moderate' : 'Low'
    const withinP90 = +(80 + rng() * 18).toFixed(0)
    return { date, mae, rmse, bias, spread, confidence, withinP90: +withinP90 }
  })
}

export { ALERT_STATUS }