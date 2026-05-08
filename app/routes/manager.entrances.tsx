import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { buildingsApi, entrancesApi, streetsApi } from '../shared/api'
import type { Building, Entrance, Street } from '../shared/types'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Spinner } from '../shared/ui/Spinner'
import { Icons } from '../shared/ui/icons'

export function meta() {
  return [{ title: 'Дома и подъезды — Мой подъезд' }]
}

function etajSuffix(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return ''
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'а'
  return 'ей'
}

function podezdSuffix(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return ''
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'а'
  return 'ов'
}

// ── Add Building Form ──────────────────────────────────────────────

function AddBuildingForm({
  streets,
  onCreated,
  onCancel,
}: {
  streets: Street[]
  onCreated: (b: Building) => void
  onCancel: () => void
}) {
  const [streetName, setStreetName] = useState('')
  const [number, setNumber] = useState('')
  const [floors, setFloors] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const f = parseInt(floors, 10)
    if (!streetName.trim() || !number.trim() || !Number.isFinite(f) || f < 1) {
      setError('Заполните все поля')
      return
    }
    setAdding(true)
    try {
      const existing = streets.find(
        (s) => s.name.trim().toLowerCase() === streetName.trim().toLowerCase(),
      )
      const street = existing ?? (await streetsApi.create({ name: streetName.trim() }))
      const building = await buildingsApi.create({
        streetId: street.id,
        number: number.trim(),
        floorsTotal: f,
      })
      onCreated(building)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Ошибка')
    } finally {
      setAdding(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>
        Новый дом
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Input
          label="Улица"
          value={streetName}
          onChange={setStreetName}
          placeholder="ул. Ленина"
        />
        <Input label="Номер дома" value={number} onChange={setNumber} placeholder="12А" />
        <Input
          label="Этажей в доме"
          type="number"
          value={floors}
          onChange={setFloors}
          placeholder="9"
        />
      </div>
      {error && (
        <div style={{ fontSize: 13, color: T.bad, fontFamily: FONT }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={adding}>
          {adding ? <Spinner size={14} color="#373C46" /> : 'Создать дом'}
        </Button>
        <Button kind="ghost" onClick={onCancel} disabled={adding}>
          Отмена
        </Button>
      </div>
    </form>
  )
}

// ── Building Card ──────────────────────────────────────────────────

function BuildingCard({
  building,
  entrances,
  onAddEntrance,
  onEditBuilding,
  onDeleteBuilding,
  onEditEntrance,
  onDeleteEntrance,
  busy,
}: {
  building: Building
  entrances: Entrance[]
  onAddEntrance: (buildingId: string, number: number) => Promise<void>
  onEditBuilding: (id: string, floorsTotal: number) => Promise<void>
  onDeleteBuilding: (id: string) => Promise<void>
  onEditEntrance: (id: string, number: number) => Promise<void>
  onDeleteEntrance: (id: string) => Promise<void>
  busy: string | null
}) {
  const [expanded, setExpanded] = useState(true)
  const [editingFloors, setEditingFloors] = useState(false)
  const [floorsInput, setFloorsInput] = useState(String(building.floorsTotal))
  const [addingEntrance, setAddingEntrance] = useState(false)
  const [newEntranceNum, setNewEntranceNum] = useState('')
  const [addErr, setAddErr] = useState('')

  const isBusy = busy === building.id

  const saveFloors = async () => {
    const f = parseInt(floorsInput, 10)
    if (!Number.isFinite(f) || f < 1) return
    await onEditBuilding(building.id, f)
    setEditingFloors(false)
  }

  const submitEntrance = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddErr('')
    const n = parseInt(newEntranceNum, 10)
    if (!Number.isFinite(n) || n < 1) {
      setAddErr('Укажите номер подъезда (≥ 1)')
      return
    }
    try {
      await onAddEntrance(building.id, n)
      setNewEntranceNum('')
      setAddingEntrance(false)
    } catch (err: any) {
      setAddErr(err?.response?.data?.message ?? err?.message ?? 'Ошибка')
    }
  }

  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isBusy ? 0.6 : 1,
      }}
    >
      {/* Building header */}
      <div
        style={{
          background: T.bg2,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: T.textDim,
            display: 'flex',
            padding: 4,
          }}
        >
          {expanded ? Icons.chevDown : Icons.chevRight}
        </button>

        <span style={{ color: T.accent, display: 'flex', flexShrink: 0 }}>{Icons.navBuilding}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: FONT }}>
            {building.address}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 2, fontFamily: FONT }}>
            {editingFloors ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  value={floorsInput}
                  onChange={(e) => setFloorsInput(e.target.value)}
                  type="number"
                  min={1}
                  style={{
                    width: 52,
                    fontSize: 12,
                    padding: '2px 6px',
                    borderRadius: 6,
                    border: `1px solid ${T.border2}`,
                    fontFamily: FONT,
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveFloors()
                    if (e.key === 'Escape') {
                      setFloorsInput(String(building.floorsTotal))
                      setEditingFloors(false)
                    }
                  }}
                />
                <span style={{ color: T.textMute }}>этажей</span>
                <button
                  type="button"
                  onClick={saveFloors}
                  style={{ fontSize: 11, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600 }}
                >
                  ОК
                </button>
                <button
                  type="button"
                  onClick={() => { setFloorsInput(String(building.floorsTotal)); setEditingFloors(false) }}
                  style={{ fontSize: 11, color: T.textMute, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
                >
                  Отмена
                </button>
              </span>
            ) : (
              <>
                {building.floorsTotal} этаж{etajSuffix(building.floorsTotal)}
                {' · '}
                {entrances.length} подъезд{podezdSuffix(entrances.length)}
                {' · '}
                <button
                  type="button"
                  onClick={() => setEditingFloors(true)}
                  style={{ fontSize: 11, color: T.textMute, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, textDecoration: 'underline' }}
                >
                  изменить этажи
                </button>
              </>
            )}
          </div>
        </div>

        <Button
          kind="danger"
          size="sm"
          disabled={isBusy || entrances.length > 0}
          title={entrances.length > 0 ? 'Сначала удалите все подъезды' : ''}
          onClick={() => {
            if (confirm(`Удалить дом ${building.address}?`)) onDeleteBuilding(building.id)
          }}
        >
          Удалить
        </Button>
      </div>

      {/* Entrances */}
      {expanded && (
        <div style={{ background: T.bg, padding: '8px 16px 12px' }}>
          {entrances.length === 0 && !addingEntrance && (
            <div style={{ fontSize: 13, color: T.textDim, fontFamily: FONT, padding: '8px 0' }}>
              Подъездов нет
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entrances.map((e) => (
              <EntranceRow
                key={e.id}
                entrance={e}
                busy={busy === e.id}
                onEdit={onEditEntrance}
                onDelete={onDeleteEntrance}
              />
            ))}
          </div>

          {addingEntrance ? (
            <form
              onSubmit={submitEntrance}
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              <div style={{ width: 160 }}>
                <Input
                  label="Номер подъезда"
                  type="number"
                  value={newEntranceNum}
                  onChange={(v) => { setNewEntranceNum(v); setAddErr('') }}
                  placeholder="1"
                />
              </div>
              <Button type="submit" size="sm">
                Добавить
              </Button>
              <Button
                kind="ghost"
                size="sm"
                onClick={() => { setAddingEntrance(false); setNewEntranceNum(''); setAddErr('') }}
              >
                Отмена
              </Button>
              {addErr && (
                <span style={{ fontSize: 12, color: T.bad, fontFamily: FONT }}>{addErr}</span>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingEntrance(true)}
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: `1px dashed ${T.border2}`,
                background: 'none',
                color: T.textMute,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              {Icons.plus}
              <span>Добавить подъезд</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Entrance Row ───────────────────────────────────────────────────

function EntranceRow({
  entrance,
  busy,
  onEdit,
  onDelete,
}: {
  entrance: Entrance
  busy: boolean
  onEdit: (id: string, number: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [num, setNum] = useState(String(entrance.number))

  const save = async () => {
    const n = parseInt(num, 10)
    if (!Number.isFinite(n) || n < 1) return
    await onEdit(entrance.id, n)
    setEditing(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        opacity: busy ? 0.5 : 1,
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 6, background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.textMute, fontFamily: FONT, flexShrink: 0 }}>
        {entrance.number}
      </div>

      {editing ? (
        <>
          <input
            value={num}
            onChange={(e) => setNum(e.target.value)}
            type="number"
            min={1}
            autoFocus
            style={{ width: 64, fontSize: 14, padding: '4px 8px', border: `1px solid ${T.border2}`, borderRadius: 6, fontFamily: FONT }}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setNum(String(entrance.number)); setEditing(false) } }}
          />
          <Button size="sm" onClick={save} disabled={busy}>Сохранить</Button>
          <Button kind="ghost" size="sm" onClick={() => { setNum(String(entrance.number)); setEditing(false) }}>Отмена</Button>
        </>
      ) : (
        <>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text, fontFamily: FONT }}>
            Подъезд {entrance.number}
          </div>
          <Button kind="ghost" size="sm" onClick={() => setEditing(true)}>Изменить</Button>
          <Button
            kind="danger"
            size="sm"
            disabled={busy}
            onClick={() => { if (confirm(`Удалить подъезд ${entrance.number}?`)) onDelete(entrance.id) }}
          >
            Удалить
          </Button>
        </>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────

export default observer(function ManagerEntrances() {
  const [streets, setStreets] = useState<Street[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [entrances, setEntrances] = useState<Entrance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [showAddBuilding, setShowAddBuilding] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [sl, bl, el] = await Promise.all([
        streetsApi.getAll(),
        buildingsApi.getAll(),
        entrancesApi.getAll(),
      ])
      setStreets(sl)
      setBuildings(bl)
      setEntrances(el)
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const entrancesByBuilding = useMemo(() => {
    const map = new Map<string, Entrance[]>()
    for (const e of entrances) {
      const arr = map.get(e.buildingId) ?? []
      arr.push(e)
      map.set(e.buildingId, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.number - b.number)
    return map
  }, [entrances])

  const withError = (fn: () => Promise<void>) => async () => {
    setError('')
    try { await fn() } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка')
    }
  }

  const handleAddEntrance = async (buildingId: string, number: number) => {
    setBusy(buildingId)
    try {
      const e = await entrancesApi.create({ buildingId, number })
      setEntrances((prev) => [...prev, e])
    } finally {
      setBusy(null)
    }
  }

  const handleEditBuilding = async (id: string, floorsTotal: number) => {
    setBusy(id)
    try {
      const b = await buildingsApi.update(id, { floorsTotal })
      setBuildings((prev) => prev.map((x) => (x.id === id ? b : x)))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка')
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteBuilding = withError(async () => {
    // Actual call done in card — error surfaced here
  })

  const handleDeleteBuildingById = async (id: string) => {
    setBusy(id)
    setError('')
    try {
      await buildingsApi.remove(id)
      setBuildings((prev) => prev.filter((b) => b.id !== id))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка удаления дома')
    } finally {
      setBusy(null)
    }
  }

  const handleEditEntrance = async (id: string, number: number) => {
    setBusy(id)
    setError('')
    try {
      const e = await entrancesApi.update(id, { number })
      setEntrances((prev) => prev.map((x) => (x.id === id ? e : x)))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка')
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteEntrance = async (id: string) => {
    setBusy(id)
    setError('')
    try {
      await entrancesApi.remove(id)
      setEntrances((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Ошибка удаления')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {/* TopBar */}
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
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Дома и подъезды</div>
          {!loading && (
            <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1 }}>
              {buildings.length} дом{podezdSuffix(buildings.length)} · {entrances.length} подъезд{podezdSuffix(entrances.length)}
            </div>
          )}
        </div>
        <Button
          leading={Icons.plus}
          onClick={() => setShowAddBuilding((v) => !v)}
        >
          {showAddBuilding ? 'Закрыть' : 'Добавить дом'}
        </Button>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {showAddBuilding && (
          <AddBuildingForm
            streets={streets}
            onCreated={(b) => {
              setBuildings((prev) => [...prev, b])
              setShowAddBuilding(false)
            }}
            onCancel={() => setShowAddBuilding(false)}
          />
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: T.badSoft, color: T.bad, borderRadius: 8, fontSize: 13, fontFamily: FONT }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size={32} />
          </div>
        ) : buildings.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: T.textDim, fontFamily: FONT, fontSize: 14 }}>
            Домов нет. Нажмите «Добавить дом», чтобы создать первый.
          </div>
        ) : (
          buildings
            .slice()
            .sort((a, b) => a.address.localeCompare(b.address, 'ru'))
            .map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                entrances={entrancesByBuilding.get(building.id) ?? []}
                onAddEntrance={handleAddEntrance}
                onEditBuilding={handleEditBuilding}
                onDeleteBuilding={handleDeleteBuildingById}
                onEditEntrance={handleEditEntrance}
                onDeleteEntrance={handleDeleteEntrance}
                busy={busy}
              />
            ))
        )}
      </div>
    </>
  )
})
