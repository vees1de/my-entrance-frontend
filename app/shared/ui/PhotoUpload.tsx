import { useRef, useEffect, useState } from 'react'
import { T, FONT } from '../tokens'
import { Icons } from './icons'

interface PhotoUploadProps {
  value: File | null
  onChange: (file: File | null) => void
  label?: string
}

export function PhotoUpload({ value, onChange, label = 'Прикрепить фото' }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  if (previewUrl) {
    return (
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <img src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Icons.close}
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          onChange(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          height: 48,
          borderRadius: 12,
          background: 'transparent',
          border: `1px dashed ${T.border2}`,
          color: T.textMute,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 500,
          fontFamily: FONT,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {Icons.camera}
        <span>{label}</span>
      </button>
    </>
  )
}
