import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { cleaningsApi } from '../shared/api'
import { T, FONT } from '../shared/tokens'
import { Avatar } from '../shared/ui/Avatar'
import { Spinner } from '../shared/ui/Spinner'
import { ErrorState } from '../shared/ui/ErrorState'
import { Icons } from '../shared/ui/icons'
import type { Cleaner, CleaningRecord, CleanerStatus } from '../shared/types'

export function meta() {
  return [{ title: 'Уборщицы — Мой подъезд' }]
}

// ── Helpers ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CleanerStatus, string> = {
  not_started: 'Не начала',
  in_progress: 'В работе',
  done: 'Завершила',
}

const STATUS_COLOR: Record<CleanerStatus, { bg: string; text: string }> = {
  not_started: { bg: T.bg2, text: T.textDim },
  in_progress: { bg: T.warnSoft, text: T.warn },
  done: { bg: T.goodSoft, text: T.good },
}

function fmt(iso: string | undefined, mode: 'time' | 'datetime' = 'time') {
  if (!iso) return '—'
  const d = new Date(iso)
  if (mode === 'time') return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.min(done / total, 1) : 0
  const color = pct >= 1 ? T.good : pct > 0 ? T.warn : T.border2
  return (
    <div style={{ height: 4, borderRadius: 4, background: T.bg2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 4, transition: 'width .4s' }} />
    </div>
  )
}

// ── Cleaner card ───────────────────────────────────────────────────

