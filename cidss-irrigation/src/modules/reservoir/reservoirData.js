// reservoirData.js — data for expanded M1 Reservoir Management page
function mulberry32(seed) {
  let a=seed;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
}
function seedStr(s) { let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19)}return mulberry32(h>>>0) }

export const RESERVOIRS = [
  { id:'R01', name:'Kotmale',     capacity:174, current:158, pct:91, river:'Kotmale Oya',    basin:'Mahaweli', lat:7.05, lng:80.60, spillwayCapacity:1200, currentInflow:340, currentRelease:180, minRelease:40, maxSafeRelease:620 },
  { id:'R02', name:'Victoria',    capacity:722, current:589, pct:82, river:'Mahaweli Ganga', basin:'Mahaweli', lat:7.23, lng:80.75, spillwayCapacity:3200, currentInflow:820, currentRelease:350, minRelease:100, maxSafeRelease:1400 },
  { id:'R03', name:'Randenigala', capacity:552, current:408, pct:74, river:'Mahaweli Ganga', basin:'Mahaweli', lat:7.23, lng:80.85, spillwayCapacity:2800, currentInflow:680, currentRelease:280, minRelease:80, maxSafeRelease:1100 },
  { id:'R04', name:'Udawalawe',   capacity:268, current:162, pct:60, river:'Walawe Ganga',   basin:'Walawe',   lat:6.45, lng:80.85, spillwayCapacity:900,  currentInflow:180, currentRelease:120, minRelease:30, maxSafeRelease:480 },
  { id:'R05', name:'Kalu Ganga',  capacity:49,  current:46,  pct:94, river:'Kalu Ganga',     basin:'Kalu',     lat:6.85, lng:80.55, spillwayCapacity:380,  currentInflow:210, currentRelease:140, minRelease:20, maxSafeRelease:280 },
  { id:'R06', name:'Rantambe',    capacity:49,  current:28,  pct:57, river:'Mahaweli Ganga', basin:'Mahaweli', lat:7.18, lng:80.88, spillwayCapacity:420,  currentInflow:160, currentRelease:90,  minRelease:25, maxSafeRelease:300 },
]

// ── Flood probability by storage % (used in Tab 2) ───────────────
export const FLOOD_PROBABILITY_TABLE = [
  { range:'< 50%',   low:50,  high:null, probability:8 },
  { range:'50–65%',  low:50,  high:65,   probability:18 },
  { range:'65–75%',  low:65,  high:75,   probability:32 },
  { range:'75–85%',  low:75,  high:85,   probability:55 },
  { range:'85–90%',  low:85,  high:90,   probability:71 },
  { range:'90–95%',  low:90,  high:95,   probability:84 },
  { range:'> 95%',   low:95,  high:null, probability:96 },
]

// ── Historical events linked to each reservoir ───────────────────
export const RESERVOIR_HISTORICAL_EVENTS = {
  R02: [
    { date:'2017-05-28', storage:93, releaseM3s:980, downstreamPeak:5.8, gauge:'Mahaweli – Manampitiya', hoursToP:6, affected:42000, note:'Highest recorded release in CIDSS period' },
    { date:'2021-05-15', storage:88, releaseM3s:640, downstreamPeak:4.9, gauge:'Mahaweli – Manampitiya', hoursToP:7, affected:18000, note:'Tauktae remnants — controlled release prevented worse outcome' },
    { date:'2014-01-08', storage:98, releaseM3s:1200, downstreamPeak:5.91, gauge:'Mahaweli – Manampitiya', hoursToP:5, affected:32000, note:'Emergency spillway activation — reservoir at 99% after 8 days NE monsoon' },
  ],
  R01: [
    { date:'2017-05-26', storage:94, releaseM3s:580, downstreamPeak:5.2, gauge:'Kotmale Oya downstream', hoursToP:4, affected:8200, note:'Cascades into Victoria — coordinated release required' },
  ],
  R05: [
    { date:'2016-05-18', storage:95, releaseM3s:260, downstreamPeak:5.94, gauge:'Kalu Ganga – Millakanda', hoursToP:3, affected:45000, note:'Fastest response time in dataset — only 3h from release to gauge peak' },
    { date:'2023-06-10', storage:91, releaseM3s:180, downstreamPeak:5.18, gauge:'Kalu Ganga – Millakanda', hoursToP:4, affected:12500, note:'New CIDSS alert system gave 4h advance warning to downstream communities' },
  ],
  R04: [], R03: [], R06: [],
}

