// src/layouts/AppShell.jsx
// Main layout wrapper: sidebar navigation + top header + content area

import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULES } from '@/config'
import { useStore } from '@/store'
import styles from './AppShell.module.css'

const PHASE_LABELS = { 1: 'Phase 1', 2: 'Phase 2', 3: 'Phase 3' }

export default function AppShell() {
  const { t, i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const activeAlerts = useStore((s) => s.activeAlerts)
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)

  const modulesByPhase = MODULES.reduce((acc, mod) => {
    ;(acc[mod.phase] = acc[mod.phase] || []).push(mod)
    return acc
  }, {})

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('cidss_lang', lng)
  }

  return (
    <div className={`${styles.shell} ${sidebarOpen ? styles.open : styles.collapsed}`}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="" className={styles.logo} />
          {sidebarOpen && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Irrigation Tools</span>
              <span className={styles.brandSub}>Sri Lanka · CIDSS</span>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {Object.entries(modulesByPhase).map(([phase, mods]) => (
            <div key={phase} className={styles.navGroup}>
              {sidebarOpen && (
                <span className={styles.navGroupLabel}>{PHASE_LABELS[phase]}</span>
              )}
              {mods.map((mod) => (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  title={!sidebarOpen ? mod.label : undefined}
                >
                  <span className={styles.navIcon}>{mod.id.toUpperCase()}</span>
                  {sidebarOpen && <span className={styles.navLabel}>{mod.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </aside>

      {/* ── Main area ── */}
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            Irrigation Department of Sri Lanka
          </h1>

          <div className={styles.headerActions}>
            {/* Language toggle */}
            <div className={styles.langSwitch}>
              {['en', 'si', 'ta'].map((lng) => (
                <button
                  key={lng}
                  className={`${styles.langBtn} ${i18n.language === lng ? styles.activeLang : ''}`}
                  onClick={() => changeLanguage(lng)}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Alert badge */}
            <button className={styles.alertBell} aria-label="Active alerts">
              🔔
              {activeAlerts.length > 0 && (
                <span className={styles.alertBadge}>{activeAlerts.length}</span>
              )}
            </button>

            {/* User */}
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user?.name || 'Operator'}</span>
              <button className={styles.logoutBtn} onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
