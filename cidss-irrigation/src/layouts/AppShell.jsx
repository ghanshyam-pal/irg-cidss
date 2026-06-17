// src/layouts/AppShell.jsx
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULES } from '@/config'
import { useStore } from '@/store'
import styles from './AppShell.module.css'

const MODULE_ICONS = {
  'm1': '📊', 'm2': '🔌', 'm3': '🌍',
  'm4': '📈', 'm5': '🗺️', 'm6': '🔔',
  'm7': '🌊', 'm8': '🌧️', 'm9': '🤖',
}

const PHASE_LABELS = { 1: 'Priority 1', 2: 'Priority 2', 3: 'Priority 3' }

// Which modules have active alerts (demo)
const ALERT_MODULES = { 'm5': 3, 'm6': 7 }

export default function AppShell() {
  const { t, i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
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

  // Current page title from route
  const currentModule = MODULES.find((m) => location.pathname.startsWith(m.path))
  const pageTitle = currentModule?.label || 'Irrigation Tools'

  const initials = (user?.name || 'Operator').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`${styles.shell} ${sidebarOpen ? styles.open : styles.collapsed}`}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoWrap}>💧</div>
          {sidebarOpen && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Irrigation Tools</span>
              <span className={styles.brandSub}>Sri Lanka · CIDSS</span>
            </div>
          )}
        </div>

        {/* Live status pill */}
        {sidebarOpen && (
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>Live · 47 gauges active</span>
          </div>
        )}

        {/* Nav */}
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
                  <span className={styles.navIcon}>{MODULE_ICONS[mod.id]}</span>
                  {sidebarOpen && <span className={styles.navLabel}>{mod.label}</span>}
                  {sidebarOpen && ALERT_MODULES[mod.id] && (
                    <span className={styles.navBadge}>{ALERT_MODULES[mod.id]}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User + collapse */}
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>{initials}</div>
          {sidebarOpen && (
            <div className={styles.userInfo}>
              <div className={styles.userNameSide}>{user?.name || 'Operator'}</div>
              <div className={styles.userRole}>Hydrologist</div>
            </div>
          )}
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            <span className={styles.headerBreadcrumb}>
              Irrigation Department of Sri Lanka
            </span>
          </div>

          <div className={styles.headerActions}>
            {/* Language */}
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

            <div className={styles.headerDivider} />

            {/* Refresh */}
            <button className={styles.headerIconBtn} title="Refresh data">🔄</button>

            {/* Alerts */}
            <button className={styles.headerIconBtn} title="Active alerts">
              🔔
              <span className={styles.alertBadge}>7</span>
            </button>

            <div className={styles.headerDivider} />

            {/* User */}
            <div className={styles.userMenuHeader} onClick={logout} title="Sign out">
              <div className={styles.headerAvatar}>{initials}</div>
              <span className={styles.headerUserName}>{user?.name || 'Operator'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}