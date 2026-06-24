// Dummy geo dataset for the State & Basin Map page.
// All coordinates are illustrative, not survey-accurate — swap for real
// GeoServer layers / API responses when wiring the backend (see notes
// at the bottom of StateBasinMap.jsx for the intended endpoints).

import { GAUGE_DATA, ALERT_STATUS, RESERVOIR_DATA } from '../data'

// ── Province list (for the filter bar) ─────────────────────────────
export const PROVINCES = [
  'All Provinces', 'Western', 'Southern', 'Central',
  'North Western', 'Sabaragamuwa', 'Uva', 'Northern', 'North Central', 'Eastern',
]

// ── Basin reference info: province, color, polygon, bbox for "zoom to" ──
export const BASIN_INFO = {
  Kalu:        { province: 'Sabaragamuwa', color: '#3b82f6', bbox: [[6.40, 79.92], [7.05, 80.58]] },
  Kelani:      { province: 'Western',      color: '#8b5cf6', bbox: [[6.60, 79.93], [7.10, 80.50]] },
  Mahaweli:    { province: 'Central',      color: '#f59e0b', bbox: [[7.00, 80.30], [8.35, 81.30]] },
  Nilwala:     { province: 'Southern',     color: '#06b6d4', bbox: [[5.85, 80.30], [6.40, 80.70]] },
  Walawe:      { province: 'Sabaragamuwa', color: '#10b981', bbox: [[6.20, 80.60], [6.80, 81.00]] },
  Deduru:      { province: 'North Western',color: '#a855f7', bbox: [[7.30, 80.00], [7.90, 80.55]] },
  Attanagalu:  { province: 'Western',      color: '#f97316', bbox: [[6.90, 79.88], [7.20, 80.20]] },
  Gin:         { province: 'Southern',     color: '#0ea5e9', bbox: [[6.00, 80.05], [6.30, 80.40]] },
}

export const BASIN_NAMES = ['All Basins', ...Object.keys(BASIN_INFO)]

// ── Basin polygons (GeoJSON FeatureCollection) ──────────────────────
// Rough hand-drawn catchment shapes — enough to read as "a basin" on the map.
export const BASIN_POLYGONS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Kalu', color: BASIN_INFO.Kalu.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.55, 6.95], [80.40, 7.02], [80.10, 6.85], [79.96, 6.62],
        [80.05, 6.43], [80.30, 6.50], [80.50, 6.70], [80.55, 6.95],
      ]] } },
    { type: 'Feature', properties: { name: 'Kelani', color: BASIN_INFO.Kelani.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.48, 7.08], [80.30, 7.05], [80.10, 6.92], [79.95, 6.78],
        [79.96, 6.64], [80.18, 6.80], [80.40, 6.90], [80.48, 7.08],
      ]] } },
    { type: 'Feature', properties: { name: 'Mahaweli', color: BASIN_INFO.Mahaweli.color },
      geometry: { type: 'Polygon', coordinates: [[
        [81.28, 8.30], [80.95, 8.05], [80.62, 7.55], [80.35, 7.10],
        [80.55, 6.98], [80.95, 7.20], [81.10, 7.60], [81.28, 8.30],
      ]] } },
    { type: 'Feature', properties: { name: 'Nilwala', color: BASIN_INFO.Nilwala.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.65, 6.38], [80.45, 6.35], [80.30, 6.20], [80.34, 5.90],
        [80.55, 5.92], [80.62, 6.10], [80.65, 6.38],
      ]] } },
    { type: 'Feature', properties: { name: 'Walawe', color: BASIN_INFO.Walawe.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.98, 6.78], [80.78, 6.78], [80.62, 6.55], [80.65, 6.25],
        [80.85, 6.22], [80.95, 6.45], [80.98, 6.78],
      ]] } },
    { type: 'Feature', properties: { name: 'Deduru', color: BASIN_INFO.Deduru.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.52, 7.88], [80.30, 7.85], [80.02, 7.62], [80.05, 7.32],
        [80.30, 7.35], [80.48, 7.58], [80.52, 7.88],
      ]] } },
    { type: 'Feature', properties: { name: 'Attanagalu', color: BASIN_INFO.Attanagalu.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.18, 7.18], [80.00, 7.15], [79.90, 7.00], [80.00, 6.90],
        [80.15, 6.98], [80.18, 7.18],
      ]] } },
    { type: 'Feature', properties: { name: 'Gin', color: BASIN_INFO.Gin.color },
      geometry: { type: 'Polygon', coordinates: [[
        [80.38, 6.28], [80.20, 6.28], [80.06, 6.10], [80.15, 6.02],
        [80.32, 6.08], [80.38, 6.28],
      ]] } },
  ],
}

