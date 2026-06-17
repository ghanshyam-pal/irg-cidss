// src/components/ui/PageLoader.jsx
export default function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: '10px', color: '#64748b', fontSize: '14px',
    }}>
      <span style={{
        width: 20, height: 20, border: '2px solid #e2e8f0',
        borderTopColor: '#3b82f6', borderRadius: '50%',
        display: 'inline-block', animation: 'spin 0.7s linear infinite',
      }} />
      Loading module…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
