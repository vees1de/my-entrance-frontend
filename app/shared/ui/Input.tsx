import type { CSSProperties, ReactNode } from 'react'
import { T, FONT } from '../tokens'

interface InputProps {
  label?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  icon?: ReactNode
  hint?: string
  style?: CSSProperties
  disabled?: boolean
}

export function Input({ label, value, onChange, placeholder, type = 'text', icon, hint, style, disabled }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <div style={{ fontSize: 13, color: T.textMute, fontWeight: 500, fontFamily: FONT }}>
          {label}
        </div>
      )}
      <div
        style={{
          height: 48,
          borderRadius: 10,
          background: T.surface,
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
        }}
      >
        {icon && <span style={{ color: T.textDim, display: 'flex' }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 15,
            fontFamily: FONT,
            color: T.text,
            fontWeight: 500,
          }}
        />
      </div>
      {hint && <div style={{ fontSize: 12, color: T.textDim, fontFamily: FONT }}>{hint}</div>}
    </div>
  )
}
