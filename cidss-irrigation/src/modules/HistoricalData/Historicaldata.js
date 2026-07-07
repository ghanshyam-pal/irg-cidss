// historicalData.js — dummy data for M12 Historical Analysis
export const NOW = new Date('2026-06-17T14:45:00')

// ── Seeded RNG ────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function seedStr(s) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return mulberry32(h >>> 0)
}

// ── Historical flood/drought events ──────────────────────────────
export const HISTORICAL_EVENTS = [
  {
    id: 'E01', year: 2017, name: '2017 Southwest Monsoon Floods', type: 'Southwest Monsoon',
    dateRange: '25 May – 12 Jun 2017', basins: ['Kalu', 'Kelani', 'Nilwala', 'Gin'],
    peakLevels: { 'Kalu Ganga – Millakanda': 6.82, 'Kelani – Hanwella': 4.51, 'Nilwala – Pitabeddara': 4.92 },
    maxRainfall: 284, description: 'Most devastating flood in Sri Lanka in 14 years. Triggered by an active low-pressure system over the Bay of Bengal coinciding with peak SW monsoon.',
    fatalities: 202, displaced: 614000, economicLoss: 1300, economicUnit: 'M USD', damageType: 'Landslides + Flooding',
    reservoirLevels: { Kotmale: 94, Victoria: 88, Randenigala: 91 },
    severity: 'EXTREME',
  },
  {
    id: 'E02', year: 2016, name: '2016 Kalu Ganga Flood', type: 'Southwest Monsoon',
    dateRange: '14 May – 20 May 2016', basins: ['Kalu', 'Kelani'],
    peakLevels: { 'Kalu Ganga – Millakanda': 5.94, 'Kelani – Hanwella': 3.82 },
    maxRainfall: 196, description: 'Flash flooding along the lower Kalu Ganga catchment following three days of continuous rainfall exceeding 150mm/24h.',
    fatalities: 38, displaced: 45000, economicLoss: 120, economicUnit: 'M USD', damageType: 'Flooding',
    reservoirLevels: { Kotmale: 78, Victoria: 71 },
    severity: 'MAJOR',
  },
  {
    id: 'E03', year: 2018, name: 'Cyclone Ockhi Remnants', type: 'Cyclone',
    dateRange: '30 Nov – 4 Dec 2017', basins: ['Nilwala', 'Gin', 'Walawe'],
    peakLevels: { 'Nilwala – Pitabeddara': 5.12, 'Gin Ganga – Baddegama': 4.20, 'Walawe – Embilipitiya': 5.55 },
    maxRainfall: 312, description: 'Cyclone Ockhi made landfall on the southern coast of Sri Lanka. The southern river basins received unprecedented rainfall as the system tracked north.',
    fatalities: 15, displaced: 28000, economicLoss: 85, economicUnit: 'M USD', damageType: 'Flooding + Storm Surge',
    reservoirLevels: { Udawalawe: 97, 'Kalu Ganga': 95 },
    severity: 'MAJOR',
    cyclone: { name: 'Ockhi', landfall: 'Southern Coast', windsKph: 165, track: [[7.9, 79.8], [7.4, 80.0], [6.8, 80.2], [6.3, 80.5], [5.9, 80.8]] },
  },
  {
    id: 'E04', year: 2021, name: 'Cyclone Tauktae Remnants', type: 'Cyclone',
    dateRange: '14 May – 18 May 2021', basins: ['Kalu', 'Kelani', 'Attanagalu'],
    peakLevels: { 'Kalu Ganga – Millakanda': 5.44, 'Kelani – Hanwella': 4.28 },
    maxRainfall: 218, description: 'Remnant moisture from Cyclone Tauktae enhanced monsoon rainfall over SW Sri Lanka causing significant flooding in western basins.',
    fatalities: 6, displaced: 19000, economicLoss: 48, economicUnit: 'M USD', damageType: 'Flooding',
    reservoirLevels: { Kotmale: 85, Victoria: 79 },
    severity: 'SIGNIFICANT',
    cyclone: { name: 'Tauktae', landfall: 'Western Coast', windsKph: 140, track: [[8.5, 79.9], [7.8, 80.1], [7.1, 80.3], [6.6, 80.4]] },
  },
  {
    id: 'E05', year: 2014, name: '2014 Northeast Monsoon Floods', type: 'Northeast Monsoon',
    dateRange: '28 Dec 2014 – 9 Jan 2015', basins: ['Mahaweli', 'Deduru', 'Kelani'],
    peakLevels: { 'Mahaweli – Manampitiya': 5.91, 'Deduru Oya – Dambulla': 3.42 },
    maxRainfall: 148, description: 'Extended NE monsoon activity caused sustained high levels in the Mahaweli system. Spillway operations at Victoria and Randenigala contributed to downstream flooding.',
    fatalities: 11, displaced: 32000, economicLoss: 62, economicUnit: 'M USD', damageType: 'Flooding + Dam Release',
    reservoirLevels: { Victoria: 98, Randenigala: 96, Kotmale: 89 },
    severity: 'SIGNIFICANT',
  },
  {
    id: 'E06', year: 2019, name: '2019 Drought — Dry Zone', type: 'Drought',
    dateRange: 'Feb 2019 – Jun 2019', basins: ['Mahaweli', 'Deduru', 'Walawe'],
    peakLevels: { 'Mahaweli – Manampitiya': 0.82, 'Deduru Oya – Dambulla': 0.31 },
    maxRainfall: 12, description: 'Severe multi-season drought across the dry zone. Victoria reservoir fell to 31% storage. Irrigation releases curtailed; rice cultivation in Yala season reduced by 40%.',
    fatalities: 0, displaced: 0, economicLoss: 210, economicUnit: 'M USD', damageType: 'Agricultural Loss',
    reservoirLevels: { Victoria: 31, Udawalawe: 28, Randenigala: 38 },
    severity: 'MAJOR',
  },
  {
    id: 'E07', year: 2010, name: 'Cyclone Mora', type: 'Cyclone',
    dateRange: '28 May – 31 May 2017', basins: ['Kalu', 'Kelani', 'Nilwala'],
    peakLevels: { 'Kalu Ganga – Millakanda': 6.22, 'Nilwala – Pitabeddara': 4.85 },
    maxRainfall: 256, description: "Cyclone Mora's outer bands brought extreme rainfall to SW Sri Lanka. The Kalu Ganga basin received over 250mm in 24 hours, causing rapid river rise.",
    fatalities: 8, displaced: 22000, economicLoss: 55, economicUnit: 'M USD', damageType: 'Flooding',
    reservoirLevels: { Kotmale: 91, Victoria: 82 },
    severity: 'MAJOR',
    cyclone: { name: 'Mora', landfall: 'Chittagong (Bangladesh)', windsKph: 130, track: [[6.5, 80.2], [7.2, 80.6], [8.1, 81.0], [9.5, 81.8]] },
  },
  {
    id: 'E08', year: 2011, name: '2011 Mahaweli Flooding', type: 'Northeast Monsoon',
    dateRange: '4 Jan – 22 Jan 2011', basins: ['Mahaweli', 'Deduru'],
    peakLevels: { 'Mahaweli – Manampitiya': 5.62, 'Deduru Oya – Dambulla': 3.08 },
    maxRainfall: 165, description: 'Prolonged NE monsoon combined with full reservoirs required sustained spillway releases from Victoria. The Mahaweli system remained in flood for 18 consecutive days.',
    fatalities: 54, displaced: 156000, economicLoss: 290, economicUnit: 'M USD', damageType: 'Flooding + Dam Release',
    reservoirLevels: { Victoria: 99, Randenigala: 98, Kotmale: 94 },
    severity: 'EXTREME',
  },
  {
    id: 'E09', year: 2023, name: '2023 Southwest Monsoon', type: 'Southwest Monsoon',
    dateRange: '6 Jun – 24 Jun 2023', basins: ['Kalu', 'Kelani', 'Gin'],
    peakLevels: { 'Kalu Ganga – Millakanda': 5.18, 'Kelani – Hanwella': 3.94 },
    maxRainfall: 176, description: 'Above-normal SW monsoon activity. Early onset contributed to elevated baseline storage levels. Two gauges exceeded minor flood level simultaneously.',
    fatalities: 4, displaced: 12500, economicLoss: 38, economicUnit: 'M USD', damageType: 'Flooding',
    reservoirLevels: { Kotmale: 87, Victoria: 80 },
    severity: 'SIGNIFICANT',
  },
  {
    id: 'E10', year: 2024, name: '2024 Dam Release Event — Victoria', type: 'Dam Release',
    dateRange: '18 Oct – 24 Oct 2024', basins: ['Mahaweli'],
    peakLevels: { 'Mahaweli – Manampitiya': 5.74 },
    maxRainfall: 88, description: 'Victoria reservoir reached 99.2% capacity requiring emergency spillway release of 580 m³/s. Downstream communities had 4 hours advance warning from the CIDSS alert system.',
    fatalities: 0, displaced: 8200, economicLoss: 22, economicUnit: 'M USD', damageType: 'Controlled Release',
    reservoirLevels: { Victoria: 99, Randenigala: 94 },
    severity: 'MAJOR',
  },
]

