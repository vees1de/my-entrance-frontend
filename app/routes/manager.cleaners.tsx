import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Badge } from '../shared/ui/Badge'
import { Button } from '../shared/ui/Button'
import { Avatar } from '../shared/ui/Avatar'
import { Spinner } from '../shared/ui/Spinner'
import { ErrorState } from '../shared/ui/ErrorState'
import { Icons } from '../shared/ui/icons'
import type { Cleaner, CleanerStatus } from '../shared/types'

export function meta() {
  return [{ title: 'Уборщицы — Мой подъезд' }]
}

const STATUS_LABELS: Record<CleanerStatus, string> = {
  not_started: 'Не начала',
  in_progress: 'В работе',
  done: 'Готово',
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <button type="button" style={{ height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <span style={{ color: T.textDim }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
      <span style={{ color: T.textDim, display: 'flex' }}>{Icons.chev}</span>
    </button>
  )
}

function TableView({ cleaners }: { cleaners: Cleaner[] }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 110px 80px 80px 90px 80px 100px', padding: '10px 16px', gap: 12, borderBottom: `1px solid ${T.divider}`, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: T.textDim, fontFamily: FONT, flexShrink: 0 }}>
        <div>Имя</div>
        <div>Подъезд</div>
        <div>Статус</div>
        <div>Этажи</div>
        <div>Отметка</div>
        <div>Смена</div>
        <div style={{ textAlign: 'right' }}>Плохих</div>
        <div style={{ textAlign: 'right' }}>Всего</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {cleaners.map((c, i) => {
          const tone = c.status === 'done' ? 'done' : c.status === 'in_progress' ? 'in_progress' : 'not_started'
          const lastTime = c.lastCleaningAt
            ? new Date(c.lastCleaningAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : '—'
          return (
            <div
              key={c.id}
              style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 110px 80px 80px 90px 80px 100px', padding: '10px 16px', gap: 12, alignItems: 'center', borderBottom: i < cleaners.length - 1 ? `1px solid ${T.divider}` : 'none', fontSize: 13, fontFamily: FONT }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar name={c.name} size={28} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.text }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{c.phone}</div>
                </div>
              </div>
              <div style={{ color: T.textMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address}</div>
              <div><Badge variant={tone}>{STATUS_LABELS[c.status]}</Badge></div>
              <div style={{ fontVariantNumeric: 'tabular-nums', color: T.text }}>{c.floorsCompleted}/{c.floorsTotal}</div>
              <div style={{ fontVariantNumeric: 'tabular-nums', color: T.textMute }}>{lastTime}</div>
              <div style={{ fontSize: 12, color: T.textMute, fontVariantNumeric: 'tabular-nums' }}>{c.shift}</div>
              <div style={{ textAlign: 'right' }}>
                {c.badReviewsToday > 0 ? (
                  <span style={{ display: 'inline-flex', minWidth: 22, height: 22, padding: '0 6px', borderRadius: 4, background: T.bad, color: '#fff', fontSize: 12, fontWeight: 700, alignItems: 'center', justifyContent: 'center' }}>
                    {c.badReviewsToday}
                  </span>
                ) : (
                  <span style={{ color: T.textDim }}>0</span>
                )}
              </div>
              <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: T.textMute }}>{c.totalReviews}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CardsView({ cleaners }: { cleaners: Cleaner[] }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, alignContent: 'start' }}>
      {cleaners.map((c) => {
        const tone = c.status === 'done' ? 'done' : c.status === 'in_progress' ? 'in_progress' : 'not_started'
        const lastTime = c.lastCleaningAt
          ? new Date(c.lastCleaningAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : '—'
        return (
          <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={c.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.text, fontFamily: FONT }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 1, fontFamily: FONT }}>{c.address}</div>
              </div>
              {c.badReviewsToday > 0 && (
                <span style={{ width: 22, height: 22, borderRadius: 4, background: T.bad, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
                  {c.badReviewsToday}
                </span>
              )}
            </div>
            <Badge variant={tone}>{STATUS_LABELS[c.status]}</Badge>
            <div style={{ fontSize: 11, color: T.textMute, lineHeight: 1.6, fontFamily: FONT }}>
              <div><span style={{ color: T.textDim }}>этажи · </span><span style={{ color: T.text, fontWeight: 600 }}>{c.floorsCompleted}/{c.floorsTotal}</span></div>
              <div><span style={{ color: T.textDim }}>отметка · </span><span style={{ color: T.text }}>{lastTime}</span></div>
              <div><span style={{ color: T.textDim }}>смена · </span><span style={{ color: T.text }}>{c.shift}</span></div>
              <div><span style={{ color: T.textDim }}>всего отзывов · </span><span style={{ color: T.text }}>{c.totalReviews}</span></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default observer(function ManagerCleaners() {
  const { cleaners: store } = useStore()
  const [view, setView] = useState<'table' | 'cards'>('table')

  useEffect(() => {
    store.loadAll()
  }, [])

  return (
    <>
      {/* Top bar */}
      <div style={{ height: 60, padding: '0 24px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: T.text, fontFamily: FONT }}>Уборщицы</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1, fontFamily: FONT }}>
            {store.cleaners.length} сотрудников · {store.cleaners.filter((c) => c.status !== 'not_started').length} на смене
          </div>
        </div>
        <div style={{ height: 34, width: 240, padding: '0 12px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textDim, fontFamily: FONT }}>
          {Icons.search}<span>Поиск…</span>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.textMute, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          {Icons.bell}
          <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: T.bad, border: `1.5px solid ${T.surface}` }} />
        </button>
        <Button size="sm" leading={Icons.plus}>Добавить</Button>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* View toggle + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', padding: 3, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>
            {(['table', 'cards'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                style={{ height: 26, padding: '0 12px', borderRadius: 6, background: view === v ? T.surface2 : 'transparent', color: view === v ? T.text : T.textMute, border: 'none', fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}
              >
                {v === 'table' ? 'Таблица' : 'Карточки'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <FilterSelect label="Статус" value="Все" />
          <FilterSelect label="Подъезд" value="Все" />
        </div>

        {store.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
        ) : store.error ? (
          <ErrorState message={store.error} onRetry={() => store.loadAll()} />
        ) : view === 'table' ? (
          <TableView cleaners={store.cleaners} />
        ) : (
          <CardsView cleaners={store.cleaners} />
        )}
      </div>
    </>
  )
})
