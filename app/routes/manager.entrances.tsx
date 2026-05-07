import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { cleanersApi, entrancesApi } from '../shared/api'
import type { Cleaner, Entrance } from '../shared/types'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Spinner } from '../shared/ui/Spinner'
import { Icons } from '../shared/ui/icons'

export function meta() {
  return [{ title: 'Дома и подъезды — Мой подъезд' }]
}

function TopBar({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        height: 60,
        padding: '0 24px',
        borderBottom: `1px solid ${T.divider}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
        background: T.bg,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  )
}

interface NewEntranceForm {
  address: string
  number: string
  floorsTotal: string
}

function CleanerChips({
  entrance,
  cleaners,
  onAssign,
  onUnassign,
  busy,
}: {
  entrance: Entrance
  cleaners: Cleaner[]
  onAssign: (cleanerId: string) => void
  onUnassign: (cleanerId: string) => void
  busy: boolean
}) {
  const assigned = entrance.assignedCleanerIds ?? []
  const available = cleaners.filter((c) => !assigned.includes(c.id))
  const [picking, setPicking] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 11.5,
          color: T.textMute,
          fontWeight: 500,
          letterSpacing: 0.2,
          textTransform: 'uppercase',
          fontFamily: FONT,
        }}
      >
        Уборщицы
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {assigned.length === 0 && !picking && (
          <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>не назначены</span>
        )}
        {assigned.map((id) => {
          const c = cleaners.find((x) => x.id === id)
          if (!c) return null
          return (
            <span
              key={id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 4px 4px 10px',
                borderRadius: 999,
                background: T.bg2,
                border: `1px solid ${T.border}`,
                fontSize: 12,
                fontWeight: 600,
                color: T.text,
                fontFamily: FONT,
              }}
            >
              {c.name}
              <button
                type="button"
                onClick={() => !busy && onUnassign(id)}
                disabled={busy}
                title="Отвязать"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: T.textDim,
                  cursor: busy ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {Icons.close}
              </button>
            </span>
          )
        })}
        {picking ? (
          <select
            autoFocus
            disabled={busy}
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value
              if (id) {
                onAssign(id)
                setPicking(false)
              }
            }}
            onBlur={() => setPicking(false)}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: T.text,
              fontFamily: FONT,
            }}
          >
            <option value="" disabled>
              Выбрать…
            </option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          available.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setPicking(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px dashed ${T.border2}`,
                background: 'transparent',
                color: T.textMute,
                fontSize: 12,
                cursor: busy ? 'default' : 'pointer',
                fontFamily: FONT,
              }}
            >
              {Icons.plus}
              <span>добавить</span>
            </button>
          )
        )}
      </div>
    </div>
  )
}

