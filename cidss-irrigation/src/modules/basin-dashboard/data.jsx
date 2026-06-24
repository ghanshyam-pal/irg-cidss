// Shared dummy data for all 3 dashboard designs

export const STAT_CARDS = [
  { label: 'Active Gauges',    value: '47',   unit: 'of 52',    color: '#2563eb', bg: '#eff6ff', icon: '📡', trend: '+2',  up: true },
  { label: 'Avg River Level',  value: '3.24', unit: 'm',        color: '#0891b2', bg: '#ecfeff', icon: '🌊', trend: '+0.12', up: true },
  { label: 'Total Rainfall',   value: '118',  unit: 'mm/24h',   color: '#7c3aed', bg: '#f5f3ff', icon: '🌧️', trend: '+34', up: true },
  { label: 'Reservoir > 80%',  value: '6',    unit: 'of 23',    color: '#d97706', bg: '#fffbeb', icon: '💧', trend: '0',   up: false },
  { label: 'Active Alerts',    value: '7',    unit: 'stations', color: '#dc2626', bg: '#fef2f2', icon: '🔔', trend: '+3',  up: true },
  { label: 'Forecast Horizon', value: '48',   unit: 'hours',    color: '#059669', bg: '#ecfdf5', icon: '📈', trend: '',    up: false },
]

export const GAUGE_DATA = [
  { id: 'G01', name: 'Kalu Ganga – Millakanda',    basin: 'Kalu',      level: 4.82, threshold: 4.5,  status: 'MAJOR_FLOOD', trend: '↑' },
  { id: 'G02', name: 'Kelani River – Hanwella',     basin: 'Kelani',    level: 3.21, threshold: 3.8,  status: 'ALERT',       trend: '↑' },
  { id: 'G03', name: 'Mahaweli – Manampitiya',      basin: 'Mahaweli',  level: 2.10, threshold: 4.2,  status: 'NORMAL',      trend: '→' },
  { id: 'G04', name: 'Gin Ganga – Baddegama',       basin: 'Gin',       level: 1.95, threshold: 3.5,  status: 'NORMAL',      trend: '↓' },
  { id: 'G05', name: 'Nilwala – Pitabeddara',       basin: 'Nilwala',   level: 3.78, threshold: 3.5,  status: 'MINOR_FLOOD', trend: '↑' },
  { id: 'G06', name: 'Attanagalu – Horombawa',      basin: 'Attanagalu',level: 2.45, threshold: 3.0,  status: 'NORMAL',      trend: '→' },
  { id: 'G07', name: 'Deduru Oya – Dambulla',       basin: 'Deduru',    level: 0.88, threshold: 2.8,  status: 'NORMAL',      trend: '↓' },
  { id: 'G08', name: 'Walawe – Embilipitiya',       basin: 'Walawe',    level: 5.10, threshold: 4.5,  status: 'MAJOR_FLOOD', trend: '↑' },
]

export const ALERT_STATUS = {
  NORMAL:      { label: 'Normal',      color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' },
  ALERT:       { label: 'Alert',       color: '#ca8a04', bg: '#fef9c3', dot: '#eab308' },
  MINOR_FLOOD: { label: 'Minor Flood', color: '#ea580c', bg: '#ffedd5', dot: '#f97316' },
  MAJOR_FLOOD: { label: 'Major Flood', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444' },
  CRITICAL:    { label: 'Critical',    color: '#7f1d1d', bg: '#fecaca', dot: '#991b1b' },
}

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

export const RAINFALL_DATA = [
  { day: 'Mon', Kalu: 42, Kelani: 28, Mahaweli: 10, Nilwala: 35 },
  { day: 'Tue', Kalu: 18, Kelani: 55, Mahaweli: 5,  Nilwala: 22 },
  { day: 'Wed', Kalu: 65, Kelani: 40, Mahaweli: 18, Nilwala: 48 },
  { day: 'Thu', Kalu: 30, Kelani: 12, Mahaweli: 8,  Nilwala: 30 },
  { day: 'Fri', Kalu: 88, Kelani: 70, Mahaweli: 22, Nilwala: 75 },
  { day: 'Sat', Kalu: 55, Kelani: 45, Mahaweli: 14, Nilwala: 60 },
  { day: 'Sun', Kalu: 72, Kelani: 38, Mahaweli: 30, Nilwala: 55 },
]

export const RESERVOIR_DATA = [
  { name: 'Kotmale',     capacity: 174, current: 158, pct: 91 },
  { name: 'Victoria',    capacity: 722, current: 589, pct: 82 },
  { name: 'Randenigala', capacity: 552, current: 408, pct: 74 },
  { name: 'Udawalawe',   capacity: 268, current: 162, pct: 60 },
  { name: 'Kalu Ganga',  capacity: 49,  current: 46,  pct: 94 },
  { name: 'Rantambe',    capacity: 49,  current: 28,  pct: 57 },
]

export const RECENT_ALERTS = [
  { time: '14:32', gauge: 'Kalu Ganga – Millakanda', level: 'Major Flood', value: '4.82 m', basin: 'Kalu',    color: '#dc2626', bg: '#fee2e2' },
  { time: '13:58', gauge: 'Walawe – Embilipitiya',   level: 'Major Flood', value: '5.10 m', basin: 'Walawe',  color: '#dc2626', bg: '#fee2e2' },
  { time: '13:15', gauge: 'Nilwala – Pitabeddara',   level: 'Minor Flood', value: '3.78 m', basin: 'Nilwala', color: '#ea580c', bg: '#ffedd5' },
  { time: '12:40', gauge: 'Kelani – Hanwella',        level: 'Alert',       value: '3.21 m', basin: 'Kelani',  color: '#ca8a04', bg: '#fef9c3' },
  { time: '11:22', gauge: 'Kalu Ganga – Millakanda', level: 'Alert',       value: '4.42 m', basin: 'Kalu',    color: '#ca8a04', bg: '#fef9c3' },
]

export const FORECAST_7DAY = [
  { date: 'Mon 16', rainfall: 28, level: 3.1 },
  { date: 'Tue 17', rainfall: 45, level: 3.4 },
  { date: 'Wed 18', rainfall: 82, level: 4.2 },
  { date: 'Thu 19', rainfall: 60, level: 4.8 },
  { date: 'Fri 20', rainfall: 35, level: 4.1 },
  { date: 'Sat 21', rainfall: 20, level: 3.5 },
  { date: 'Sun 22', rainfall: 15, level: 3.0 },
]