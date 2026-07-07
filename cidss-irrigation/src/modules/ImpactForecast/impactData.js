// impactData.js — dummy data for M13 Impact Based Forecasting
function mulberry32(seed) {
  let a = seed
  return () => { a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296 }
}
function seedStr(s) { let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19)}return mulberry32(h>>>0) }

// ── Affected GN divisions ──────────────────────────────────────────
const DISTRICTS = ['Ratnapura','Kalutara','Colombo','Matara','Galle','Hambantota','Kandy','Badulla']
const GN_STATUS = ['Dry','Watch','Warning','Minor Flood','Major Flood']
const EVAC_STATUS = ['Not required','Advised','Ordered','In progress','Completed']

export const GN_DIVISIONS = Array.from({ length: 42 }, (_, i) => {
  const rng = seedStr(`gn-${i}`)
  const district = DISTRICTS[i % DISTRICTS.length]
  const pop = Math.round(800 + rng() * 3200)
  const hh = Math.round(pop / 4.2)
  const statusIdx = i < 8 ? Math.floor(3 + rng()*2) : i < 20 ? Math.floor(1 + rng()*3) : Math.floor(rng()*2)
  const status = GN_STATUS[Math.min(statusIdx, 4)]
  const evacIdx = status === 'Major Flood' ? 3 : status === 'Minor Flood' ? 2 : status === 'Warning' ? 1 : 0
  const shelterCap = Math.round(50 + rng() * 200)
  const shelterOcc = Math.round(shelterCap * (status==='Major Flood' ? 0.7+rng()*0.28 : status==='Minor Flood' ? 0.2+rng()*0.4 : 0))
  const forecastStatus24h = GN_STATUS[Math.min(statusIdx + (rng()>0.5?1:0), 4)]
  return {
    id: `GN-${String(i+1).padStart(3,'0')}`,
    name: `${district} GN Division ${i+1}`,
    district,
    basin: ['Kalu','Kelani','Nilwala','Gin'][i%4],
    population: pop,
    households: hh,
    vulnerable: Math.round(pop * (0.08 + rng()*0.12)),
    status,
    forecastStatus24h,
    evacuationStatus: EVAC_STATUS[Math.min(evacIdx, 4)],
    shelterCapacity: shelterCap,
    shelterOccupancy: shelterOcc,
    agricultureHa: Math.round(10 + rng()*180),
    severity: statusIdx,
  }
}).sort((a,b) => b.severity - a.severity)

// ── Current impact totals ──────────────────────────────────────────
export const CURRENT_IMPACT = {
  peopleAtRisk: 142800,
  householdsAffected: 33800,
  agricultureHa: 8240,
  roadsKm: 178,
  bridgesAtRisk: 23,
  economicLossPerHour: 145000, // USD
}

// ── Sector breakdown ──────────────────────────────────────────────
export const SECTOR_IMPACT = {
  agriculture: {
    cropTypes: [
      { crop:'Paddy (Yala)',  areaAffected:3200, yieldLoss:38, farmerCount:1840 },
      { crop:'Tea',          areaAffected:420,  yieldLoss:12, farmerCount:320 },
      { crop:'Rubber',       areaAffected:680,  yieldLoss:22, farmerCount:290 },
      { crop:'Vegetable',    areaAffected:940,  yieldLoss:55, farmerCount:760 },
    ],
  },
  households: {
    totalAffected: 33800,
    displaced: 12400,
    atRisk: 21400,
    vulnerable: 9200,
    breakdown: [
      { category:'Elderly (65+)',         count:2840 },
      { category:'Disabled',              count:1180 },
      { category:'Children under 5',      count:3620 },
      { category:'Pregnant / nursing',    count:480  },
    ],
  },
  infrastructure: {
    roads: { total:178, major:42, secondary:136 },
    bridges: { atRisk:23, closed:8 },
    irrigationCanals: 34,
    powerLines: 12,
  },
  livelihoods: [
    { sector:'Fishing communities', affected:3400 },
    { sector:'Tourism (Galle/Matara)', affected:1200 },
    { sector:'Industrial zones', affected:640 },
  ],
}

// ── P10 / P50 / P90 scenario data ─────────────────────────────────
export const FORECAST_SCENARIOS = [
  {
    id:'P10', label:'Optimistic', pct:'P10',
    description:'Best-case ensemble scenario — 10th percentile rainfall, favourable conditions.',
    peakLevel: 4.2, timeOfPeak:'+8h', floodExtentKm2: 42,
    peopleAffected: 38000, economicImpact: 28, unit:'M USD',
    recommendation:'Issue watch, monitor river levels, activate duty officer.',
    recommendationLevel:'watch',
    color:'#16a34a', bg:'#dcfce7', border:'#bbf7d0',
    actions:['Issue flood watch advisory','Alert field officers to monitor gauges','Prepare shelter list for affected GN divisions','Update 6-hourly forecast bulletin'],
  },
  {
    id:'P50', label:'Most Likely', pct:'P50',
    description:'Median ensemble — most likely outcome based on current model run.',
    peakLevel: 5.1, timeOfPeak:'+14h', floodExtentKm2: 118,
    peopleAffected: 96000, economicImpact: 82, unit:'M USD',
    recommendation:'Issue warning, open shelters, prepare evacuation routes.',
    recommendationLevel:'warning',
    color:'#d97706', bg:'#fef9c3', border:'#fde68a',
    actions:['Issue flood warning for Kalu and Kelani basins','Open designated emergency shelters (12 locations)','Coordinate with police and military for evacuation support','Alert hospitals in flood-prone areas','Suspend road traffic on low-lying crossings'],
  },
  {
    id:'P90', label:'Worst Case', pct:'P90',
    description:'90th percentile — worst plausible scenario, act on this for evacuation decisions.',
    peakLevel: 6.4, timeOfPeak:'+20h', floodExtentKm2: 284,
    peopleAffected: 195000, economicImpact: 240, unit:'M USD',
    recommendation:'Issue evacuation order, activate emergency operations centre.',
    recommendationLevel:'evacuation',
    color:'#dc2626', bg:'#fee2e2', border:'#fecaca',
    actions:['Issue mandatory evacuation order — Ratnapura and Kalutara districts','Activate National Emergency Operations Centre','Request military deployment for rescue operations','Issue public emergency broadcast','Coordinate international aid pre-positioning','Close A4 and B66 highways at flood-prone sections'],
  },
]

// ── People-affected curve vs time ─────────────────────────────────
export const IMPACT_CURVE = Array.from({ length: 49 }, (_, h) => {
  const t = h - 6
  const factor = t < 0 ? 0 : Math.pow(t/42, 1.5)
  return {
    h: t,
    label: t === 0 ? 'Now' : t < 0 ? `${t}h` : `+${t}h`,
    P10: Math.round(38000 * Math.min(1, factor * 0.85)),
    P50: Math.round(96000 * Math.min(1, factor * 0.92)),
    P90: Math.round(195000 * Math.min(1, factor)),
  }
})

// Historical comparison event for impact
export const COMPARABLE_HISTORICAL = {
  name:'2016 Kalu Ganga Flood', year:2016, peopleAffected:45000, peakLevel:5.94,
  note:'The P50 scenario is most similar to the 2016 event which affected 45,000 people and caused $120M in damage.',
}