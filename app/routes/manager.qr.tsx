import { useEffect, useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { buildingsApi, entrancesApi, qrApi } from '../shared/api'
import type { Building, Entrance, QrLayout } from '../shared/types'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Spinner } from '../shared/ui/Spinner'
import { Icons } from '../shared/ui/icons'

export function meta() {
  return [{ title: 'QR-коды — Мой подъезд' }]
}

// ── Section wrapper ────────────────────────────────────────────────

function Section({
  step,
  label,
  active,
  done,
  children,
}: {
  step: number
  label: string
  active: boolean
  done: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1.5px solid ${active ? T.text : done ? T.border2 : T.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: active || done ? 1 : 0.45,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: active || done ? `1px solid ${T.divider}` : 'none',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: done ? T.good : active ? T.text : T.bg2,
            color: done || active ? '#fff' : T.textDim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONT,
            flexShrink: 0,
          }}
        >
          {done ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 2.5L10 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : step}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>{label}</span>
      </div>
      {(active || done) && <div style={{ padding: 16 }}>{children}</div>}
    </div>
  )
}

// ── Floor grid ─────────────────────────────────────────────────────

function FloorGrid({
  total,
  selected,
  onToggle,
}: {
  total: number
  selected: Set<number>
  onToggle: (f: number) => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
        gap: 7,
      }}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((f) => {
        const active = selected.has(f)
        return (
          <button
            key={f}
            type="button"
            onClick={() => onToggle(f)}
            style={{
              height: 42,
              borderRadius: 8,
              border: `1.5px solid ${active ? T.accent : T.border}`,
              background: active ? T.accent : T.surface,
              color: T.text,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: FONT,
              transition: 'background .1s, border-color .1s',
            }}
          >
            {f}
          </button>
        )
      })}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────