interface EntranceCardProps {
  entrance: Entrance
  cleaners: Cleaner[]
  busyId: string | null
  onPatch: (id: string, dto: Partial<Pick<Entrance, 'number' | 'floorsTotal'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAssign: (id: string, cleanerId: string) => Promise<void>
  onUnassign: (id: string, cleanerId: string) => Promise<void>
}

function EntranceCard({
  entrance,
  cleaners,
  busyId,
  onPatch,
  onDelete,
  onAssign,
  onUnassign,
}: EntranceCardProps) {
  const [editing, setEditing] = useState(false)
  const [num, setNum] = useState(String(entrance.number))
  const [floors, setFloors] = useState(String(entrance.floorsTotal))
  const busy = busyId === entrance.id

  const cancel = () => {
    setNum(String(entrance.number))
    setFloors(String(entrance.floorsTotal))
    setEditing(false)
  }
  const save = async () => {
    const n = parseInt(num, 10)
    const f = parseInt(floors, 10)
    if (!Number.isFinite(n) || n < 1 || !Number.isFinite(f) || f < 1) return
    await onPatch(entrance.id, { number: n, floorsTotal: f })
    setEditing(false)
  }

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {editing ? (
          <>
            <span style={{ fontSize: 13, color: T.textMute, fontFamily: FONT }}>Подъезд</span>
            <input
              value={num}
              onChange={(e) => setNum(e.target.value)}
              type="number"
              min={1}
              style={{
                width: 60,
                fontSize: 16,
                fontWeight: 700,
                padding: '4px 8px',
                border: `1px solid ${T.border2}`,
                borderRadius: 6,
                fontFamily: FONT,
              }}
            />
            <span style={{ fontSize: 13, color: T.textDim, fontFamily: FONT }}>·</span>
            <input
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
              type="number"
              min={1}
              style={{
                width: 60,
                fontSize: 14,
                padding: '4px 8px',
                border: `1px solid ${T.border2}`,
                borderRadius: 6,
                fontFamily: FONT,
              }}
            />
            <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>этажей</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: FONT }}>
              Подъезд {entrance.number}
            </span>
            <span style={{ fontSize: 12.5, color: T.textDim, fontFamily: FONT }}>
              · {entrance.floorsTotal} этаж{etajSuffix(entrance.floorsTotal)}
            </span>
          </>
        )}
        <span style={{ flex: 1 }} />
        {editing ? (
          <>
            <Button kind="ghost" size="sm" onClick={cancel} disabled={busy}>
              Отмена
            </Button>
            <Button size="sm" onClick={save} disabled={busy}>
              Сохранить
            </Button>
          </>
        ) : (
          <>
            <Button kind="ghost" size="sm" onClick={() => setEditing(true)}>
              Изменить
            </Button>
            <Button
              kind="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Удалить подъезд ${entrance.number}?`)) onDelete(entrance.id)
              }}
              disabled={busy}
            >
              Удалить
            </Button>
          </>
        )}
      </div>

      <CleanerChips
        entrance={entrance}
        cleaners={cleaners}
        onAssign={(cid) => onAssign(entrance.id, cid)}
        onUnassign={(cid) => onUnassign(entrance.id, cid)}
        busy={busy}
      />
    </div>
  )
}

function etajSuffix(n: number) {
  // 1 — этаж, 2-4 — этажа, 5+ — этажей. (10..19 — этажей.)
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return ''
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'а'
  return 'ей'
}