function CleanerCard({ cleaner, selected, onClick }: { cleaner: Cleaner; selected: boolean; onClick: () => void }) {
  const sc = STATUS_COLOR[cleaner.status]
  const lastTime = fmt(cleaner.lastCleaningAt ?? undefined)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: T.surface,
        border: `1.5px solid ${selected ? T.text : T.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: selected ? `0 0 0 3px rgba(55,60,70,0.08)` : 'none',
      }}
    >
      {/* Photo strip */}
      <div style={{ position: 'relative', width: '100%', height: 130, background: T.bg2, overflow: 'hidden', flexShrink: 0 }}>
        {cleaner.lastPhotoUrl ? (
          <img
            src={cleaner.lastPhotoUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textOff, flexDirection: 'column', gap: 6 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 9h3.5l2-3h9l2 3H24a1.5 1.5 0 011.5 1.5v12A1.5 1.5 0 0124 24H4a1.5 1.5 0 01-1.5-1.5v-12A1.5 1.5 0 014 9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="14" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: FONT }}>Нет фото</span>
          </div>
        )}
        {/* Status badge overlay */}
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, fontFamily: FONT, backdropFilter: 'blur(4px)' }}>
          {STATUS_LABEL[cleaner.status]}
        </div>
        {/* Bad reviews badge */}
        {cleaner.badReviewsToday > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 6, background: T.bad, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⚠ {cleaner.badReviewsToday}
          </div>
        )}
        {/* Time of last cleaning */}
        {cleaner.lastCleaningAt && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.45))', color: '#fff', fontSize: 11, fontFamily: FONT, display: 'flex', justifyContent: 'flex-end' }}>
            {lastTime}
          </div>
        )}
      </div>

      {/* Info block */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={cleaner.name} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleaner.name}</div>
            {cleaner.phone && <div style={{ fontSize: 11, color: T.textDim, fontFamily: FONT, marginTop: 1 }}>{cleaner.phone}</div>}
          </div>
        </div>

        {cleaner.address && (
          <div style={{ fontSize: 12, color: T.textMute, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cleaner.address}
          </div>
        )}

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: FONT, marginBottom: 5 }}>
            <span style={{ color: T.textDim }}>Этажи</span>
            <span style={{ fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
              {cleaner.floorsCompleted} / {cleaner.floorsTotal}
            </span>
          </div>
          <ProgressBar done={cleaner.floorsCompleted} total={cleaner.floorsTotal} />
        </div>

        <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: FONT, color: T.textDim }}>
          {cleaner.shift && <span>Смена: <span style={{ color: T.text }}>{cleaner.shift}</span></span>}
          <span>Отзывов: <span style={{ color: T.text }}>{cleaner.totalReviews}</span></span>
        </div>
      </div>
    </button>
  )
}

// ── Detail drawer ──────────────────────────────────────────────────

function PhotoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}
    >
      <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

function CleanerDrawer({ cleaner, onClose }: { cleaner: Cleaner; onClose: () => void }) {
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState<string | null>(null)
  const sc = STATUS_COLOR[cleaner.status]

  useEffect(() => {
    setLoading(true)
    setError('')
    cleaningsApi.getToday(cleaner.id)
      .then(setRecords)
      .catch((e: any) => setError(e?.message ?? 'Ошибка'))
      .finally(() => setLoading(false))
  }, [cleaner.id])

  return (
    <>
      {zoom && <PhotoModal url={zoom} onClose={() => setZoom(null)} />}

      <div style={{ width: 380, borderLeft: `1px solid ${T.divider}`, background: T.surface, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%', overflow: 'hidden' }}>
        {/* Drawer header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.divider}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: 8, background: T.bg2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMute, flexShrink: 0 }}
            >
              {Icons.close}
            </button>
            <Avatar name={cleaner.name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: FONT }}>{cleaner.name}</div>
              {cleaner.phone && <div style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>{cleaner.phone}</div>}
            </div>
          </div>

          {/* Status + progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
              {STATUS_LABEL[cleaner.status]}
            </div>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 700, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
              {cleaner.floorsCompleted} / {cleaner.floorsTotal} этажей
            </span>
            {cleaner.badReviewsToday > 0 && (
              <div style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: 6, background: T.bad, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                ⚠ {cleaner.badReviewsToday} жалоб
              </div>
            )}
          </div>
          <ProgressBar done={cleaner.floorsCompleted} total={cleaner.floorsTotal} />

          {cleaner.address && (
            <div style={{ marginTop: 10, fontSize: 12, color: T.textMute, fontFamily: FONT }}>{cleaner.address}</div>
          )}
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: T.textDim, fontFamily: FONT, marginBottom: 14 }}>
            Уборки сегодня · {records.length}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : error ? (
            <div style={{ fontSize: 13, color: T.bad, fontFamily: FONT }}>{error}</div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.textDim, fontSize: 14, fontFamily: FONT }}>Уборок ещё нет</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {records.map((rec, idx) => {
                const time = fmt(rec.createdAt)
                const addr = rec.address ?? (rec.entranceNumber ? `Подъезд ${rec.entranceNumber}` : '—')
                const isLast = idx === records.length - 1

                return (
                  <div key={rec.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                    {/* Timeline line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.good, border: `2px solid ${T.surface}`, boxShadow: `0 0 0 1.5px ${T.good}`, flexShrink: 0 }} />
                      {!isLast && <div style={{ width: 1.5, flex: 1, background: T.divider, marginTop: 4 }} />}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>
                          Этаж {rec.floor}
                        </span>
                        <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>{time}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.textMute, fontFamily: FONT, marginBottom: rec.photoUrl ? 8 : 0 }}>
                        {addr}
                      </div>
                      {rec.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setZoom(rec.photoUrl)}
                          style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: 10, overflow: 'hidden', display: 'block' }}
                        >
                          <img
                            src={rec.photoUrl}
                            alt={`Этаж ${rec.floor}`}
                            style={{ width: '100%', maxWidth: 300, height: 160, objectFit: 'cover', borderRadius: 10, border: `1px solid ${T.border}`, display: 'block' }}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────

export default observer(function ManagerCleaners() {
  const { cleaners: store } = useStore()
  const [selected, setSelected] = useState<Cleaner | null>(null)
  const [filter, setFilter] = useState<CleanerStatus | 'all'>('all')
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    store.loadAll()
    refreshRef.current = setInterval(() => store.loadAll(), 30_000)
    return () => { if (refreshRef.current) clearInterval(refreshRef.current) }
  }, [])

  // Keep drawer in sync when data refreshes
  useEffect(() => {
    if (selected) {
      const updated = store.cleaners.find((c) => c.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [store.cleaners])

  const filtered = store.cleaners.filter((c) => filter === 'all' || c.status === filter)

  const notStarted = store.cleaners.filter((c) => c.status === 'not_started').length
  const inProgress = store.cleaners.filter((c) => c.status === 'in_progress').length
  const done = store.cleaners.filter((c) => c.status === 'done').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ height: 60, padding: '0 24px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: T.text, fontFamily: FONT }}>Уборщицы</div>
          {!store.isLoading && (
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 1, fontFamily: FONT }}>
              {store.cleaners.length} чел. ·&nbsp;
              <span style={{ color: T.warn }}>{inProgress} в работе</span> ·&nbsp;
              <span style={{ color: T.good }}>{done} завершили</span> ·&nbsp;
              <span>{notStarted} не начали</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => store.loadAll()}
          disabled={store.isLoading}
          style={{ width: 34, height: 34, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMute, opacity: store.isLoading ? 0.5 : 1 }}
          title="Обновить"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: store.isLoading ? 'rotate(360deg)' : 'none', transition: store.isLoading ? 'transform 1s linear infinite' : 'none' }}>
            <path d="M2 7a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 7a5 5 0 01-10 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 4.5L12 7l2.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Filter tabs */}
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.divider}`, display: 'flex', gap: 6, flexShrink: 0 }}>
            {([
              ['all', 'Все', store.cleaners.length],
              ['in_progress', 'В работе', inProgress],
              ['not_started', 'Не начали', notStarted],
              ['done', 'Завершили', done],
            ] as const).map(([key, label, count]) => {
              const active = filter === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  style={{
                    height: 30, padding: '0 12px', borderRadius: 8,
                    background: active ? T.text : T.surface,
                    border: `1px solid ${active ? T.text : T.border}`,
                    color: active ? '#fff' : T.textMute,
                    fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {label}
                  <span style={{ padding: '1px 6px', borderRadius: 10, background: active ? 'rgba(255,255,255,0.2)' : T.bg2, fontSize: 11, fontWeight: 700 }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Cards grid */}
          <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
            {store.isLoading && store.cleaners.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
            ) : store.error ? (
              <ErrorState message={store.error} onRetry={() => store.loadAll()} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: T.textDim, fontSize: 14, fontFamily: FONT }}>
                Нет уборщиц в этой категории
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${selected ? '220px' : '240px'}, 1fr))`,
                gap: 14,
                alignContent: 'start',
              }}>
                {filtered.map((c) => (
                  <CleanerCard
                    key={c.id}
                    cleaner={c}
                    selected={selected?.id === c.id}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: drawer */}
        {selected && (
          <CleanerDrawer
            cleaner={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  )
})
