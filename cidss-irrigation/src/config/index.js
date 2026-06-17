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
export const MODULES = [
  {
    id: 'm1',
    key: 'reservoir-anomaly',
    label: 'Reservoir Anomaly',
    icon: 'gauge',
    path: '/reservoir-anomaly',
    priority: 1,
    phase: 1,
  },
  {
    id: 'm2',
    key: 'public-api',
    label: 'Public Data API',
    icon: 'api',
    path: '/public-api',
    priority: 1,
    phase: 1,
  },
  {
    id: 'm3',
    key: 'community',
    label: 'Community Portal',
    icon: 'people',
    path: '/community',
    priority: 1,
    phase: 1,
  },
  {
    id: 'm4',
    key: 'forecast-chart',
    label: 'Forecast vs Observed',
    icon: 'chart-line',
    path: '/forecast-chart',
    priority: 2,
    phase: 2,
  },
  {
    id: 'm5',
    key: 'basin-dashboard',
    label: 'Basin Dashboard',
    icon: 'map',
    path: '/basin-dashboard',
    priority: 2,
    phase: 2,
  },
  {
    id: 'm6',
    key: 'alert-engine',
    label: 'Alert Engine',
    icon: 'bell',
    path: '/alert-engine',
    priority: 3,
    phase: 3,
  },
  {
    id: 'm7',
    key: 'forecast-map',
    label: 'Forecast Map',
    icon: 'layers',
    path: '/forecast-map',
    priority: 3,
    phase: 3,
  },
  {
    id: 'm8',
    key: 'hydromet',
    label: 'Hydromet Analysis',
    icon: 'rain',
    path: '/hydromet',
    priority: 3,
    phase: 3,
  },
  {
    id: 'm9',
    key: 'ai-assistant',
    label: 'AI Assistant',
    icon: 'sparkles',
    path: '/ai-assistant',
    priority: 3,
    phase: 3,
  },
]
