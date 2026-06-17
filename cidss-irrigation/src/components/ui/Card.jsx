// src/components/ui/Card.jsx
import styles from './Card.module.css'

export default function Card({ title, subtitle, children, action, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {(title || action) && (
        <div className={styles.header}>
          <div>
            {title    && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
