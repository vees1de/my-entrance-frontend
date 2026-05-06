import { T, FONT } from '../tokens'
import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Что-то пошло не так', onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        fontFamily: FONT,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: T.badSoft,
          color: T.bad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        !
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          Ошибка загрузки
        </div>
        <div style={{ fontSize: 13, color: T.textMute }}>{message}</div>
      </div>
      {onRetry && (
        <Button kind="ghost" size="sm" onClick={onRetry}>
          Попробовать снова
        </Button>
      )}
    </div>
  )
}
