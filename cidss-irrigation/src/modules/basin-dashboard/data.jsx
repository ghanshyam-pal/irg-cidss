// data.js — Merged Dashboard Data

// ─── Stat Cards (From Second File) ───────────────────────────────────────────
export const STAT_CARDS = [
  { label: 'Active Gauges',    value: '47',   unit: 'of 52',    color: '#2563eb', bg: '#eff6ff', icon: '📡', trend: '+2',  up: true },
  { label: 'Avg River Level',  value: '3.24', unit: 'm',        color: '#0891b2', bg: '#ecfeff', icon: '🌊', trend: '+0.12', up: true },
  { label: 'Total Rainfall',   value: '118',  unit: 'mm/24h',   color: '#7c3aed', bg: '#f5f3ff', icon: '🌧️', trend: '+34', up: true },
  { label: 'Reservoir > 80%',  value: '6',    unit: 'of 23',    color: '#d97706', bg: '#fffbeb', icon: '💧', trend: '0',   up: false },
  { label: 'Active Alerts',    value: '7',    unit: 'stations', color: '#dc2626', bg: '#fef2f2', icon: '🔔', trend: '+3',  up: true },
  { label: 'Forecast Horizon', value: '48',   unit: 'hours',    color: '#059669', bg: '#ecfdf5', icon: '📈', trend: '',    up: false },
]

