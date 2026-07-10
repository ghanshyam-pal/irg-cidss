// src/config/index.js

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
export const WS_URL       = import.meta.env.VITE_WS_URL  || 'ws://localhost:4000'

export const ALERT_LEVELS = {
  NORMAL:      { label: 'Normal',      color: '#22c55e', bg: '#dcfce7' },
  ALERT:       { label: 'Alert',       color: '#eab308', bg: '#fef9c3' },
  MINOR_FLOOD: { label: 'Minor Flood', color: '#f97316', bg: '#ffedd5' },
  MAJOR_FLOOD: { label: 'Major Flood', color: '#ef4444', bg: '#fee2e2' },
  CRITICAL:    { label: 'Critical',    color: '#7f1d1d', bg: '#fca5a5' },
}

export const MODULES = [
  {
    id: 'basin-dashboard',
    label: 'Basin Dashboard',
    icon: 'dashboard',
    children: [
      { id: 'm5-overview', label: 'Overview', path: '/basin-dashboard/overview' },
      { id: 'm5-river',    label: 'River Gauges', path: '/basin-dashboard/river-gauges' },
      { id: 'm5-rain',     label: 'Rain Gauges', path: '/basin-dashboard/rain-gauges' },
    ],
  },
  {
    id: 'gauge-management',
    label: 'Gauge Management',
    icon: 'settings',
    children: [
      { id: 'm11-fleet', label: 'Fleet Operation', path: '/gauge-management/fleet-operation' },
    ],
  },
  {
    id: 'historical-data',
    label: 'Historical Data',
    icon: 'history',
    children: [
      { id: 'm12-fleet', label: 'Historical Archive', path: '/historical-data/history' },
    ],
  },
  {
    id: 'impact-forecast',
    label: 'Impact Forecast',
    icon: 'layers',
    children: [
      { id: 'm13-fleet', label: 'Impact Forecast', path: '/impact-forecast/impact' },
    ],
  },
  {
    id: 'forecast-discharge',
    label: 'Forecast & Discharge',
    icon: 'trending',
    children: [
      { id: 'm4-forecast', label: 'Forecast vs Observed', path: '/forecast-discharge/forecast-vs-observed' },
      { id: 'm4-discharge', label: 'Discharge Data', path: '/forecast-discharge/discharge' },
    ],
  },
  {
    id: 'alert-engine',
    label: 'Alert Engine',
    icon: 'bell',
    children: [
      { id: 'm6-live',     label: 'Live Alerts', path: '/alert-engine/live' },
      { id: 'm6-advisory', label: 'Advisories', path: '/alert-engine/advisory' },
    ],
  },
  {
    id: 'flood-map',
    label: 'Flood Forecast Map',
    icon: 'map',
    children: [
      { id: 'm7-live',       label: 'Live Forecast Maps', path: '/flood-forecast-map/live' },
      { id: 'm7-historical', label: 'Historical Maps', path: '/flood-forecast-map/historical' },
    ],
  },
  { 
    id: 'reservoir-anomaly', 
    label: 'Reservoir Anomaly', 
    icon: 'activity',
    children: [
      { id: 'm1-live', label: 'Reservior Management', path: '/Reservoir-Anomaly-map/mgmt' },
    ],
  },
  { id: 'public-api', label: 'Public Data API', path: '/public-data-api', icon: 'terminal' },
  { id: 'portal', label: 'Community Portal', path: '/community-portal', icon: 'users' },
  { id: 'hydromet', label: 'Hydromet Analysis', path: '/hydromet-analysis', icon: 'cloud' },
  { id: 'ai-assistant', label: 'AI Assistant', path: '/ai-assistant', icon: 'cpu' },
  { id: 'reports', label: 'Reports & Archive', path: '/reports-archive', icon: 'file' },
]