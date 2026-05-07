import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Badge } from '../shared/ui/Badge'
import { Avatar } from '../shared/ui/Avatar'
import { PhotoUpload } from '../shared/ui/PhotoUpload'
import { Spinner } from '../shared/ui/Spinner'
import { EmptyState } from '../shared/ui/EmptyState'
import { ErrorState } from '../shared/ui/ErrorState'
import { Icons } from '../shared/ui/icons'
import type { CleanerStatus } from '../shared/types'

const FLOORS = [1, 2, 3, 4, 5]

const STATUS_LABEL: Record<CleanerStatus, string> = {
  not_started: 'Не начала',
  in_progress: 'В работе',
  done: 'Готово',
}
const STATUS_TONE: Record<CleanerStatus, 'bad' | 'ok' | 'good'> = {
  not_started: 'bad',
  in_progress: 'ok',
  done: 'good',
}

function CaptureModal({ onClose, onSubmit, isSubmitting }: { onClose: () => void; onSubmit: (floor: number, photo: File) => void; isSubmitting: boolean }) {
  const [floor, setFloor] = useState<number | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)

  const canSubmit = floor !== null && photo !== null && !isSubmitting

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: T.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.text }}>
          {Icons.chevLeft}
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, color: T.text, fontFamily: FONT, marginRight: 36 }}>
          Зафиксировать уборку
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 20px 0', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT, marginBottom: 10 }}>
          Этаж
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {FLOORS.map((f) => {
            const sel = f === floor
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFloor(f)}
                style={{
                  flex: 1, height: 56, borderRadius: 12,
                  background: sel ? T.accent : T.surface,
                  border: `1.5px solid ${sel ? T.accent : T.border}`,
                  color: sel ? '#373C46' : T.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                {f}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT, marginBottom: 10 }}>
          Фото после уборки
        </div>
        <PhotoUpload value={photo} onChange={setPhoto} label="Сфотографировать" />

        <div style={{ flex: 1 }} />

        <Button
          full
          size="lg"
          disabled={!canSubmit}
          onClick={() => floor !== null && photo && onSubmit(floor, photo)}
          style={{ height: 56, fontSize: 17, borderRadius: 14, marginBottom: 24, marginTop: 24 }}
        >
          {isSubmitting ? <Spinner size={18} color="#373C46" /> : 'Отправить'}
        </Button>
      </div>
    </div>
  )
}

export function meta() {
  return [{ title: 'Мой подъезд — уборщица' }]
}

export default observer(function CleanerDashboard() {
  const { auth, cleaner } = useStore()
  const navigate = useNavigate()
  const [showCapture, setShowCapture] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!auth.hasHydrated) return
    if (!auth.isAuthenticated || auth.role !== 'cleaner') {
      navigate('/cleaner/login', { replace: true })
      return
    }
    cleaner.loadToday()
  }, [auth.hasHydrated, auth.isAuthenticated, auth.role])

  const handleSubmit = async (floor: number, photo: File) => {
    setSubmitError('')
    try {
      await cleaner.submitCleaning(floor, photo)
      setShowCapture(false)
    } catch (e: any) {
      setSubmitError(e.message ?? 'Ошибка')
    }
  }

  if (!auth.hasHydrated || !auth.isAuthenticated) return null

  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: T.bg, fontFamily: FONT, color: T.text, display: 'flex', flexDirection: 'column' }}>
      {showCapture && (
        <CaptureModal
          onClose={() => setShowCapture(false)}
          onSubmit={handleSubmit}
          isSubmitting={cleaner.isSubmitting}
        />
      )}

      <div style={{ flex: 1, padding: '20px 20px 0', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Avatar name={auth.userName} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2, color: T.text }}>{auth.userName}</div>
            <div style={{ fontSize: 13, color: T.textMute, marginTop: 2 }}>Подъезд</div>
          </div>
          <button
            type="button"
            onClick={() => { auth.logout(); navigate('/cleaner/login') }}
            style={{ fontSize: 12, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
          >
            Выйти
          </button>
        </div>

        {/* Status */}
        <div style={{ marginTop: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT, marginBottom: 10 }}>
            Сегодня · {today}
          </div>
          <Badge variant={STATUS_TONE[cleaner.status]} style={{ height: 28, fontSize: 13, padding: '0 10px' }}>
            {STATUS_LABEL[cleaner.status]}
          </Badge>
        </div>

        {/* CTA button */}
        {cleaner.status === 'done' ? (
          <div style={{
            height: 116, borderRadius: 16,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.textDim, fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, marginBottom: 24,
          }}>
            Завершено на сегодня
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            style={{
              height: 116, borderRadius: 16, background: T.accent,
              color: '#373C46', border: 'none',
              fontSize: 22, fontWeight: 700, letterSpacing: -0.4,
              fontFamily: FONT, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: 'pointer', marginBottom: 24,
              boxShadow: '0 8px 20px rgba(15,23,42,0.10)',
            }}
          >
            <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Icons.camera}
            </span>
            <span>Отметить уборку</span>
          </button>
        )}

        {submitError && (
          <div style={{ fontSize: 13, color: T.bad, marginBottom: 12 }}>{submitError}</div>
        )}

        {/* Records list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT }}>
            Отметки сегодня · {cleaner.todayRecords.length}
          </div>
          {cleaner.todayRecords.length > 0 && (
            <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>{cleaner.todayRecords.length}/{FLOORS.length} этажей</span>
          )}
        </div>

        {cleaner.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : cleaner.error ? (
          <ErrorState message={cleaner.error} onRetry={() => cleaner.loadToday()} />
        ) : cleaner.todayRecords.length === 0 ? (
          <EmptyState description="Нажмите кнопку выше, чтобы зафиксировать уборку этажа." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...cleaner.todayRecords].reverse().map((rec) => {
              const time = new Date(rec.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  {rec.photoUrl ? (
                    <img src={rec.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: T.bg2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.textDim, fontFamily: FONT }}>
                      эт.{rec.floor}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Этаж {rec.floor}</div>
                    <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>{time} · фото загружено</div>
                  </div>
                  <span style={{ color: T.good, display: 'flex' }}>{Icons.check}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
})
