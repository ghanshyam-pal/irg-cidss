# CIDSS Irrigation Tools — Frontend

**Irrigation Department of Sri Lanka · Hydrology and Disaster Management Division**

React + Vite application. Production-ready modular scaffold.

---

## Quick start

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # outputs to dist/
```

Set environment variables before running:

```bash
VITE_API_URL=http://localhost:4000/api/v1
VITE_WS_URL=ws://localhost:4000
```

---

## Project structure

```
src/
├── App.jsx                  # Router — all 9 module routes
├── main.jsx                 # Entry point
├── index.css                # Global reset + CSS variables
│
├── config/
│   └── index.js             # API URLs, ALERT_LEVELS, MODULES registry
│
├── layouts/
│   └── AppShell.jsx         # Sidebar nav + header wrapping all pages
│
├── pages/
│   ├── LoginPage.jsx
│   └── NotFoundPage.jsx
│
├── modules/                 # One folder per module — self-contained
│   ├── m1-reservoir/
│   │   ├── index.jsx        # Page root (default export — lazy-loaded)
│   │   ├── components/      # Module-specific components
│   │   └── hooks/           # Module-specific hooks
│   ├── m2-public-api/ …
│   └── …                    # m3 through m9 same pattern
│
├── components/
│   ├── ui/                  # Shared primitives: Card, AlertBadge, PageLoader
│   ├── map/                 # Shared map wrappers (Leaflet, MapLibre)
│   └── chart/               # Shared Recharts wrappers
│
├── hooks/
│   └── useSocket.js         # WebSocket event subscription hook
│
├── services/
│   ├── api.js               # Axios instance (auth interceptors)
│   └── socket.js            # Socket.io singleton
│
├── store/
│   └── index.js             # Zustand — auth, gauges, alerts slices
│
└── i18n/
    ├── index.js
    └── locales/
        ├── en.json
        ├── si.json           # Sinhala
        └── ta.json           # Tamil
```

---

## Module development pattern

Each module is a **self-contained folder**:

```
modules/m1-reservoir/
  index.jsx          ← default export — this is the route page
  components/
    DeviationChart.jsx
    ReservoirCard.jsx
  hooks/
    useReservoirData.js
```

Rules:
- Module pages import from `@/components`, `@/services`, `@/store`, `@/config`
- Modules never import from other modules (avoids coupling)
- Module-specific API calls go in a `services.js` inside the module folder

---

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + Vite |
| Routing | react-router-dom v6 (lazy routes) |
| State | Zustand (global) + local useState per module |
| HTTP | Axios (with JWT interceptor) |
| WebSocket | Socket.io-client |
| Charts | Recharts |
| Map | Leaflet / react-leaflet + MapLibre GL |
| i18n | react-i18next (EN / SI / TA) |
| Styling | CSS Modules |

---

## Priority phases

| Phase | Modules |
|-------|---------|
| 1 (now) | M1 Reservoir Anomaly · M2 Public API · M3 Community Portal |
| 2 | M4 Forecast Chart · M5 Basin Dashboard |
| 3 | M6 Alert Engine · M7 Forecast Map · M8 Hydromet · M9 AI Assistant |
