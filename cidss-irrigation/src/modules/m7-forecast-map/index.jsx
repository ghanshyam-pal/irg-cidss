// src/modules/m7-forecast-map/index.jsx
// M7 — Flood Forecast Map
// Priority 3 · Phase 3
//
// This is a scaffold stub — replace with real implementation.

export default function M7ForecastMapPage() {
  return (
    <div style={ padding: 0 }>
      <div style={
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: 16,
        marginBottom: 24,
      }>
        <h1 style={ fontSize: 20, fontWeight: 600, color: '#1e293b', margin: 0 }>
          M7 — Flood Forecast Map
        </h1>
        <p style={ fontSize: 13, color: '#64748b', marginTop: 4 }>Priority 3 · Phase 3</p>
      </div>

      <div style={
        background: '#f8fafc',
        border: '2px dashed #cbd5e1',
        borderRadius: 10,
        padding: 48,
        textAlign: 'center',
        color: '#94a3b8',
      }>
        <p style={ fontSize: 15, fontWeight: 500, marginBottom: 6 }>Module not yet built</p>
        <p style={ fontSize: 13 }>Interactive Leaflet map with TIFF/HDF raster overlays and a time-slider.</p>
      </div>
    </div>
  )
}
