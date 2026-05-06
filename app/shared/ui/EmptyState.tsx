import { T, FONT } from '../tokens'

interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({ title = 'Нет данных', description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        color: T.textDim,
        fontFamily: FONT,
        gap: 8,
        border: `1px dashed ${T.border2}`,
        borderRadius: 12,
        background: T.surface,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: T.textMute }}>{title}</div>
      {description && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{description}</div>}
    </div>
  )
}