export default observer(function ManagerEntrances() {
  const [entrances, setEntrances] = useState<Entrance[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<NewEntranceForm>({ address: '', number: '', floorsTotal: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const refreshAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [list, cls] = await Promise.all([entrancesApi.getAll(), cleanersApi.getAll()])
      setEntrances(list)
      setCleaners(cls)
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [])

  const grouped = useMemo(() => {
    const byAddr = new Map<string, Entrance[]>()
    for (const e of entrances) {
      const key = e.address
      if (!byAddr.has(key)) byAddr.set(key, [])
      byAddr.get(key)!.push(e)
    }
    return Array.from(byAddr.entries())
      .map(([address, items]) => ({
        address,
        items: items.slice().sort((a, b) => a.number - b.number),
      }))
      .sort((a, b) => a.address.localeCompare(b.address, 'ru'))
  }, [entrances])

  const handlePatch = async (
    id: string,
    dto: Partial<Pick<Entrance, 'number' | 'floorsTotal' | 'address'>>,
  ) => {
    setBusyId(id)
    setError('')
    try {
      await entrancesApi.update(id, dto)
      await refreshAll()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Не удалось сохранить')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    setError('')
    try {
      await entrancesApi.remove(id)
      await refreshAll()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Не удалось удалить')
    } finally {
      setBusyId(null)
    }
  }

  const handleAssign = async (id: string, cleanerId: string) => {
    setBusyId(id)
    try {
      await entrancesApi.assign(id, cleanerId)
      await refreshAll()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка привязки')
    } finally {
      setBusyId(null)
    }
  }
  const handleUnassign = async (id: string, cleanerId: string) => {
    setBusyId(id)
    try {
      await entrancesApi.unassign(id, cleanerId)
      await refreshAll()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка отвязки')
    } finally {
      setBusyId(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    const n = parseInt(form.number, 10)
    const f = parseInt(form.floorsTotal, 10)
    if (!form.address.trim() || !Number.isFinite(n) || n < 1 || !Number.isFinite(f) || f < 1) {
      setAddError('Заполните адрес, номер подъезда (≥1) и число этажей (≥1)')
      return
    }
    setAdding(true)
    try {
      await entrancesApi.create({ address: form.address.trim(), number: n, floorsTotal: f })
      setForm({ address: form.address, number: '', floorsTotal: '' })
      setShowAdd(false)
      await refreshAll()
    } catch (err: any) {
      setAddError(err?.response?.data?.message ?? err?.message ?? 'Не удалось создать')
    } finally {
      setAdding(false)
    }
  }

  const totalEntrances = entrances.length
  const totalHouses = grouped.length

  return (
    <>
      <TopBar
        title="Дома и подъезды"
        subtitle={
          loading
            ? 'Загрузка…'
            : `${totalHouses} дом${etajSuffix(totalHouses) ? '' : ''}${
                totalHouses % 10 === 1 && totalHouses % 100 !== 11 ? '' : 'а'
              } · ${totalEntrances} подъезд${totalEntrances === 1 ? '' : totalEntrances < 5 ? 'а' : 'ов'}`
        }
        action={
          <Button leading={Icons.plus} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Закрыть' : 'Добавить подъезд'}
          </Button>
        }
      />

      <div
        style={{
          flex: 1,
          padding: 20,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {showAdd && (
          <form
            onSubmit={handleAdd}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <Input
              label="Адрес дома"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              placeholder="ул. Ленина, 5"
            />
            <Input
              label="Подъезд №"
              type="number"
              value={form.number}
              onChange={(v) => setForm({ ...form, number: v })}
              placeholder="1"
            />
            <Input
              label="Этажей"
              type="number"
              value={form.floorsTotal}
              onChange={(v) => setForm({ ...form, floorsTotal: v })}
              placeholder="9"
            />
            <Button type="submit" size="lg" disabled={adding}>
              {adding ? <Spinner size={16} color="#373C46" /> : 'Создать'}
            </Button>
            {addError && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  fontSize: 13,
                  color: T.bad,
                  fontFamily: FONT,
                }}
              >
                {addError}
              </div>
            )}
          </form>
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: T.badSoft,
              color: T.bad,
              borderRadius: 8,
              fontSize: 13,
              fontFamily: FONT,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size={32} />
          </div>
        ) : grouped.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: T.textDim,
              fontFamily: FONT,
              fontSize: 14,
            }}
          >
            Подъездов ещё нет. Нажмите «Добавить подъезд», чтобы создать первый.
          </div>
        ) : (
          grouped.map((group) => (
            <section
              key={group.address}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0 4px' }}>
                <span style={{ color: T.textMute }}>{Icons.navBuilding}</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.text,
                    fontFamily: FONT,
                  }}
                >
                  {group.address}
                </h3>
                <span style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>
                  · {group.items.length} подъезд{group.items.length === 1 ? '' : group.items.length < 5 ? 'а' : 'ов'}
                </span>
                <span style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => {
                    setForm({ address: group.address, number: '', floorsTotal: '' })
                    setShowAdd(true)
                    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    color: T.accent,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    fontWeight: 600,
                  }}
                >
                  + ещё подъезд
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 12,
                }}
              >
                {group.items.map((e) => (
                  <EntranceCard
                    key={e.id}
                    entrance={e}
                    cleaners={cleaners}
                    busyId={busyId}
                    onPatch={handlePatch}
                    onDelete={handleDelete}
                    onAssign={handleAssign}
                    onUnassign={handleUnassign}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  )
})
