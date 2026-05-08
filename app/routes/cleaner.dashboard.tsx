import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Avatar } from '../shared/ui/Avatar'
import { PhotoUpload } from '../shared/ui/PhotoUpload'
import { Spinner } from '../shared/ui/Spinner'
import { EmptyState } from '../shared/ui/EmptyState'
import { ErrorState } from '../shared/ui/ErrorState'
import { Icons } from '../shared/ui/icons'
import type { CleaningRecord } from '../shared/types'

// ── Manual capture modal ───────────────────────────────────────────

function CaptureModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void
  onSubmit: (floor: number, photo: File) => void
  isSubmitting: boolean
}) {
  const [floor, setFloor] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [err, setErr] = useState('')

  const canSubmit = floor.trim() !== '' && Number.isFinite(parseInt(floor, 10)) && parseInt(floor, 10) >= 1 && photo !== null && !isSubmitting

  const submit = () => {
    const f = parseInt(floor, 10)
    if (!Number.isFinite(f) || f < 1) { setErr('Укажите этаж'); return }
    if (!photo) { setErr('Прикрепите фото'); return }
    onSubmit(f, photo)
  }

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
        <input
          type="number"
          min={1}
          value={floor}
          onChange={(e) => { setFloor(e.target.value); setErr('') }}
          placeholder="Номер этажа"
          style={{
            width: '100%', fontSize: 22, fontWeight: 700, padding: '12px 16px',
            border: `1.5px solid ${T.border}`, borderRadius: 12,
            background: T.surface, color: T.text, fontFamily: FONT,
            marginBottom: 24, boxSizing: 'border-box',
          }}
        />

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT, marginBottom: 10 }}>
          Фото после уборки
        </div>
        <PhotoUpload value={photo} onChange={setPhoto} label="Сфотографировать" />

        {err && <div style={{ marginTop: 10, fontSize: 13, color: T.bad, fontFamily: FONT }}>{err}</div>}

        <div style={{ flex: 1 }} />

        <Button
          full
          size="lg"
          disabled={!canSubmit}
          onClick={submit}
          style={{ height: 56, fontSize: 17, borderRadius: 14, marginBottom: 24, marginTop: 24 }}
        >
          {isSubmitting ? <Spinner size={18} color="#373C46" /> : 'Отправить'}
        </Button>
      </div>
    </div>
  )
}

// ── Record card ────────────────────────────────────────────────────

function RecordCard({ rec }: { rec: CleaningRecord }) {
  const time = new Date(rec.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const addressLine = rec.address
    ? rec.address
    : rec.entranceId
      ? `Подъезд ${rec.entranceNumber ?? '—'}`
      : '—'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
      {rec.photoUrl ? (
        <img src={rec.photoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: 8, background: T.bg2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.textDim, fontFamily: FONT }}>
          эт.{rec.floor}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: FONT }}>
          Этаж {rec.floor}
        </div>
        <div style={{ fontSize: 12, color: T.textMute, marginTop: 2, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {addressLine} · {time}
        </div>
      </div>
      <span style={{ color: T.good, display: 'flex', flexShrink: 0 }}>{Icons.check}</span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Avatar name={auth.userName} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2, color: T.text }}>{auth.userName}</div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 2, fontFamily: FONT }}>Сегодня · {today}</div>
          </div>
          <button
            type="button"
            onClick={() => { auth.logout(); navigate('/cleaner/login') }}
            style={{ fontSize: 12, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
          >
            Выйти
          </button>
        </div>

        {/* QR hint card */}
        <div style={{
          borderRadius: 16, background: T.accent, color: '#373C46',
          padding: '20px 20px', marginBottom: 12,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {Icons.navQr}
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Сканируйте QR в подъезде</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Откройте камеру → наведите на QR → загрузите фото</div>
            </div>
          </div>
        </div>

        {/* Manual button */}
        <button
          type="button"
          onClick={() => setShowCapture(true)}
          style={{
            height: 56, borderRadius: 14,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.textMute, fontSize: 15, fontWeight: 600,
            fontFamily: FONT, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            gap: 8, cursor: 'pointer', marginBottom: 24,
          }}
        >
          <span style={{ color: T.textDim, display: 'flex' }}>{Icons.camera}</span>
          Добавить вручную
        </button>

        {submitError && (
          <div style={{ fontSize: 13, color: T.bad, marginBottom: 12, fontFamily: FONT }}>{submitError}</div>
        )}

        {/* Records */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT }}>
            Уборки сегодня · {cleaner.todayRecords.length}
          </div>
        </div>

        {cleaner.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : cleaner.error ? (
          <ErrorState message={cleaner.error} onRetry={() => cleaner.loadToday()} />
        ) : cleaner.todayRecords.length === 0 ? (
          <EmptyState description="Уберите этаж и отметьте через QR-код или кнопку выше." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cleaner.todayRecords.map((rec) => (
              <RecordCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
})
