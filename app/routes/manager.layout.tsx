import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Avatar } from '../shared/ui/Avatar'
import { Icons } from '../shared/ui/icons'

const NAV_ITEMS = [
  { id: 'overview', path: '/manager/overview', label: 'Обзор', icon: Icons.navOverview },
  { id: 'reviews', path: '/manager/reviews', label: 'Отзывы', icon: Icons.navReviews },
  { id: 'cleaners', path: '/manager/cleaners', label: 'Уборщицы', icon: Icons.navCleaners },
  { id: 'entrances', path: '/manager/entrances', label: 'Дома', icon: Icons.navBuilding },
  { id: 'qr', path: '/manager/qr', label: 'QR-коды', icon: Icons.navQr },
]

export default observer(function ManagerLayout() {
  const { auth } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!auth.hasHydrated) return
    if (!auth.isAuthenticated || auth.role !== 'manager') {
      navigate('/manager/login', { replace: true })
    }
  }, [auth.hasHydrated, auth.isAuthenticated, auth.role])

  if (!auth.hasHydrated || !auth.isAuthenticated) return null

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: T.bg2, borderRight: `1px solid ${T.divider}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.divider}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, color: '#373C46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>М</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2, color: T.text }}>Мой подъезд</div>
            <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>УК «Сервис-Дом»</div>
          </div>
        </div>

        <nav style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map((n) => {
            const active = location.pathname === n.path
            return (
              <NavLink
                key={n.id}
                to={n.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  fontSize: 13.5, fontWeight: active ? 600 : 500,
                  color: active ? T.text : T.textMute,
                  background: active ? T.surface : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <span style={{ color: active ? T.accent : T.textDim, display: 'flex' }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div style={{ padding: 12, borderTop: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={auth.userName} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.text }}>{auth.userName}</div>
            <div style={{ fontSize: 11, color: T.textDim }}>менеджер</div>
          </div>
          <button
            type="button"
            onClick={() => { auth.logout(); navigate('/manager/login') }}
            style={{ fontSize: 11, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}
            title="Выйти"
          >
            ✕
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
})
