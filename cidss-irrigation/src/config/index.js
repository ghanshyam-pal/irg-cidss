// src/config/index.js
// Central config — all env vars and app-wide constants live here

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
export const WS_URL       = import.meta.env.VITE_WS_URL  || 'ws://localhost:4000'

// Flood alert thresholds — colour tokens used across modules
export const ALERT_LEVELS = {
  NORMAL:      { label: 'Normal',      color: '#22c55e', bg: '#dcfce7' },
  ALERT:       { label: 'Alert',       color: '#eab308', bg: '#fef9c3' },
  MINOR_FLOOD: { label: 'Minor Flood', color: '#f97316', bg: '#ffedd5' },
  MAJOR_FLOOD: { label: 'Major Flood', color: '#ef4444', bg: '#fee2e2' },
  CRITICAL:    { label: 'Critical',    color: '#7f1d1d', bg: '#fca5a5' },
}

// Module registry — drives sidebar navigation and lazy routes
// export const MODULES = [
//   {
//     id: 'm1',
//     key: 'reservoir-anomaly',
//     label: 'Reservoir Anomaly',
//     icon: 'gauge',
//     path: '/reservoir-anomaly',
//     priority: 1,
//     phase: 1,
//   },
//   {
//     id: 'm2',
//     key: 'public-api',
//     label: 'Public Data API',
//     icon: 'api',
//     path: '/public-api',
//     priority: 1,
//     phase: 1,
//   },
//   {
//     id: 'm3',
//     key: 'community',
//     label: 'Community Portal',
//     icon: 'people',
//     path: '/community',
//     priority: 1,
//     phase: 1,
//   },
//   {
//     id: 'm4',
//     key: 'forecast-chart',
//     label: 'Forecast vs Observed',
//     icon: 'chart-line',
//     path: '/forecast-chart',
//     priority: 2,
//     phase: 2,
//   },
//   {
//     id: 'm5',
//     key: 'basin-dashboard',
//     label: 'Basin Dashboard',
//     icon: 'map',
//     path: '/basin-dashboard',
//     priority: 2,
//     phase: 2,
//   },
//   {
//     id: 'm6',
//     key: 'alert-engine',
//     label: 'Alert Engine',
//     icon: 'bell',
//     path: '/alert-engine',
//     priority: 3,
//     phase: 3,
//   },
//   {
//     id: 'm7',
//     key: 'forecast-map',
//     label: 'Forecast Map',
//     icon: 'layers',
//     path: '/forecast-map',
//     priority: 3,
//     phase: 3,
//   },
//   {
//     id: 'm8',
//     key: 'hydromet',
//     label: 'Hydromet Analysis',
//     icon: 'rain',
//     path: '/hydromet',
//     priority: 3,
//     phase: 3,
//   },
//   {
//     id: 'm9',
//     key: 'ai-assistant',
//     label: 'AI Assistant',
//     icon: 'sparkles',
//     path: '/ai-assistant',
//     priority: 3,
//     phase: 3,
//   },
// ]

// src/config.js  (excerpt — merge into your existing MODULES export)
//
// The sidebar now reads `children` on a module. If a module has a
// `children` array, it renders as an expandable parent and its own
// `path` is not linked directly. Modules without `children` behave
// exactly as before (standalone links).

export const MODULES = [

  // ── Parent: Basin Dashboard ──────────────────────────────────
  {
    id: 'm5',
    label: 'Basin Dashboard',
    phase: 1,
    children: [
      { id: 'm5-overview', label: 'Overview',           path: '/basin-dashboard/overview' },
      { id: 'm5-map',      label: 'State & Basin Map',  path: '/basin-dashboard/map' },
      { id: 'm5-river',    label: 'River Gauges',       path: '/basin-dashboard/river-gauges' },
      { id: 'm5-rain',     label: 'Rain Gauges',        path: '/basin-dashboard/rain-gauges' },
    ],
  },

  // ── Parent: Forecast & Discharge ────────────────────────────
  {
    id: 'm4',
    label: 'Forecast & Discharge',
    phase: 1,
    children: [
      { id: 'm4-forecast', label: 'Forecast vs Observed', path: '/forecast-discharge/forecast-vs-observed' },
      { id: 'm4-discharge', label: 'Discharge',            path: '/forecast-discharge/discharge' },
    ],
  },


  {
    id: 'm11',
    label: 'Gauge Management',
    phase: 1,
    children: [
      { id: 'm11-fleet', label: 'fleet operation', path: '/gauge-management/fleet-operation' },
      // { id: 'm4-discharge', label: 'Discharge',            path: '/forecast-discharge/discharge' },
    ],
  },


  {
    id: 'm12',
    label: 'Historical Data',
    phase: 1,
    children: [
      { id: 'm12-fleet', label: 'Historical Data', path: '/historical-data/history' },
      // { id: 'm4-discharge', label: 'Discharge',            path: '/forecast-discharge/discharge' },
    ],
  },


  {
    id: 'm13',
    label: 'Impact Forecast',
    phase: 1,
    children: [
      { id: 'm13-fleet', label: 'Impact Forecast', path: '/impact-forecast/impact' },
      // { id: 'm4-discharge', label: 'Discharge',            path: '/forecast-discharge/discharge' },
    ],
  },

  // ── Parent: Alert Engine ─────────────────────────────────────
  {
    id: 'm6',
    label: 'Alert Engine',
    phase: 1,
    children: [
      { id: 'm6-live',     label: 'Live Alerts', path: '/alert-engine/live' },
      { id: 'm6-advisory', label: 'Advisory',    path: '/alert-engine/advisory' },
    ],
  },

  // ── Parent: Flood Forecast Map ───────────────────────────────
  {
    id: 'm7',
    label: 'Flood Forecast Map',
    phase: 1,
    children: [
      { id: 'm7-live',       label: 'Live Forecast',         path: '/flood-forecast-map/live' },
      { id: 'm7-historical', label: 'Historical Flood Maps', path: '/flood-forecast-map/historical' },
    ],
  },

  // ── Standalone items ─────────────────────────────────────────
  { id: 'm1', 
    label: 'Reservoir Anomaly', 
    // path: '/reservoir-anomaly', 
    phase: 2,
    children: [
        { id: 'm1-live',       label: 'Reservior Mgmt',         path: '/Reservoir-Anomaly-map/mgmt' },
        // { id: 'm7-historical', label: 'Historical Flood Maps', path: '/flood-forecast-map/historical' },
      ],
   },
  { id: 'm2', label: 'Public Data API',   path: '/public-data-api',   phase: 2 },
  { id: 'm3', label: 'Community Portal',  path: '/community-portal',  phase: 2 },



  // ── Standalone items ─────────────────────────────────────────
  { id: 'm8',  label: 'Hydromet Analysis', path: '/hydromet-analysis', phase: 3 },
  { id: 'm9',  label: 'AI Assistant',      path: '/ai-assistant',      phase: 3 },
  { id: 'm10', label: 'Reports & Archive', path: '/reports-archive',  phase: 3 },
]