export default observer(function ManagerQr() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [entrances, setEntrances] = useState<Entrance[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState('')

  const [buildingId, setBuildingId] = useState('')
  const [entranceId, setEntranceId] = useState('')
  const [selectedFloors, setSelectedFloors] = useState<Set<number>>(new Set())

  const [qrTitle, setQrTitle] = useState('Оцените уборку')
  const [qrFooter, setQrFooter] = useState('Сканируйте камерой телефона')
  const [layout, setLayout] = useState<QrLayout>('one-per-page')

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [buildingDownloadBusy, setBuildingDownloadBusy] = useState(false)

  useEffect(() => {
    Promise.all([buildingsApi.getAll(), entrancesApi.getAll()])
      .then(([bl, el]) => {
        setBuildings(bl)
        setEntrances(el)
      })
      .catch((e) => setError(e?.message ?? 'Не удалось загрузить данные'))
      .finally(() => setLoadingList(false))
  }, [])

  // When building changes — reset entrance and floors
  const handleSelectBuilding = (id: string) => {
    setBuildingId(id)
    setEntranceId('')
    setSelectedFloors(new Set())
    clearPreview()
  }

  // When entrance changes — reset floors
  const handleSelectEntrance = (id: string) => {
    setEntranceId(id)
    setSelectedFloors(new Set())
    clearPreview()
  }

  const clearPreview = () => {
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
  }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const building = useMemo(() => buildings.find((b) => b.id === buildingId), [buildings, buildingId])
  const entrance = useMemo(() => entrances.find((e) => e.id === entranceId), [entrances, entranceId])
  const buildingEntrances = useMemo(
    () => entrances.filter((e) => e.buildingId === buildingId).sort((a, b) => a.number - b.number),
    [entrances, buildingId],
  )

  const toggleFloor = (f: number) => {
    setSelectedFloors((prev) => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  const orderedFloors = useMemo(() => Array.from(selectedFloors).sort((a, b) => a - b), [selectedFloors])
  const previewFloor = orderedFloors[0] ?? 1

  const handlePreview = async () => {
    if (!entrance) return
    setPreviewBusy(true)
    setError('')
    try {
      const blob = await qrApi.preview(entrance.id, previewFloor)
      clearPreview()
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось получить превью')
    } finally {
      setPreviewBusy(false)
    }
  }

  const handleDownload = async () => {
    if (!entrance || orderedFloors.length === 0) return
    setDownloadBusy(true)
    setError('')
    try {
      const blob = await qrApi.generate({
        entranceId: entrance.id,
        floors: orderedFloors,
        options: { title: qrTitle || undefined, footer: qrFooter || undefined, layout },
      })
      triggerDownload(blob, `qr-podiezd-${entrance.number}.pdf`)
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка генерации PDF')
    } finally {
      setDownloadBusy(false)
    }
  }

  const handleDownloadBuilding = async () => {
    if (!building) return
    setBuildingDownloadBusy(true)
    setError('')
    try {
      const blob = await qrApi.generateBuilding({
        buildingId: building.id,
        options: { title: qrTitle || undefined, footer: qrFooter || undefined, layout },
      })
      triggerDownload(blob, `qr-dom-${building.number}.pdf`)
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка генерации PDF по дому')
    } finally {
      setBuildingDownloadBusy(false)
    }
  }

  function triggerDownload(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  // Step states
  const step1Done = Boolean(buildingId)
  const step2Active = step1Done
  const step2Done = Boolean(entranceId)
  const step3Active = step2Done
  const step3Done = selectedFloors.size > 0

  if (loadingList) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <>
      {/* Top bar */}
      <div style={{ height: 60, padding: '0 24px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', flexShrink: 0, background: T.bg }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: T.text }}>QR-коды</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1 }}>
            {buildings.length} домов · {entrances.length} подъездов
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: 20, overflow: 'auto', display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(280px, 0.9fr)', gap: 16, alignContent: 'start' }}>

        {/* Left: 3 steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Step 1 — Building */}
          <Section step={1} label="Выберите дом" active={!step1Done} done={step1Done}>
            {buildings.length === 0 ? (
              <div style={{ fontSize: 13, color: T.textDim, fontFamily: FONT }}>
                Домов нет — сначала создайте дом в разделе «Дома и подъезды».
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {buildings.map((b) => {
                  const active = b.id === buildingId
                  const eCnt = entrances.filter((e) => e.buildingId === b.id).length
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBuilding(b.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: `1.5px solid ${active ? T.text : T.border}`,
                        background: active ? T.text : T.surface,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ color: active ? T.accent : T.textDim, display: 'flex', flexShrink: 0 }}>
                        {Icons.navBuilding}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#fff' : T.text, fontFamily: FONT }}>
                          {b.address}
                        </div>
                        <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.55)' : T.textDim, marginTop: 2, fontFamily: FONT }}>
                          {b.floorsTotal} эт. · {eCnt} подъезд{eCnt === 1 ? '' : eCnt < 5 ? 'а' : 'ов'}
                        </div>
                      </div>
                      {active && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5L13 5" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Step 2 — Entrance */}
          <Section step={2} label="Выберите подъезд" active={step2Active && !step2Done} done={step2Done}>
            {buildingEntrances.length === 0 ? (
              <div style={{ fontSize: 13, color: T.textDim, fontFamily: FONT }}>
                В этом доме нет подъездов.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {buildingEntrances.map((e) => {
                  const active = e.id === entranceId
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleSelectEntrance(e.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        border: `1.5px solid ${active ? T.text : T.border}`,
                        background: active ? T.text : T.surface,
                        cursor: 'pointer',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 24, fontWeight: 800, color: active ? '#fff' : T.text, fontFamily: FONT, lineHeight: 1 }}>
                        {e.number}
                      </span>
                      <span style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.55)' : T.textDim, fontFamily: FONT }}>
                        {e.floorsTotal} эт.
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Step 3 — Floors */}
          <Section
            step={3}
            label={`Выберите этажи${step3Done ? ` · ${selectedFloors.size} выбрано` : ''}`}
            active={step3Active && !step3Done}
            done={step3Done}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  kind="secondary"
                  size="sm"
                  onClick={() => entrance && setSelectedFloors(new Set(Array.from({ length: entrance.floorsTotal }, (_, i) => i + 1)))}
                >
                  Выбрать все
                </Button>
                <Button kind="ghost" size="sm" onClick={() => { setSelectedFloors(new Set()); clearPreview() }}>
                  Очистить
                </Button>
              </div>
              {entrance && (
                <FloorGrid total={entrance.floorsTotal} selected={selectedFloors} onToggle={toggleFloor} />
              )}
            </div>
          </Section>

          {/* Captions + layout */}
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              opacity: step3Done ? 1 : 0.5,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FONT }}>Подписи и раскладка</div>
            <Input label="Заголовок на QR" value={qrTitle} onChange={setQrTitle} placeholder="Оцените уборку" />
            <Input label="Нижний текст" value={qrFooter} onChange={setQrFooter} placeholder="Сканируйте камерой телефона" />
            <div>
              <div style={{ fontSize: 12, color: T.textMute, fontWeight: 600, marginBottom: 8, fontFamily: FONT }}>Раскладка в PDF</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['one-per-page', '1 на лист'], ['grid-2x3', 'Сетка 2×3']] as const).map(([id, label]) => {
                  const active = layout === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLayout(id)}
                      style={{
                        padding: '7px 14px', borderRadius: 8,
                        border: `1.5px solid ${active ? T.text : T.border}`,
                        background: active ? T.text : T.surface,
                        color: active ? '#fff' : T.text,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: T.badSoft, color: T.bad, borderRadius: 8, fontSize: 13, fontFamily: FONT }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              kind="secondary"
              size="lg"
              onClick={handlePreview}
              disabled={!entrance || previewBusy}
            >
              {previewBusy ? <Spinner size={16} color={T.text} /> : 'Превью QR'}
            </Button>
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={!entrance || orderedFloors.length === 0 || downloadBusy}
              leading={Icons.download}
            >
              {downloadBusy ? <Spinner size={16} color="#373C46" /> : `Скачать PDF (${orderedFloors.length} эт.)`}
            </Button>
            <Button
              kind="secondary"
              size="lg"
              onClick={handleDownloadBuilding}
              disabled={!building || buildingDownloadBusy}
              leading={Icons.download}
            >
              {buildingDownloadBusy ? <Spinner size={16} color={T.text} /> : 'PDF весь дом'}
            </Button>
          </div>
        </div>

        {/* Right: preview */}
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            alignSelf: 'start',
            position: 'sticky',
            top: 0,
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.divider}`, fontSize: 14, fontWeight: 700, color: T.text, fontFamily: FONT }}>
            Превью{orderedFloors.length > 0 ? ` · этаж ${previewFloor}` : ''}
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 340 }}>
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt={`QR подъезд ${entrance?.number}, этаж ${previewFloor}`}
                  style={{ width: '100%', maxWidth: 280, aspectRatio: '1/1', objectFit: 'contain', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8 }}
                />
                <div style={{ fontSize: 12, color: T.textDim, fontFamily: FONT, textAlign: 'center', lineHeight: 1.5 }}>
                  {building?.address}<br />
                  Подъезд {entrance?.number} · этаж {previewFloor}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: T.textDim, fontFamily: FONT, textAlign: 'center', padding: '0 20px' }}>
                <div style={{ color: T.textOff, opacity: 0.5 }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <rect x="26" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <rect x="6" y="26" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M26 26h4v4h-4zM34 26h8v4M26 34h4M34 34h8v8h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{ fontSize: 13 }}>
                  {!buildingId ? 'Выберите дом' : !entranceId ? 'Выберите подъезд' : 'Выберите этажи и нажмите «Превью QR»'}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
})
