import { Link } from 'react-router'
import { T, FONT } from '../shared/tokens'
import { Icons } from '../shared/ui/icons'

export function meta() {
  return [{ title: 'Мой подъезд — вход' }]
}

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        fontFamily: FONT,
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '40px 32px',
          background: T.surface,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: T.accent,
              color: '#373C46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            М
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Мой подъезд</div>
            <div style={{ fontSize: 12, color: T.textDim }}>контроль качества уборки</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: T.text, marginBottom: 6 }}>
          Войти
        </div>
        <div style={{ fontSize: 14, color: T.textDim, marginBottom: 24 }}>
          Выберите, как вы хотите войти
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RoleLink
            to="/manager/login"
            icon={Icons.navOverview}
            title="Я менеджер"
            subtitle="Дашборд, отзывы, контроль уборщиц"
          />
          <RoleLink
            to="/cleaner/login"
            icon={Icons.navCleaners}
            title="Я уборщица"
            subtitle="Загрузить фото-отчёт об уборке"
          />
        </div>
      </div>
    </div>
  )
}

function RoleLink({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 12,
        background: T.surface2,
        border: `1px solid ${T.border}`,
        textDecoration: 'none',
        color: T.text,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: T.surface,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `1px solid ${T.border}`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
        <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 2 }}>{subtitle}</div>
      </div>
      <span style={{ color: T.textDim, fontSize: 18, lineHeight: 1 }}>→</span>
    </Link>
  )
}