// ── River network (simple polylines, [lat, lng] pairs) ──────────────
export const RIVER_LINES = [
  { name: 'Kalu Ganga',   basin: 'Kalu',       color: BASIN_INFO.Kalu.color,
    points: [[6.95, 80.50], [6.75, 80.35], [6.65, 80.25], [6.53, 80.13], [6.45, 80.00]] },
  { name: 'Kelani River', basin: 'Kelani',     color: BASIN_INFO.Kelani.color,
    points: [[7.05, 80.45], [6.95, 80.21], [6.90, 80.08], [6.95, 79.95]] },
  { name: 'Mahaweli Ganga', basin: 'Mahaweli', color: BASIN_INFO.Mahaweli.color,
    points: [[7.00, 80.78], [7.29, 80.63], [7.60, 80.85], [7.92, 81.13], [8.30, 81.22]] },
  { name: 'Nilwala Ganga', basin: 'Nilwala',   color: BASIN_INFO.Nilwala.color,
    points: [[6.13, 80.45], [6.00, 80.50], [5.95, 80.54], [5.93, 80.55]] },
  { name: 'Walawe Ganga',  basin: 'Walawe',    color: BASIN_INFO.Walawe.color,
    points: [[6.70, 80.85], [6.45, 80.85], [6.34, 80.85], [6.27, 80.84]] },
]

// ── Roads (dummy) ─────────────────────────────────────────────────
export const ROAD_LINES = [
  { name: 'A1 — Colombo–Kandy Hwy', points: [[6.93, 79.84], [7.00, 80.10], [7.10, 80.40], [7.29, 80.63]] },
  { name: 'Southern Expressway',    points: [[6.93, 79.84], [6.70, 80.00], [6.45, 80.10], [6.00, 80.22]] },
]

// ── Gauge coordinates (merge onto GAUGE_DATA from data.js) ─────────
const GAUGE_COORDS = {
  G01: [6.5333, 80.1333], // Millakanda
  G02: [6.9000, 80.0800], // Hanwella
  G03: [7.9200, 81.1300], // Manampitiya
  G04: [6.1700, 80.2000], // Baddegama
  G05: [6.1300, 80.4500], // Pitabeddara
  G06: [7.0500, 80.0500], // Horombawa
  G07: [7.8700, 80.6500], // Dambulla
  G08: [6.3400, 80.8500], // Embilipitiya
}

export const GAUGE_STATIONS = GAUGE_DATA.map((g) => ({
  ...g,
  type: 'GAUGE',
  lat: GAUGE_COORDS[g.id]?.[0],
  lng: GAUGE_COORDS[g.id]?.[1],
  lastUpdated: '14:45 LKT',
}))

// ── Reservoir coordinates (merge onto RESERVOIR_DATA from data.js) ──
const RESERVOIR_COORDS = {
  Kotmale:     [7.05, 80.60],
  Victoria:    [7.23, 80.75],
  Randenigala: [7.23, 80.85],
  Udawalawe:   [6.45, 80.85],
  'Kalu Ganga': [6.85, 80.55],
  Rantambe:    [7.18, 80.88],
}

export const RESERVOIR_STATIONS = RESERVOIR_DATA.map((r, i) => ({
  id: `R0${i + 1}`,
  type: 'RESERVOIR',
  name: r.name,
  basin: r.name === 'Kalu Ganga' ? 'Kalu' : null,
  lat: RESERVOIR_COORDS[r.name]?.[0],
  lng: RESERVOIR_COORDS[r.name]?.[1],
  capacity: r.capacity,
  current: r.current,
  pct: r.pct,
  status: r.pct > 90 ? 'CRITICAL' : r.pct > 75 ? 'ALERT' : 'NORMAL',
  lastUpdated: '14:30 LKT',
}))

