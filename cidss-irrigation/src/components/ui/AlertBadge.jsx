// src/components/ui/AlertBadge.jsx
import { ALERT_LEVELS } from '@/config'

export default function AlertBadge({ level }) {
  const def = ALERT_LEVELS[level] || ALERT_LEVELS.NORMAL
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: def.bg,
      color: def.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: def.color }} />
      {def.label}
    </span>
  )
}
