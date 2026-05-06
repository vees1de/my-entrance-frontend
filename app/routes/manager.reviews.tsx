import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Badge } from '../shared/ui/Badge'
import { Button } from '../shared/ui/Button'
import { Spinner } from '../shared/ui/Spinner'
import { EmptyState } from '../shared/ui/EmptyState'
import { ErrorState } from '../shared/ui/ErrorState'
import { Icons } from '../shared/ui/icons'
import type { Rating } from '../shared/types'

export function meta() {
  return [{ title: 'Отзывы — Мой подъезд' }]
}

function FilterChip({
  label,
  count,
  active,
  color,
  bg,
  onClick,
}: {
  label: string
  count?: number
  active?: boolean
  color: string
  bg: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 30,
        padding: '0 12px',
        borderRadius: 8,
        border: `1px solid ${active ? color : T.border}`,
        background: active ? bg : 'transparent',
        color: active ? color : T.textMute,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      {count != null && <span style={{ fontSize: 11, color: active ? 'inherit' : T.textDim }}>{count}</span>}
    </button>
  )
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      style={{
        height: 30,
        padding: '0 10px',
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        background: T.surface,
        color: T.text,
        fontSize: 13,
        fontFamily: FONT,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      <span style={{ color: T.textDim }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
      <span style={{ color: T.textDim, display: 'flex' }}>{Icons.chev}</span>
    </button>
  )
}

const RATING_LABELS: Record<Rating, string> = { bad: 'Плохо', ok: 'Норм', good: 'Хорошо' }
const RATING_TONE: Record<Rating, 'bad' | 'ok' | 'good'> = { bad: 'bad', ok: 'ok', good: 'good' }

export default observer(function ManagerReviews() {
  const { reviews: store } = useStore()

  useEffect(() => {
    store.loadReviews()
  }, [])

  const badCount = store.reviews.filter((r) => r.rating === 'bad').length
  const okCount = store.reviews.filter((r) => r.rating === 'ok').length
  const goodCount = store.reviews.filter((r) => r.rating === 'good').length

  const toggleRating = (r: Rating) => {
    store.setFilter('rating', store.filters.rating === r ? '' : r)
  }

  return (
    <>
      {/* Top bar */}
      <div style={{ height: 60, padding: '0 24px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: T.text, fontFamily: FONT }}>Отзывы</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1, fontFamily: FONT }}>
            {store.reviews.length} записей
          </div>
        </div>
        <div style={{ height: 34, width: 240, padding: '0 12px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textDim, fontFamily: FONT }}>
          {Icons.search}<span>Поиск…</span>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          {Icons.bell}
          <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: T.bad, border: `1.5px solid ${T.surface}` }} />
        </button>
        <Button kind="ghost" size="sm" leading={Icons.send}>Экспорт</Button>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <FilterChip label="Плохо" count={badCount} active={store.filters.rating === 'bad'} color={T.bad} bg={T.badSoft} onClick={() => toggleRating('bad')} />
          <FilterChip label="Норм" count={okCount} active={store.filters.rating === 'ok'} color={T.warn} bg={T.warnSoft} onClick={() => toggleRating('ok')} />
          <FilterChip label="Хорошо" count={goodCount} active={store.filters.rating === 'good'} color={T.good} bg={T.goodSoft} onClick={() => toggleRating('good')} />
          <div style={{ width: 1, height: 22, background: T.divider, margin: '0 4px' }} />
          <FilterSelect label="Подъезд" value="Все" />
          <FilterSelect label="Уборщица" value="Все" />
          <FilterSelect label="Дата" value="Сегодня" />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>
            Сортировка: <span style={{ color: T.text }}>сначала новые</span>
          </span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, minHeight: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 90px 1fr 200px 1.4fr 110px', padding: '10px 16px', gap: 12, borderBottom: `1px solid ${T.divider}`, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: T.textDim, fontFamily: FONT, flexShrink: 0 }}>
            <div>Время</div>
            <div>Оценка</div>
            <div>Адрес</div>
            <div>Уборщица</div>
            <div>Комментарий</div>
            <div style={{ textAlign: 'right' }}>Действие</div>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {store.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
            ) : store.error ? (
              <ErrorState message={store.error} onRetry={() => store.loadReviews()} />
            ) : store.reviews.length === 0 ? (
              <div style={{ padding: 40 }}><EmptyState title="Нет отзывов" description="Нет записей, соответствующих фильтрам." /></div>
            ) : (
              store.reviews.map((r, i) => {
                const time = new Date(r.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                const date = new Date(r.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
                const tone = RATING_TONE[r.rating]
                const label = RATING_LABELS[r.rating]
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 90px 1fr 200px 1.4fr 110px',
                      padding: '11px 16px',
                      gap: 12,
                      alignItems: 'center',
                      borderBottom: i < store.reviews.length - 1 ? `1px solid ${T.divider}` : 'none',
                      fontSize: 13,
                      fontFamily: FONT,
                    }}
                  >
                    <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <div style={{ color: T.text }}>{time}</div>
                      <div style={{ fontSize: 11, color: T.textDim }}>{date}</div>
                    </div>
                    <div><Badge variant={tone}>{label}</Badge></div>
                    <div style={{ color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Подъезд {r.entrance} · эт. {r.floor}
                    </div>
                    <div style={{ color: T.textMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.cleanerName ?? '—'}</div>
                    <div style={{ color: r.comment ? T.text : T.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.comment || '—'}
                      {r.photoUrl && (
                        <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.bg2, color: T.textMute, fontWeight: 600, border: `1px solid ${T.border}` }}>фото</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {r.rating === 'bad'
                        ? <Button size="sm" style={{ height: 26, padding: '0 10px', fontSize: 12 }}>Ответить</Button>
                        : <Button size="sm" kind="ghost" style={{ height: 26, padding: '0 10px', fontSize: 12 }}>Открыть</Button>
                      }
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
})
