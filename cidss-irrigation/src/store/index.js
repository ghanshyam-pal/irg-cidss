// src/store/index.js
// Zustand global store — slices: auth, gauges, alerts
// Each module can also keep its own local Zustand store in modules/<m>/store.js

import { create } from 'zustand'

// ─── Auth slice ───────────────────────────────────────────────────────────────
const authSlice = (set) => ({
  user: null,
  token: localStorage.getItem('cidss_token') || null,
  isAuthenticated: !!localStorage.getItem('cidss_token'),

  setUser: (user) => set({ user }),

  login: (token, user) => {
    localStorage.setItem('cidss_token', token)
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('cidss_token')
    set({ token: null, user: null, isAuthenticated: false })
  },
})

// ─── Live gauge slice (fed by WebSocket) ────────────────────────────────────
const gaugeSlice = (set) => ({
  gauges: {},           // { [gaugeId]: { level, status, updatedAt } }
  lastSync: null,

  updateGauge: (gaugeId, data) =>
    set((state) => ({
      gauges: { ...state.gauges, [gaugeId]: data },
      lastSync: new Date().toISOString(),
    })),

  setAllGauges: (allGauges) =>
    set({ gauges: allGauges, lastSync: new Date().toISOString() }),
})

// ─── Alert slice ──────────────────────────────────────────────────────────────
const alertSlice = (set) => ({
  activeAlerts: [],

  addAlert: (alert) =>
    set((state) => ({
      activeAlerts: [alert, ...state.activeAlerts].slice(0, 100),
    })),

  clearAlert: (alertId) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.filter((a) => a.id !== alertId),
    })),
})

// ─── Compose all slices ───────────────────────────────────────────────────────
export const useStore = create((set, get) => ({
  ...authSlice(set),
  ...gaugeSlice(set),
  ...alertSlice(set),
}))