// ── Inflow trend (last 30 days vs historical avg) ────────────────
export function inflowTrend(reservoirId) {
  const rng = seedStr(reservoirId+'-inflow')
  const r = RESERVOIRS.find((x)=>x.id===reservoirId)
  const base = r?.currentInflow || 200
  return Array.from({ length:30 }, (_,i) => {
    const daysAgo = 29-i
    return {
      day: `D-${daysAgo}`,
      inflow: +(base*(0.55+rng()*0.9)+(Math.sin(i/5)*base*0.18)).toFixed(0),
      historicalAvg: +(base*(0.72+rng()*0.25)).toFixed(0),
    }
  })
}

// ── ML Release Decision — ensemble over rainfall scenarios ────────
// POST /ml/release-decision { reservoirId, proposedRelease, durationHours }
export function computeReleasePlan(reservoirId, proposedRelease, durationHours, delayHours=0) {
  const rng = seedStr(`${reservoirId}-${proposedRelease}-${durationHours}-${delayHours}`)
  const r = RESERVOIRS.find((x)=>x.id===reservoirId)
  if (!r) return null

  const safe = r.maxSafeRelease
  const ratio = proposedRelease / safe
  const baseRise = ratio * 2.8 + rng()*0.2

  const makeMember = (perturbFactor) => {
    const rise = baseRise * perturbFactor
    const peak = Math.min(r.currentInflow*0.01 + baseRise*(1+rng()*0.1), 7.5)
    return { rise: +rise.toFixed(2), peakDownstream: +(3.2 + rise + rng()*0.15).toFixed(2) }
  }

  const members = Array.from({length:20}, (_,i) => makeMember(0.7+i*0.03+rng()*0.1))
  members.sort((a,b)=>a.peakDownstream-b.peakDownstream)

  const sorted = members.map(m=>m.peakDownstream)
  const p10 = sorted[1], p50 = sorted[9], p90 = sorted[17]

  const thresholds = { alert:3.8, minor:4.2, major:4.7, critical:5.3 }
  const excMajor = members.filter(m=>m.peakDownstream>=thresholds.major).length / members.length

  const storageDropMm3 = (proposedRelease * durationHours * 3600) / 1e6
  const newStorage = Math.max(0, r.current - storageDropMm3)
  const newPct = Math.round((newStorage/r.capacity)*100)

  const minSafe = r.minRelease
  const maxSafe = r.maxSafeRelease
  const recommended = Math.min(maxSafe, Math.max(minSafe, Math.round(proposedRelease * 0.85)))
  const recommendedRange = [Math.round(recommended*0.82), Math.round(recommended*1.18)]

  // Time options
  const makeOption = (label, delay) => {
    const d = delay/24
    const factor = Math.max(0.5, 1 - d*0.08)
    return { label, delayH:delay, peakP50: +(p50*factor+rng()*0.05).toFixed(2), exceedsMajor: excMajor*factor }
  }

  return {
    proposed: proposedRelease,
    duration: durationHours,
    storageDropMm3: +storageDropMm3.toFixed(1),
    newPct,
    p10, p50, p90,
    excMajor: +excMajor.toFixed(2),
    confidence: p90-p10 < 0.5 ? 'High' : p90-p10 < 1.2 ? 'Moderate' : 'Low',
    recommended,
    recommendedRange,
    timeOptions: [makeOption('Release now',0), makeOption('Wait 6h',6), makeOption('Wait 12h',12)],
    thresholds,
    safeToRelease: proposedRelease <= maxSafe && excMajor < 0.3,
  }
}

// ── Irrigation water issue planning ──────────────────────────────
export const IRRIGATION_PLANS = {
  R04: [
    { commandArea:'Udawalawe Left Bank', cropType:'Paddy (Yala)', areaCultivated:12800, cropStage:'Tillering (45 days)', waterRequired:280, currentStorage:162, deficit:0, scheduled:'22 Jun – 15 Jul', planned:240, actual:218 },
    { commandArea:'Udawalawe Right Bank', cropType:'Sugarcane', areaCultivated:3400, cropStage:'Grand growth', waterRequired:80, currentStorage:162, deficit:18, scheduled:'Ongoing', planned:80, actual:62 },
  ],
  R02: [
    { commandArea:'Mahaweli System H', cropType:'Paddy (Yala)', areaCultivated:28000, cropStage:'Panicle initiation (60 days)', waterRequired:620, currentStorage:589, deficit:0, scheduled:'18 Jun – 30 Jul', planned:580, actual:550 },
  ],
}

export const SEASONAL_FORECAST_NOTE = 'IMD seasonal forecast indicates above-normal rainfall for SW Sri Lanka in Jun–Aug 2026. Reservoir drawdown risk is LOW — storage replenishment likely.'