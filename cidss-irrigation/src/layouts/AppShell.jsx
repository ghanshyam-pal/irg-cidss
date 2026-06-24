// src/layouts/AppShell.jsx
import { useState, useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULES } from '@/config'
import { useStore } from '@/store'
import styles from './AppShell.module.css'

const MODULE_ICONS = {
  m1: '📊', m2: '🔌', m3: '🌍',
  m4: '📈', m5: '🗺️', m6: '🔔',
  m7: '🌊', m8: '🌧️', m9: '🤖', m10: '📄',
}

const PHASE_LABELS = { 1: 'Priority 1', 2: 'Priority 2', 3: 'Priority 3' }

// Which modules / sub-modules have active alerts (demo)
const ALERT_MODULES = {  }
// const ALERT_MODULES = { m5: 3, m6: 7, 'm6-live': 7 }

export default function AppShell() {
  const { t, i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const activeAlerts = useStore((s) => s.activeAlerts)
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)

  // ── Parent/child expand state ──────────────────────────────
  // Track which parent module ids are expanded. A parent whose
  // child route is currently active is auto-expanded on load/route change.
  const findActiveParentId = (mods, pathname) => {
    for (const mod of mods) {
      if (mod.children?.some((c) => pathname.startsWith(c.path))) return mod.id
    }
    return null
  }

  const [expanded, setExpanded] = useState(() => {
    const initial = findActiveParentId(MODULES, location.pathname)
    return initial ? { [initial]: true } : {}
  })

  useEffect(() => {
    const activeParent = findActiveParentId(MODULES, location.pathname)
    if (activeParent) {
      setExpanded((prev) => ({ ...prev, [activeParent]: true }))
    }
  }, [location.pathname])

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const modulesByPhase = useMemo(
    () =>
      MODULES.reduce((acc, mod) => {
        ;(acc[mod.phase] = acc[mod.phase] || []).push(mod)
        return acc
      }, {}),
    []
  )

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('cidss_lang', lng)
  }

  // Current page title from route (checks children too)
  const currentModule = useMemo(() => {
    for (const mod of MODULES) {
      if (mod.children) {
        const child = mod.children.find((c) => location.pathname.startsWith(c.path))
        if (child) return { ...child, parentLabel: mod.label }
      } else if (location.pathname.startsWith(mod.path)) {
        return mod
      }
    }
    return null
  }, [location.pathname])

  const pageTitle = currentModule?.label || 'Irrigation Tools'
  const pageParentLabel = currentModule?.parentLabel

  const initials = (user?.name || 'Operator').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

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
                <span className={styles.navGroupLabel}>{
                  // PHASE_LABELS[phase]
                  }</span>
              )}
              {mods.map((mod) => {
                const hasChildren = Array.isArray(mod.children) && mod.children.length > 0
                const isExpanded = !!expanded[mod.id]
                const isParentActive = hasChildren && mod.children.some((c) => location.pathname.startsWith(c.path))

                if (!hasChildren) {
                  return (
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
                  )
                }

                return (
                  <div key={mod.id} className={styles.navParentBlock}>
                    <button
                      type="button"
                      className={`${styles.navItem} ${styles.navParent} ${isParentActive ? styles.active : ''}`}
                      onClick={() => {
                        if (!sidebarOpen) setSidebarOpen(true)
                        toggleExpanded(mod.id)
                      }}
                      title={!sidebarOpen ? mod.label : undefined}
                      aria-expanded={isExpanded}
                    >
                      <span className={styles.navIcon}>{MODULE_ICONS[mod.id]}</span>
                      {sidebarOpen && <span className={styles.navLabel}>{mod.label}</span>}
                      {sidebarOpen && ALERT_MODULES[mod.id] && !isExpanded && (
                        <span className={styles.navBadge}>{ALERT_MODULES[mod.id]}</span>
                      )}
                      {sidebarOpen && (
                        <span className={`${styles.navChevron} ${isExpanded ? styles.chevronOpen : ''}`}>
                          ▾
                        </span>
                      )}
                    </button>

                    {sidebarOpen && (
                      <div
                        className={styles.navChildren}
                        style={{
                          maxHeight: isExpanded ? `${mod.children.length * 36 + 6}px` : '0px',
                        }}
                      >
                        {mod.children.map((child) => (
                          <NavLink
                            key={child.id}
                            to={child.path}
                            className={({ isActive }) =>
                              `${styles.navChildItem} ${isActive ? styles.activeChild : ''}`
                            }
                          >
                            <span className={styles.navChildDot} />
                            <span className={styles.navChildLabel}>{child.label}</span>
                            {ALERT_MODULES[child.id] && (
                              <span className={styles.navBadgeSmall}>{ALERT_MODULES[child.id]}</span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
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
            <h1 className={styles.pageTitle}>
              {pageParentLabel && (
                <span className={styles.pageTitleParent}>{pageParentLabel} <span className={styles.pageTitleSep}>/</span> </span>
              )}
              {pageTitle}
            </h1>
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