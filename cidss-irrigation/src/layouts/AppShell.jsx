import { useState, useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULES } from '@/config'
import { useStore } from '@/store'
import styles from './AppShell.module.css'

// Premium Inline SVGs replacing system emojis
const SidebarIcons = ({ name }) => {
  const icons = {
    dashboard: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    settings: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    history: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    layers: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
    trending: <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    bell: <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    map: <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    activity: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />,
    terminal: <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    users: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    cloud: <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    cpu: <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />,
    file: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  }
  return (
    <svg className={styles.iconSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {icons[name] || <path d="M4 6h16M4 12h16M4 18h16" />}
    </svg>
  )
}

export default function AppShell() {
  const { i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const user = useStore((s) => s.user)
  const logout = useStore((s) => s.logout)

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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('cidss_lang', lng)
  }

  const currentModule = useMemo(() => {
    for (const mod of MODULES) {
      if (mod.children) {
        const child = mod.children.find((c) => location.pathname.startsWith(c.path))
        if (child) return { ...child, parentLabel: mod.label }
      } else if (mod.path && location.pathname.startsWith(mod.path)) {
        return mod
      }
    }
    return null
  }, [location.pathname])

  const pageTitle = currentModule?.label || 'Irrigation Control System'
  const pageParentLabel = currentModule?.parentLabel
  const initials = (user?.name || 'Op').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`${styles.shell} ${sidebarOpen ? styles.open : styles.collapsed}`}>
      
      {/* ── Sidebar Component ── */}
      <aside className={styles.sidebar}>
        
        {/* Header/Brand Section */}
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>CIDSS Terminal</span>
              <span className={styles.brandSub}>Sri Lanka Irrigation</span>
            </div>
          )}
        </div>

        {/* Dynamic Telemetry Status */}
        {sidebarOpen && (
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>Network Active • 47 Stations Online</span>
          </div>
        )}

        {/* System Module Actions Navigation */}
        <nav className={styles.nav}>
          {MODULES.map((mod) => {
            const hasChildren = Array.isArray(mod.children) && mod.children.length > 0
            const isExpanded = !!expanded[mod.id]
            const isParentActive = hasChildren && mod.children.some((c) => location.pathname.startsWith(c.path))

            if (!hasChildren) {
              return (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={!sidebarOpen ? mod.label : undefined}
                >
                  <span className={styles.navIcon}><SidebarIcons name={mod.icon} /></span>
                  {sidebarOpen && <span className={styles.navLabel}>{mod.label}</span>}
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
                >
                  <span className={styles.navIcon}><SidebarIcons name={mod.icon} /></span>
                  {sidebarOpen && <span className={styles.navLabel}>{mod.label}</span>}
                  {sidebarOpen && (
                    <span className={`${styles.navChevron} ${isExpanded ? styles.chevronOpen : ''}`}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  )}
                </button>

                {sidebarOpen && (
                  <div
                    className={styles.navChildren}
                    style={{ maxHeight: isExpanded ? `${mod.children.length * 38 + 8}px` : '0px' }}
                  >
                    {mod.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        className={({ isActive }) => `${styles.navChildItem} ${isActive ? styles.activeChild : ''}`}
                      >
                        <span className={styles.navChildLabel}>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer Configuration / Identity Profile */}
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>{initials}</div>
          {sidebarOpen && (
            <div className={styles.userInfo}>
              <div className={styles.userNameSide}>{user?.name || 'Operator'}</div>
              <div className={styles.userRole}>Hydrologist Desk</div>
            </div>
          )}
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '❮' : '❯'}
          </button>
        </div>
      </aside>

      {/* ── Context View Framework ── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {pageParentLabel && (
                <>
                  <span className={styles.pageTitleParent}>{pageParentLabel}</span>
                  <span className={styles.pageTitleSep}>/</span>
                </>
              )}
              {pageTitle}
            </h1>
          </div>

          <div className={styles.headerActions}>
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
            <div className={styles.userMenuHeader} onClick={logout} title="Sign Out Systems">
              <div className={styles.headerAvatar}>{initials}</div>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}