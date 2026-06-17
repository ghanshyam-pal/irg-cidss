// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', color: '#64748b',
    }}>
      <p style={{ fontSize: 48, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>404</p>
      <p style={{ fontSize: 16, marginBottom: 20 }}>Page not found</p>
      <Link to="/" style={{ color: '#2563eb', fontSize: 14 }}>
        ← Back to dashboard
      </Link>
    </div>
  )
}
