import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Badge } from '../shared/ui/Badge'
import { Avatar } from '../shared/ui/Avatar'
import { Spinner } from '../shared/ui/Spinner'
import { ErrorState } from '../shared/ui/ErrorState'
import { Icons } from '../shared/ui/icons'
import type { Cleaner, Review } from '../shared/types'

export function meta() {
  return [{ title: 'Обзор — Мой подъезд' }]
}

function TopBar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ height: 60, padding: '0 24px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, background: T.bg }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ height: 34, width: 240, padding: '0 12px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textDim }}>
        {Icons.search}
        <span>Поиск…</span>
      </div>
      <button style={{ width: 34, height: 34, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        {Icons.bell}
        <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: T.bad, border: `1.5px solid ${T.surface}` }} />
      </button>
      {action}
    </div>
  )
}

function MetricCard({ label, value, delta, deltaTone, sub, accentValue }: { label: string; value: string; delta?: string; deltaTone?: 'good' | 'bad' | 'neutral'; sub?: string; accentValue?: string }) {
  const tones = { good: T.good, bad: T.bad, neutral: T.textMute }
  return (
    <div style={{ flex: 1, minWidth: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: T.textMute, fontWeight: 500, fontFamily: FONT }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.8, color: accentValue ?? T.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: FONT }}>{value}</span>
        {delta && <span style={{ fontSize: 12, fontWeight: 600, color: deltaTone ? tones[deltaTone] : T.textMute, fontFamily: FONT }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: T.textDim, fontFamily: FONT }}>{sub}</div>}
    </div>
  )
}

function ReviewRow({ review }: { review: Review }) {
  const time = new Date(review.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const tone = review.rating === 'good' ? 'good' : review.rating === 'ok' ? 'ok' : 'bad'
  const label = review.rating === 'good' ? 'Хорошо' : review.rating === 'ok' ? 'Норм' : 'Плохо'
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${T.divider}` }}>
      <div style={{ width: 56, height: 56, borderRadius: 8, background: T.bg2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Badge variant={tone}>{label}</Badge>
          <span style={{ fontSize: 12, color: T.textMute, fontWeight: 500, fontFamily: FONT }}>
            {review.address ? `${review.address} · ` : ''}подъезд {review.entrance} · эт. {review.floor}
          </span>
          <span style={{ fontSize: 12, color: T.textDim, marginLeft: 'auto', fontFamily: FONT }}>{time}</span>
        </div>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.4, marginBottom: 4, fontFamily: FONT }}>{review.comment || '—'}</div>
        {review.cleanerName && <div style={{ fontSize: 11.5, color: T.textDim, fontFamily: FONT }}>уборщица — {review.cleanerName}</div>}
      </div>
    </div>
  )
}

function CleanerRow({ cleaner }: { cleaner: Cleaner }) {
  const tone = cleaner.status === 'done' ? 'done' : cleaner.status === 'in_progress' ? 'in_progress' : 'not_started'
  const label = cleaner.status === 'done' ? 'Готово' : cleaner.status === 'in_progress' ? 'В работе' : 'Не начала'
  const lastTime = cleaner.lastCleaningAt
    ? new Date(cleaner.lastCleaningAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : '—'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: `1px solid ${T.divider}` }}>
      <Avatar name={cleaner.name} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.text, fontFamily: FONT }}>{cleaner.name}</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 1, fontFamily: FONT }}>{cleaner.address}</div>
      </div>
      <div style={{ fontSize: 11, color: T.textMute, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontFamily: FONT }}>
        <div>{cleaner.floorsCompleted}/{cleaner.floorsTotal}</div>
        <div style={{ color: T.textDim }}>{lastTime}</div>
      </div>
      <Badge variant={tone}>{label}</Badge>
      {cleaner.badReviewsToday > 0 && (
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: T.bad, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
          {cleaner.badReviewsToday}
        </span>
      )}
    </div>
  )
}

export default observer(function ManagerOverview() {
  const { manager } = useStore()

  useEffect(() => {
    manager.loadOverview()
  }, [])

  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <>
      <TopBar title="Обзор" subtitle={today} />
      <div style={{ flex: 1, padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {manager.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
        ) : manager.error ? (
          <ErrorState message={manager.error} onRetry={() => manager.loadOverview()} />
        ) : (
          <>
            {/* Metrics */}
            <div style={{ display: 'flex', gap: 12 }}>
              <MetricCard label="Уборок сегодня" value={String(manager.metrics?.cleaningsDone ?? 0)} delta={`из ${manager.metrics?.cleaningsPlanned ?? 0}`} deltaTone="neutral" />
              <MetricCard label="Отзывов" value={String(manager.metrics?.reviewsTotal ?? 0)} sub={`плохих — ${manager.metrics?.reviewsBad ?? 0}`} />
              <MetricCard label="Активных уборщиц" value={String(manager.metrics?.activecleaners ?? 0)} sub={`из ${manager.cleaners.length} всего`} />
              <MetricCard label="Хороших отзывов" value={`${manager.metrics?.weeklyAvgRating ?? 0}%`} sub="за неделю" accentValue={T.good} />
              <MetricCard label="Жалоб" value={String(manager.metrics?.reviewsBad ?? 0)} sub="требуют внимания" accentValue={manager.metrics?.reviewsBad ? T.bad : undefined} />
            </div>

            {/* Two columns */}
            <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
              {/* Bad reviews */}
              <div style={{ flex: 1.4, minWidth: 0, display: 'flex', flexDirection: 'column', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.divider}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>Требуют внимания</span>
                    {manager.badReviews.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: T.badSoft, color: T.bad, fontFamily: FONT }}>
                        {manager.badReviews.length}
                      </span>
                    )}
                  </div>
                  <a href="/manager/reviews" style={{ fontSize: 12, color: T.accent, cursor: 'pointer', fontWeight: 500, fontFamily: FONT, textDecoration: 'none' }}>все отзывы →</a>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {manager.badReviews.length === 0
                    ? <div style={{ padding: 24, fontSize: 13, color: T.textDim, fontFamily: FONT, textAlign: 'center' }}>Нет жалоб</div>
                    : manager.badReviews.map((r) => <ReviewRow key={r.id} review={r} />)
                  }
                </div>
              </div>

              {/* Cleaners */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.divider}`, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>Уборщицы · {manager.cleaners.length}</span>
                  <a href="/manager/cleaners" style={{ fontSize: 12, color: T.accent, cursor: 'pointer', fontWeight: 500, fontFamily: FONT, textDecoration: 'none' }}>все →</a>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {manager.cleaners.map((c) => <CleanerRow key={c.id} cleaner={c} />)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
})
