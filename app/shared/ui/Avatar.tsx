import { T, FONT } from '../tokens'

interface AvatarProps {
  name?: string
  size?: number
}

export function Avatar({ name = '?', size = 32 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${T.accent}22`,
        color: T.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 600,
        letterSpacing: 0.2,
        fontFamily: FONT,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
