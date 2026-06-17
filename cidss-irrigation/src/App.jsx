// src/App.jsx
// Route definitions — all module pages are lazy-loaded (code splitting)

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/layouts/AppShell'
import PageLoader from '@/components/ui/PageLoader'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Lazy-loaded module pages
// const ReservoirAnomalyPage  = lazy(() => import('@/modules/m1-reservoir'))
// const PublicApiPage         = lazy(() => import('@/modules/m2-public-api'))
// const CommunityPage         = lazy(() => import('@/modules/m3-community'))
// const ForecastChartPage     = lazy(() => import('@/modules/m4-forecast-chart'))
const BasinDashboardPage    = lazy(() => import('@/modules/basin-dashboard'))
// const AlertEnginePage       = lazy(() => import('@/modules/m6-alert-engine'))
// const ForecastMapPage       = lazy(() => import('@/modules/m7-forecast-map'))
// const HydroMetPage          = lazy(() => import('@/modules/m8-hydromet'))
// const AiAssistantPage       = lazy(() => import('@/modules/m9-ai-assistant'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all inside AppShell */}
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/basin-dashboard" replace />} />
            {/* <Route path="reservoir-anomaly" element={<ReservoirAnomalyPage />} />
            <Route path="public-api"        element={<PublicApiPage />} />
            <Route path="community"         element={<CommunityPage />} />
            <Route path="forecast-chart"    element={<ForecastChartPage />} /> */}
            <Route path="basin-dashboard"   element={<BasinDashboardPage />} />
            {/* <Route path="alert-engine"      element={<AlertEnginePage />} />
            <Route path="forecast-map"      element={<ForecastMapPage />} />
            <Route path="hydromet"          element={<HydroMetPage />} />
            <Route path="ai-assistant"      element={<AiAssistantPage />} /> */}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