// ── Rain gauges (dummy 24h readings) ─────────────────────────────
export const RAIN_STATIONS = [
  { id: 'RG01', type: 'RAIN', name: 'Ratnapura',    basin: 'Kalu',       lat: 6.68, lng: 80.40, mm24h: 88, lastUpdated: '14:00 LKT' },
  { id: 'RG02', type: 'RAIN', name: 'Avissawella',  basin: 'Kelani',     lat: 6.95, lng: 80.21, mm24h: 70, lastUpdated: '14:00 LKT' },
  { id: 'RG03', type: 'RAIN', name: 'Kandy',        basin: 'Mahaweli',   lat: 7.29, lng: 80.63, mm24h: 22, lastUpdated: '14:00 LKT' },
  { id: 'RG04', type: 'RAIN', name: 'Matara',       basin: 'Nilwala',    lat: 5.95, lng: 80.54, mm24h: 75, lastUpdated: '14:00 LKT' },
  { id: 'RG05', type: 'RAIN', name: 'Embilipitiya', basin: 'Walawe',     lat: 6.34, lng: 80.85, mm24h: 40, lastUpdated: '14:00 LKT' },
  { id: 'RG06', type: 'RAIN', name: 'Kurunegala',   basin: 'Deduru',     lat: 7.49, lng: 80.36, mm24h: 15, lastUpdated: '14:00 LKT' },
].map((r) => ({
  ...r,
  status: r.mm24h > 75 ? 'MAJOR_FLOOD' : r.mm24h > 50 ? 'MINOR_FLOOD' : r.mm24h > 30 ? 'ALERT' : 'NORMAL',
}))

// ── Flood extent overlay (GeoJSON, depth in metres for the colour ramp) ──
export const FLOOD_EXTENT = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { depth: 1.8, name: 'Millakanda inundation' },
      geometry: { type: 'Polygon', coordinates: [[
        [80.10, 6.56], [80.16, 6.56], [80.16, 6.50], [80.10, 6.50], [80.10, 6.56],
      ]] } },
    { type: 'Feature', properties: { depth: 2.2, name: 'Embilipitiya inundation' },
      geometry: { type: 'Polygon', coordinates: [[
        [80.81, 6.37], [80.89, 6.37], [80.89, 6.31], [80.81, 6.31], [80.81, 6.37],
      ]] } },
    { type: 'Feature', properties: { depth: 1.0, name: 'Pitabeddara inundation' },
      geometry: { type: 'Polygon', coordinates: [[
        [80.42, 6.16], [80.48, 6.16], [80.48, 6.10], [80.42, 6.10], [80.42, 6.16],
      ]] } },
  ],
}

export const floodColor = (depth) =>
  depth >= 2.0 ? '#7f1d1d' : depth >= 1.5 ? '#dc2626' : depth >= 1.0 ? '#f97316' : '#93c5fd'

// ── GN (Grama Niladhari) division grid — sample over the Kalu basin ──
export const GN_DIVISIONS = (() => {
  const features = []
  const south = 6.46, north = 6.60, west = 80.07, east = 80.20
  const rows = 4, cols = 4
  let n = 1
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = south + (r * (north - south)) / rows
      const nLat = south + ((r + 1) * (north - south)) / rows
      const w = west + (c * (east - west)) / cols
      const e = west + ((c + 1) * (east - west)) / cols
      features.push({
        type: 'Feature',
        properties: { name: `GN-${String(n).padStart(3, '0')}` },
        geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, nLat], [w, nLat], [w, s]]] },
      })
      n++
    }
  }
  return { type: 'FeatureCollection', features }
})()

// ── Merged "all stations" list for the bottom quick-list table ─────
export const ALL_STATIONS = [...GAUGE_STATIONS, ...RESERVOIR_STATIONS, ...RAIN_STATIONS]

export { ALERT_STATUS }