// ── Seasonal patterns — monthly average levels by basin ───────────
export function generateSeasonalPattern(basin) {
  const rng = seedStr(basin + '-season')
  const base = { Kalu: 2.1, Kelani: 1.9, Mahaweli: 2.4, Nilwala: 1.8, Walawe: 2.0, Deduru: 1.2, Attanagalu: 1.5, Gin: 1.6 }[basin] || 1.8
  const swMonsoon = [0, 1, 2, 3, 4, 5] // Apr–Sep
  return Array.from({ length: 12 }, (_, m) => {
    const boost = swMonsoon.includes(m) ? 1.4 : 1.0
    const hist = +(base * boost * (0.85 + rng() * 0.3)).toFixed(2)
    const current = +(hist * (0.9 + rng() * 0.4)).toFixed(2)
    return {
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
      historical: hist,
      current,
      percentile: Math.round(30 + rng() * 65),
    }
  })
}

// ── Similar events (pattern matching) ────────────────────────────
export function findSimilarEvents(gaugeLevel, basin, topN = 5) {
  const rng = seedStr(`sim-${gaugeLevel}-${basin}`)
  const candidates = HISTORICAL_EVENTS.filter((e) => e.basins.includes(basin))
  return candidates.slice(0, topN).map((event) => {
    const score = +(0.55 + rng() * 0.44).toFixed(2)
    const peakVal = Object.values(event.peakLevels)[0]
    const hoursToP = Math.round(6 + rng() * 30)
    const recessionDays = +(1 + rng() * 5).toFixed(1)
    return { event, score, hoursToP, peakVal, recessionDays }
  }).sort((a, b) => b.score - a.score)
}

