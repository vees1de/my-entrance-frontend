import type { CSSProperties } from 'react'
import { T, FONT } from '../tokens'

type Tone = 'good' | 'ok' | 'bad' | 'not_started' | 'in_progress' | 'done' | 'neutral'

const TONE_MAP: Record<Tone, { fg: string; bg: string }> = {
  good:        { fg: T.good, bg: T.goodSoft },
  ok:          { fg: T.warn, bg: T.warnSoft },
  bad:         { fg: T.bad,  bg: T.badSoft  },
  in_progress: { fg: T.warn, bg: T.warnSoft },
  done:        { fg: T.good, bg: T.goodSoft },
  not_started: { fg: T.bad,  bg: T.badSoft  },
  neutral:     { fg: T.textMute, bg: 'rgba(154,164,183,0.12)' },
}

interface BadgeProps {
  variant: Tone
  children: React.ReactNode
  style?: CSSProperties
}

export function Badge({ variant, children, style }: BadgeProps) {
  const { fg, bg } = TONE_MAP[variant] ?? TONE_MAP.neutral
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 8px',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.1,
        borderRadius: 4,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        fontFamily: FONT,
        background: bg,
        color: fg,
        ...style,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg, flexShrink: 0 }} />
      {children}
    </span>
  )
}