// ─── Alert status config ──────────────────────────────────────────────────────
export const ALERT_STATUS = {
  NORMAL:      { label: 'Normal',      color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' },
  ALERT:       { label: 'Alert',       color: '#ca8a04', bg: '#fef9c3', dot: '#eab308' },
  MINOR_FLOOD: { label: 'Minor Flood', color: '#ea580c', bg: '#ffedd5', dot: '#f97316' },
  MAJOR_FLOOD: { label: 'Major Flood', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  CRITICAL:    { label: 'Critical',    color: '#7f1d1d', bg: '#fecaca', dot: '#991b1b' },
}

// ─── Gauges (Merged with extended geographical/sensor data) ───────────────────
export const GAUGE_DATA = [
  { id: 'G01', name: 'Kalu Ganga – Millakanda',    basin: 'Kalu',       subbasin: 'Upper Kalu',    type: 'river',  lat: 6.533, lng: 80.133, level: 4.82, threshold: 4.5,  status: 'MAJOR_FLOOD', trend: '↑', rain24h: 88 },
  { id: 'G02', name: 'Kelani River – Hanwella',     basin: 'Kelani',     subbasin: 'Lower Kelani',  type: 'river',  lat: 6.902, lng: 80.082, level: 3.21, threshold: 3.8,  status: 'ALERT',       trend: '↑', rain24h: 45 },
  { id: 'G03', name: 'Mahaweli – Manampitiya',      basin: 'Mahaweli',   subbasin: 'Middle Mahaweli',type:'river',  lat: 7.888, lng: 81.098, level: 2.10, threshold: 4.2,  status: 'NORMAL',      trend: '→', rain24h: 12 },
  { id: 'G04', name: 'Gin Ganga – Baddegama',       basin: 'Gin',        subbasin: 'Lower Gin',     type: 'river',  lat: 6.183, lng: 80.183, level: 1.95, threshold: 3.5,  status: 'NORMAL',      trend: '↓', rain24h: 20 },
  { id: 'G05', name: 'Nilwala – Pitabeddara',       basin: 'Nilwala',    subbasin: 'Upper Nilwala', type: 'river',  lat: 5.983, lng: 80.533, level: 3.78, threshold: 3.5,  status: 'MINOR_FLOOD', trend: '↑', rain24h: 62 },
  { id: 'G06', name: 'Attanagalu – Horombawa',      basin: 'Attanagalu', subbasin: 'Lower Attanagalu',type:'river', lat: 7.133, lng: 80.016, level: 2.45, threshold: 3.0,  status: 'NORMAL',      trend: '→', rain24h: 18 },
  { id: 'G07', name: 'Deduru Oya – Dambulla',       basin: 'Deduru',     subbasin: 'Upper Deduru',  type: 'river',  lat: 7.866, lng: 80.649, level: 0.88, threshold: 2.8,  status: 'NORMAL',      trend: '↓', rain24h: 5  },
  { id: 'G08', name: 'Walawe – Embilipitiya',       basin: 'Walawe',     subbasin: 'Upper Walawe',  type: 'river',  lat: 6.333, lng: 80.850, level: 5.10, threshold: 4.5,  status: 'MAJOR_FLOOD', trend: '↑', rain24h: 95 },
  { id: 'R01', name: 'Kotmale Rain Gauge',           basin: 'Mahaweli',   subbasin: 'Upper Mahaweli',type: 'rain',   lat: 6.998, lng: 80.633, level: null, threshold: null, status: 'NORMAL',      trend: '→', rain24h: 38 },
  { id: 'R02', name: 'Ratnapura Rain Gauge',         basin: 'Kalu',       subbasin: 'Upper Kalu',    type: 'rain',   lat: 6.683, lng: 80.400, level: null, threshold: null, status: 'ALERT',       trend: '↑', rain24h: 110},
  { id: 'RS01',name: 'Kotmale Reservoir',            basin: 'Mahaweli',   subbasin: 'Upper Mahaweli',type: 'reservoir',lat:6.998,lng:80.633,  level: 3.21,  threshold: 3.8,   status: 'ALERT',       trend: '↑', rain24h: null},
  { id: 'RS02',name: 'Victoria Reservoir',           basin: 'Mahaweli',   subbasin: 'Middle Mahaweli',type:'reservoir',lat:7.216,lng:80.783, level: 2.10,  threshold: 4.2,   status: 'NORMAL',      trend: '→', rain24h: null},
]

// ─── Multi-location alerts ────────────────────────────────────────────────────
export const ACTIVE_ALERTS = [
  {
    id: 'AL001', type: 'Rainfall Alert',         severity: 'Warning',
    time: '15 min ago', clock: '14:30 LKT',      date: '17 Jun 2026',
    title: 'Extremely heavy rainfall',           loc: 'Kalu Basin · Ratnapura',
    color: '#ef4444', bg: '#fef2f2',             border: '#fecaca',
    stations: ['G01','R02'],                     basin: 'Kalu',
  },
  {
    id: 'AL002', type: 'Water Level Alert',      severity: 'Danger',
    time: '1 hour ago', clock: '13:45 LKT',     date: '17 Jun 2026',
    title: 'Severe flood at Millakanda',         loc: 'Kalu Ganga · Station G01',
    color: '#f59e0b', bg: '#fffbeb',             border: '#fde68a',
    stations: ['G01'],                           basin: 'Kalu',
  },
  {
    id: 'AL003', type: 'Major Flood Alert',      severity: 'Critical',
    time: '2 hours ago', clock: '12:45 LKT',    date: '17 Jun 2026',
    title: 'Major flood — Walawe basin',         loc: 'Walawe · Embilipitiya',
    color: '#dc2626', bg: '#fef2f2',             border: '#fecaca',
    stations: ['G08'],                           basin: 'Walawe',
  },
  {
    id: 'AL004', type: 'Minor Flood Alert',      severity: 'Warning',
    time: '3 hours ago', clock: '11:45 LKT',    date: '17 Jun 2026',
    title: 'Rising levels at Pitabeddara',       loc: 'Nilwala · Pitabeddara',
    color: '#f97316', bg: '#fff7ed',             border: '#fed7aa',
    stations: ['G05'],                           basin: 'Nilwala',
  },
  {
    id: 'AL005', type: 'Reservoir Alert',        severity: 'Watch',
    time: '4 hours ago', clock: '10:45 LKT',    date: '17 Jun 2026',
    title: 'Kotmale nearing 95% capacity',       loc: 'Kotmale Reservoir',
    color: '#ca8a04', bg: '#fef9c3',             border: '#fde68a',
    stations: ['RS01'],                          basin: 'Mahaweli',
  },
  {
    id: 'AL006', type: 'Water Discharge Alert',  severity: 'Watch',
    time: '1 day ago', clock: '10:00 LKT',      date: '16 Jun 2026',
    title: 'Rising discharge — Walawe Barrage',  loc: 'Barrage · Walawe River',
    color: '#16a34a', bg: '#f0fdf4',             border: '#bbf7d0',
    stations: ['G08'],                           basin: 'Walawe',
  },
]

// ─── Gauge timeseries (48h) ───────────────────────────────────────────────────
const HOURS = Array.from({ length: 25 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`)
const makeLevel = (base, noise) =>
  HOURS.map((h, i) => ({
    time: h,
    observed: +(base + Math.sin(i * 0.4) * noise + (Math.random() - 0.5) * 0.2).toFixed(2),
    forecast:  +(base + Math.sin(i * 0.4) * noise * 1.1 + 0.15 + (Math.random() - 0.5) * 0.1).toFixed(2),
  }))

export const GAUGE_SERIES = {
  G01: makeLevel(4.2, 0.7),
  G02: makeLevel(2.9, 0.5),
  G05: makeLevel(3.4, 0.5),
  G08: makeLevel(4.7, 0.6),
}

// ─── Rainfall (7 days) ────────────────────────────────────────────────────────
export const RAINFALL_DATA = [
  { day: 'Mon', Kalu: 42, Kelani: 28, Mahaweli: 10, Nilwala: 35 },
  { day: 'Tue', Kalu: 18, Kelani: 55, Mahaweli: 5,  Nilwala: 22 },
  { day: 'Wed', Kalu: 65, Kelani: 40, Mahaweli: 18, Nilwala: 48 },
  { day: 'Thu', Kalu: 30, Kelani: 12, Mahaweli: 8,  Nilwala: 30 },
  { day: 'Fri', Kalu: 88, Kelani: 70, Mahaweli: 22, Nilwala: 75 },
  { day: 'Sat', Kalu: 55, Kelani: 45, Mahaweli: 14, Nilwala: 60 },
  { day: 'Sun', Kalu: 72, Kelani: 38, Mahaweli: 30, Nilwala: 55 },
]

// ─── Reservoir ────────────────────────────────────────────────────────────────
export const RESERVOIR_DATA = [
  { name: 'Kotmale',     capacity: 174, current: 158, pct: 91 },
  { name: 'Victoria',    capacity: 722, current: 589, pct: 82 },
  { name: 'Randenigala', capacity: 552, current: 408, pct: 74 },
  { name: 'Udawalawe',   capacity: 268, current: 162, pct: 60 },
  { name: 'Kalu Ganga',  capacity: 49,  current: 46,  pct: 94 },
  { name: 'Rantambe',    capacity: 49,  current: 28,  pct: 57 },
]

// ─── Recent alerts log ────────────────────────────────────────────────────────
export const RECENT_ALERTS = [
  { time: '14:32', gauge: 'Kalu Ganga – Millakanda', level: 'Major Flood', value: '4.82 m', basin: 'Kalu',    color: '#dc2626', bg: '#fee2e2' },
  { time: '13:58', gauge: 'Walawe – Embilipitiya',   level: 'Major Flood', value: '5.10 m', basin: 'Walawe',  color: '#dc2626', bg: '#fee2e2' },
  { time: '13:15', gauge: 'Nilwala – Pitabeddara',   level: 'Minor Flood', value: '3.78 m', basin: 'Nilwala', color: '#ea580c', bg: '#ffedd5' },
  { time: '12:40', gauge: 'Kelani – Hanwella',        level: 'Alert',       value: '3.21 m', basin: 'Kelani',  color: '#ca8a04', bg: '#fef9c3' },
  { time: '11:22', gauge: 'Kalu Ganga – Millakanda', level: 'Alert',       value: '4.42 m', basin: 'Kalu',    color: '#ca8a04', bg: '#fef9c3' },
]

// ─── 7-day rainfall forecast (Merged with metadata) ───────────────────────────
export const FORECAST_7DAY = [
  { date: 'Mon 16', day: 'Mon', rainfall: 28,  level: 3.1, intensity: 'Normal',       icon: '🌤' },
  { date: 'Tue 17', day: 'Tue', rainfall: 45,  level: 3.4, intensity: 'Heavy',        icon: '🌧' },
  { date: 'Wed 18', day: 'Wed', rainfall: 82,  level: 4.2, intensity: 'Very Heavy',   icon: '⛈' },
  { date: 'Thu 19', day: 'Thu', rainfall: 60,  level: 4.8, intensity: 'Very Heavy',   icon: '🌧' },
  { date: 'Fri 20', day: 'Fri', rainfall: 35,  level: 4.1, intensity: 'Moderate',     icon: '🌦' },
  { date: 'Sat 21', day: 'Sat', rainfall: 20,  level: 3.5, intensity: 'Light',        icon: '🌤' },
  { date: 'Sun 22', day: 'Sun', rainfall: 15,  level: 3.0, intensity: 'Light',        icon: '☀' },
]

// ─── Rainfall forecast by basin (next 7 days) ─────────────────────────────────
export const RAINFALL_FORECAST_BASIN = [
  { day: 'Mon', Kalu: 30, Kelani: 22, Mahaweli: 10, Nilwala: 28, Walawe: 18 },
  { day: 'Tue', Kalu: 55, Kelani: 42, Mahaweli: 18, Nilwala: 48, Walawe: 35 },
  { day: 'Wed', Kalu: 90, Kelani: 68, Mahaweli: 25, Nilwala: 80, Walawe: 72 },
  { day: 'Thu', Kalu: 72, Kelani: 55, Mahaweli: 20, Nilwala: 65, Walawe: 60 },
  { day: 'Fri', Kalu: 42, Kelani: 30, Mahaweli: 14, Nilwala: 38, Walawe: 30 },
  { day: 'Sat', Kalu: 25, Kelani: 18, Mahaweli: 8,  Nilwala: 22, Walawe: 15 },
  { day: 'Sun', Kalu: 18, Kelani: 12, Mahaweli: 5,  Nilwala: 15, Walawe: 10 },
]

// ─── Map layers config ────────────────────────────────────────────────────────
export const HYDRO_LAYERS = [
  { id: 'basins',    label: 'River Basins',       color: '#3b82f6', default: true  },
  { id: 'subbasins', label: 'Sub-basins',          color: '#06b6d4', default: false },
  { id: 'rivers',    label: 'River Network',       color: '#1d4ed8', default: true  },
  { id: 'gauges',    label: 'River Gauges',        color: '#ef4444', default: true  },
  { id: 'reservoirs',label: 'Reservoirs',          color: '#8b5cf6', default: true  },
  { id: 'flood',     label: 'Flood Extent',        color: '#f97316', default: true  },
  { id: 'gnDiv',     label: 'GN Divisions',        color: '#64748b', default: false },
]

export const METEO_LAYERS = [
  { id: 'rainGauge', label: 'Rain Gauges',         color: '#06b6d4', default: true  },
  { id: 'rainfall',  label: 'Rainfall (IDW)',       color: '#7c3aed', default: false },
  { id: 'radar',     label: 'Weather Radar',        color: '#0891b2', default: false },
  { id: 'wind',      label: 'Wind Field',           color: '#64748b', default: false },
  { id: 'temp',      label: 'Temperature',          color: '#f59e0b', default: false },
  { id: 'humidity',  label: 'Humidity',             color: '#10b981', default: false },
  { id: 'cyclone',   label: 'Cyclone Track',        color: '#ef4444', default: false },
]

// ─── Basin + subbasin definitions for search ──────────────────────────────────
export const BASINS = [
  { id: 'kalu',       name: 'Kalu Ganga Basin',        area: 2727, gauges: 8,  reservoirs: 2 },
  { id: 'kelani',     name: 'Kelani River Basin',       area: 2292, gauges: 12, reservoirs: 4 },
  { id: 'mahaweli',   name: 'Mahaweli Basin',           area: 10448,gauges: 15, reservoirs: 6 },
  { id: 'nilwala',    name: 'Nilwala River Basin',      area: 969,  gauges: 6,  reservoirs: 1 },
  { id: 'walawe',     name: 'Walawe River Basin',       area: 2448, gauges: 8,  reservoirs: 3 },
  { id: 'attanagalu', name: 'Attanagalu Oya Basin',     area: 722,  gauges: 5,  reservoirs: 1 },
  { id: 'deduru',     name: 'Deduru Oya Basin',         area: 2609, gauges: 6,  reservoirs: 2 },
  { id: 'gin',        name: 'Gin Ganga Basin',          area: 932,  gauges: 4,  reservoirs: 1 },
]