// ── Return period table ───────────────────────────────────────────
export function returnPeriodTable(basin) {
  const rng = seedStr(basin + '-rp')
  return [
    { returnYears: 2,  level: +(2.8 + rng() * 0.5).toFixed(2) },
    { returnYears: 5,  level: +(3.8 + rng() * 0.5).toFixed(2) },
    { returnYears: 10, level: +(4.5 + rng() * 0.4).toFixed(2) },
    { returnYears: 25, level: +(5.1 + rng() * 0.5).toFixed(2) },
    { returnYears: 50, level: +(5.7 + rng() * 0.4).toFixed(2) },
    { returnYears: 100,level: +(6.2 + rng() * 0.5).toFixed(2) },
  ]
}

// ── Trend series — annual peak level 1985–2025 ───────────────────
export function annualPeakTrend(basin) {
  const rng = seedStr(basin + '-trend')
  const base = { Kalu: 4.2, Kelani: 3.5, Mahaweli: 4.8, Nilwala: 3.8, Walawe: 4.4, Deduru: 2.6, Attanagalu: 2.9, Gin: 3.2 }[basin] || 3.5
  return Array.from({ length: 41 }, (_, i) => {
    const year = 1985 + i
    const trend = i * 0.018
    return { year, peak: +(base + trend + (rng() - 0.4) * 0.7).toFixed(2) }
  })
}

// ── Cyclone events subset ─────────────────────────────────────────
export const CYCLONE_EVENTS = HISTORICAL_EVENTS.filter((e) => e.cyclone)

// ── Gauge response timeseries for a historical event ─────────────
export function eventGaugeResponse(eventId, gaugeKey) {
  const rng = seedStr(eventId + gaugeKey)
  const event = HISTORICAL_EVENTS.find((e) => e.id === eventId)
  const peak = Object.values(event?.peakLevels || {})[0] || 4.0
  const baseLevel = peak * 0.35
  const N = 96
  const peakAt = Math.floor(N * 0.45)
  return Array.from({ length: N }, (_, i) => {
    let level
    if (i < peakAt) level = baseLevel + (peak - baseLevel) * Math.pow(i / peakAt, 1.8) + (rng() - 0.5) * 0.05
    else level = peak * Math.pow(1 - (i - peakAt) / (N - peakAt), 0.55) + baseLevel * 0.4 + (rng() - 0.5) * 0.04
    return { h: i - peakAt, level: +Math.max(0.1, level).toFixed(2) }
  })
}

export const BASINS = ['Kalu', 'Kelani', 'Mahaweli', 'Nilwala', 'Walawe', 'Deduru', 'Attanagalu', 'Gin']
export const EVENT_TYPES = ['All Types', 'Cyclone', 'Southwest Monsoon', 'Northeast Monsoon', 'Dam Release', 'Drought']