import { useEffect, useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { entrancesApi, qrApi } from '../shared/api'
import type { Entrance, QrLayout } from '../shared/types'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Spinner } from '../shared/ui/Spinner'
import { Icons } from '../shared/ui/icons'

export function meta() {
  return [{ title: 'QR-коды — Мой подъезд' }]
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
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
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: T.text }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}

function Card({
  title,
  children,
  style,
}: {
  title?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${T.divider}`,
            fontSize: 14,
            fontWeight: 700,
            color: T.text,
            fontFamily: FONT,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

export default observer(function ManagerQr() {
  const [entrances, setEntrances] = useState<Entrance[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState('')

  const [entranceId, setEntranceId] = useState('')
  const [selectedFloors, setSelectedFloors] = useState<Set<number>>(new Set())
  const [title, setTitle] = useState('Оцените уборку')
  const [footer, setFooter] = useState('Сканируйте камерой телефона')
  const [layout, setLayout] = useState<QrLayout>('one-per-page')

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [downloadBusy, setDownloadBusy] = useState(false)

  const entrance = useMemo(
    () => entrances.find((e) => e.id === entranceId),
    [entrances, entranceId],
  )

  useEffect(() => {
    entrancesApi
      .getAll()
      .then((list) => {
        setEntrances(list)
        if (list.length && !entranceId) setEntranceId(list[0].id)
      })
      .catch((e) => setError(e?.message ?? 'Не удалось загрузить подъезды'))
      .finally(() => setLoadingList(false))
  }, [])

  // Reset selected floors and preview whenever entrance changes
  useEffect(() => {
    setSelectedFloors(new Set())
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [entranceId])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const toggleFloor = (f: number) => {
    setSelectedFloors((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  const selectAll = () => {
    if (!entrance) return
    setSelectedFloors(new Set(Array.from({ length: entrance.floorsTotal }, (_, i) => i + 1)))
  }
  const clearAll = () => setSelectedFloors(new Set())

  const orderedFloors = useMemo(
    () => Array.from(selectedFloors).sort((a, b) => a - b),
    [selectedFloors],
  )

  const previewFloor = orderedFloors[0] ?? 1

  const handlePreview = async () => {
    if (!entrance) return
    setPreviewBusy(true)
    try {
      const blob = await qrApi.preview(entrance.id, previewFloor)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
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
        options: {
          title: title || undefined,
          subtitle: undefined,
          footer: footer || undefined,
          layout,
        },
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-podiezd-${entrance.number}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка генерации PDF')
    } finally {
      setDownloadBusy(false)
    }
  }

  if (loadingList) {
    return (
      <>
        <TopBar title="QR-коды" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size={32} />
        </div>
      </>
    )
  }

  if (entrances.length === 0) {
    return (
      <>
        <TopBar title="QR-коды" />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.textDim,
            fontFamily: FONT,
          }}
        >
          Нет подъездов — создайте подъезд, чтобы напечатать QR.
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar
        title="QR-коды"
        subtitle={`Печать QR на этажи · ${entrances.length} подъезд${entrances.length === 1 ? '' : 'а'}`}
      />
      <div
        style={{
          flex: 1,
          padding: 20,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 16,
          alignContent: 'start',
        }}
      >
        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <Card title="Подъезд">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {entrances.map((e) => {
                  const active = e.id === entranceId
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEntranceId(e.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: `1px solid ${active ? T.text : T.border}`,
                        background: active ? T.text : T.surface,
                        color: active ? T.surface : T.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      Подъезд {e.number}
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: active ? T.surface : T.textDim,
                          fontWeight: 500,
                        }}
                      >
                        {e.address}
                      </span>
                    </button>
                  )
                })}
              </div>
              {entrance && (
                <div style={{ fontSize: 12.5, color: T.textDim, fontFamily: FONT }}>
                  Этажей: {entrance.floorsTotal}
                </div>
              )}
            </div>
          </Card>

          <Card
            title={`Этажи · выбрано ${selectedFloors.size}${entrance ? ` из ${entrance.floorsTotal}` : ''}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button kind="secondary" size="sm" onClick={selectAll}>
                  Выбрать все
                </Button>
                <Button kind="ghost" size="sm" onClick={clearAll}>
                  Очистить
                </Button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
                  gap: 8,
                }}
              >
                {entrance &&
                  Array.from({ length: entrance.floorsTotal }, (_, i) => i + 1).map((f) => {
                    const active = selectedFloors.has(f)
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFloor(f)}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          border: `1px solid ${active ? T.accent : T.border}`,
                          background: active ? T.accent : T.surface,
                          color: T.text,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: FONT,
                        }}
                      >
                        {f}
                      </button>
                    )
                  })}
              </div>
            </div>
          </Card>

          <Card title="Подписи">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Заголовок" value={title} onChange={setTitle} placeholder="Оцените уборку" />
              <Input
                label="Нижний текст"
                value={footer}
                onChange={setFooter}
                placeholder="Сканируйте камерой телефона"
              />
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: T.textMute,
                    fontWeight: 500,
                    marginBottom: 6,
                    fontFamily: FONT,
                  }}
                >
                  Раскладка
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'one-per-page', label: '1 на лист' },
                    { id: 'grid-2x3', label: 'Сетка 2×3' },
                  ].map((opt) => {
                    const active = layout === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLayout(opt.id as QrLayout)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: `1px solid ${active ? T.text : T.border}`,
                          background: active ? T.text : T.surface,
                          color: active ? T.surface : T.text,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: FONT,
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>

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

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
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
              {downloadBusy ? <Spinner size={16} color="#373C46" /> : 'Скачать PDF'}
            </Button>
          </div>
        </div>

        {/* Right: preview */}
        <Card
          title={`Превью${orderedFloors.length ? ` · этаж ${previewFloor}` : ''}`}
          style={{ minHeight: 360 }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              minHeight: 320,
            }}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt={`QR подъезд ${entrance?.number}, этаж ${previewFloor}`}
                  style={{
                    width: '100%',
                    maxWidth: 320,
                    aspectRatio: '1 / 1',
                    objectFit: 'contain',
                    background: '#fff',
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                  }}
                />
                <div style={{ fontSize: 13, color: T.textDim, fontFamily: FONT, textAlign: 'center' }}>
                  Подъезд {entrance?.number} · этаж {previewFloor}
                  <br />
                  <span style={{ fontSize: 11 }}>
                    при сканировании откроется форма отзыва
                  </span>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  color: T.textDim,
                  fontFamily: FONT,
                  textAlign: 'center',
                }}
              >
                <div style={{ color: T.textOff }}>{Icons.navQr}</div>
                <div style={{ fontSize: 13 }}>
                  Выберите этажи и нажмите «Превью QR»,
                  <br />
                  чтобы увидеть, как будет выглядеть код.
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
})
