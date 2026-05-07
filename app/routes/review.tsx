import { useParams, useSearchParams } from 'react-router'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { ReviewFormStore } from '../store/ReviewFormStore'
import { useEffect, useState } from 'react'
import { qrApi } from '../shared/api'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { PhotoUpload } from '../shared/ui/PhotoUpload'
import { Spinner } from '../shared/ui/Spinner'
import type { Rating } from '../shared/types'

export function meta() {
  return [{ title: 'Мой подъезд — оценить уборку' }]
}

function FaceIcon({ kind, size = 28, color = 'currentColor' }: { kind: 'good' | 'meh' | 'bad'; size?: number; color?: string }) {
  const sw = 1.8
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11.5" stroke={color} strokeWidth={sw} />
      <circle cx="10" cy="12" r="1.3" fill={color} />
      <circle cx="18" cy="12" r="1.3" fill={color} />
      {kind === 'good' && <path d="M9 17c1.4 2 3 3 5 3s3.6-1 5-3" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />}
      {kind === 'meh' && <path d="M9.5 18h9" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {kind === 'bad' && <path d="M9 19c1.4-2 3-3 5-3s3.6 1 5 3" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />}
    </svg>
  )
}

const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RATINGS: Array<{ id: Rating; label: string; kind: 'bad' | 'meh' | 'good'; fg: string; bg: string; border: string }> = [
  { id: 'bad', label: 'Плохо', kind: 'bad', fg: T.bad, bg: T.badSoft, border: T.bad },
  { id: 'ok', label: 'Норм', kind: 'meh', fg: T.warn, bg: T.warnSoft, border: T.warn },
  { id: 'good', label: 'Хорошо', kind: 'good', fg: T.good, bg: T.goodSoft, border: T.good },
]

const SuccessScreen = () => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 24 }}>
    <div style={{ width: 88, height: 88, borderRadius: '50%', background: T.goodSoft, color: T.good, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M10 20l7 7 14-14" stroke={T.good} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 8, color: T.text }}>Спасибо</div>
      <div style={{ fontSize: 16, color: T.textMute, lineHeight: 1.4 }}>
        Отзыв отправлен.<br />Управляющая компания посмотрит сегодня.
      </div>
    </div>
  </div>
)

const ReviewForm = observer(({ store, entranceId, floor }: { store: ReviewFormStore; entranceId: string; floor: number }) => {
  const addrLabel = `Подъезд · этаж ${floor}`

  return (
    <div style={{ flex: 1, padding: '20px 20px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13, color: T.textDim, fontWeight: 500, letterSpacing: 0.1, marginBottom: 24 }}>
        {addrLabel}
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 8, color: T.text }}>
        Как сегодня<br />убрали подъезд?
      </div>

      <div style={{ marginBottom: 28, padding: '10px 12px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: T.goodSoft, color: T.good, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {checkIcon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: T.textDim, fontWeight: 500 }}>Последняя уборка</div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginTop: 1 }}>
            сегодня, 11:42 <span style={{ color: T.textDim, fontWeight: 500 }}>(2 часа назад)</span>
          </div>
        </div>
      </div>

      {/* Rating tiles — stacked layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {RATINGS.map((r) => {
          const sel = store.rating === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => store.setRating(r.id)}
              style={{
                height: 88,
                borderRadius: 14,
                background: sel ? r.bg : T.surface,
                border: `1.5px solid ${sel ? r.border : T.border}`,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 16,
                padding: '0 24px',
                color: sel ? r.fg : T.text,
                transition: 'background .15s, border-color .15s',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              <FaceIcon kind={r.kind} size={32} color={sel ? r.fg : T.textMute} />
              <span style={{ fontSize: 18, fontWeight: 600, color: sel ? r.fg : T.text }}>{r.label}</span>
            </button>
          )
        })}
      </div>

      {/* Comment + photo — slide in after selection */}
      {store.rating && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'slideDown 240ms cubic-bezier(.2,.7,.3,1)',
          }}
        >
          <textarea
            value={store.comment}
            onChange={(e) => store.setComment(e.target.value)}
            placeholder="Что бы вы хотели добавить? (необязательно)"
            rows={3}
            style={{
              borderRadius: 12,
              background: T.surface,
              border: `1px solid ${T.border}`,
              padding: '12px 14px',
              fontSize: 15,
              color: T.text,
              lineHeight: 1.4,
              fontFamily: FONT,
              resize: 'none',
              outline: 'none',
            }}
          />
          <PhotoUpload value={store.photo} onChange={(f) => store.setPhoto(f)} />
        </div>
      )}

      {store.error && (
        <div style={{ marginTop: 12, fontSize: 13, color: T.bad, fontFamily: FONT }}>
          {store.error}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <Button
        full
        size="lg"
        disabled={!store.canSubmit}
        onClick={() => store.submit(entranceId, floor)}
        style={{ marginBottom: 24, height: 56, fontSize: 17, borderRadius: 14 }}
      >
        {store.isSubmitting ? <Spinner size={18} color="#373C46" /> : 'Отправить'}
      </Button>

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
})

export default observer(function ReviewPage() {
  const { entranceId: pathEntranceId, floor: pathFloor, token } = useParams()
  const [searchParams] = useSearchParams()
  const { reviewForm } = useStore()
  const [resolved, setResolved] = useState<{ entranceId: string; floor: number } | null>(null)
  const [resolving, setResolving] = useState(Boolean(token))
  const [resolveError, setResolveError] = useState('')

  useEffect(() => {
    if (!token) {
      setResolving(false)
      return
    }

    let cancelled = false
    setResolving(true)
    setResolveError('')
    qrApi
      .resolve(token)
      .then((data) => {
        if (!cancelled) setResolved(data)
      })
      .catch(() => {
        if (!cancelled) setResolveError('QR-код не найден или устарел.')
      })
      .finally(() => {
        if (!cancelled) setResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const entranceId = resolved?.entranceId ?? pathEntranceId ?? searchParams.get('entranceId') ?? ''
  const floorRaw = resolved?.floor ?? pathFloor ?? searchParams.get('floor') ?? ''
  const floorNum = Number(floorRaw)
  const isValid = entranceId && !isNaN(floorNum) && floorNum > 0 && floorNum <= 100

  if (resolving) {
    return (
      <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: 24 }}>
        <Spinner size={32} />
      </div>
    )
  }

  if (!isValid) {
    return (
      <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 8 }}>Некорректная ссылка</div>
          <div style={{ fontSize: 15, color: T.textMute }}>{resolveError || 'Проверьте QR-код и попробуйте снова.'}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        maxWidth: 480,
        margin: '0 auto',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {reviewForm.isSubmitted ? <SuccessScreen /> : (
        <ReviewForm store={reviewForm} entranceId={entranceId} floor={floorNum} />
      )}
    </div>
  )
})
