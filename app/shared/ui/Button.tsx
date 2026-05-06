import type { CSSProperties, ReactNode } from 'react'
import { T, FONT, } from '../tokens'

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps {
  kind?: Kind
  size?: Size
  full?: boolean
  disabled?: boolean
  children: ReactNode
  style?: CSSProperties
  leading?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

const HEIGHTS: Record<Size, number> = { sm: 32, md: 40, lg: 48, xl: 56 }
const FONT_SIZES: Record<Size, number> = { sm: 13, md: 14, lg: 16, xl: 17 }
const PADDING: Record<Size, string> = { sm: '0 12px', md: '0 14px', lg: '0 20px', xl: '0 24px' }

export function Button({ kind = 'primary', size = 'md', full, disabled, children, style, leading, trailing, onClick, type = 'button' }: ButtonProps) {
  const kindStyles: Record<Kind, CSSProperties> = {
    primary:   { background: disabled ? 'rgba(15,23,42,0.06)' : T.accent, color: disabled ? T.textOff : '#373C46' },
    secondary: { background: T.surface, color: T.text, border: `1px solid ${T.border2}` },
    ghost:     { background: 'rgba(15,23,42,0.04)', color: T.text },
    danger:    { background: T.badSoft, color: T.bad },
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: HEIGHTS[size],
        padding: PADDING[size],
        width: full ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: FONT_SIZES[size],
        fontWeight: 600,
        letterSpacing: -0.1,
        borderRadius: 10,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: FONT,
        transition: 'background .12s, opacity .12s',
        boxSizing: 'border-box',
        opacity: disabled ? 0.6 : 1,
        ...kindStyles[kind],
        ...style,
      }}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
}
