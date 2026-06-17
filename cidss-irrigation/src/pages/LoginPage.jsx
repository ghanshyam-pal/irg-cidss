// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import api from '@/services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.user)
      navigate('/')
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0d2a4a',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '40px 36px',
        width: 360, boxShadow: '0 20px 60px rgb(0 0 0 / 0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, background: '#1d4ed8', borderRadius: 12,
            margin: '0 auto 12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 22,
          }}>💧</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            Irrigation Tools
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Irrigation Department of Sri Lanka
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 6, padding: '10px 12px', marginBottom: 16,
            fontSize: 13, color: '#dc2626',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={{
              width: '100%', padding: '9px 12px', fontSize: 14,
              border: '1px solid #d1d5db', borderRadius: 6,
              outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="operator@irrigation.gov.lk"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', padding: '9px 12px', fontSize: 14,
              border: '1px solid #d1d5db', borderRadius: 6,
              outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', background: '#1d4ed8',
            color: '#fff', border: 'none', borderRadius: 6,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
