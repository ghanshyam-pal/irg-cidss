// src/modules/m5-basin-dashboard/index.jsx
// Design selector — wraps Design 1, 2, 3

import { useState, Suspense, lazy } from 'react'
import PageLoader from '@/components/ui/PageLoader'

const Design1 = lazy(() => import('./designs/Design1'))
const Design2 = lazy(() => import('./designs/Design2'))
const Design3 = lazy(() => import('./designs/Design3'))

const DESIGNS = [
  { id: 1, label: 'Design 1',    sub: 'Professional Light',     Component: Design1 },
  { id: 2, label: 'Design 2',    sub: 'Dark Operational',       Component: Design2 },
  { id: 3, label: 'Design 3',    sub: 'Map-First (ArcGIS-style)', Component: Design3 },
]

export default function M5BasinDashboardPage() {
  const [active, setActive] = useState(1)
  const current = DESIGNS.find(d => d.id === active)
  const { Component } = current

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: '-24px', overflow: 'hidden' }}>

      {/* Design switcher bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px', display: 'flex', alignItems: 'center',
        gap: 16, flexShrink: 0, zIndex: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Dashboard Design
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              style={{
                padding: '6px 16px', fontSize: 12, fontWeight: 600,
                borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
                background: active === d.id ? '#2563eb' : '#f8fafc',
                color: active === d.id ? '#fff' : '#64748b',
                border: active === d.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                boxShadow: active === d.id ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              {d.label}
              <span style={{
                fontSize: 10, marginLeft: 6, fontWeight: 400, opacity: 0.8,
              }}>
                {d.sub}
              </span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
          
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<PageLoader />}>
          <Component />
        </Suspense>
      </div>
    </div>
  )
}