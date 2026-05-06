import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store/StoreContext'
import { T, FONT } from '../shared/tokens'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Icons } from '../shared/ui/icons'
import { Spinner } from '../shared/ui/Spinner'

export function meta() {
  return [{ title: 'Мой подъезд — вход для менеджера' }]
}

export default observer(function ManagerLogin() {
  const { auth } = useStore()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (auth.isAuthenticated && auth.role === 'manager') {
      navigate('/manager/overview', { replace: true })
    }
  }, [auth.isAuthenticated, auth.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await auth.login({ login, password })
      navigate('/manager/overview', { replace: true })
    } catch {
      // error shown from store
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: FONT }}>
      <div style={{ width: 380, padding: '40px 32px', background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accent, color: '#373C46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>М</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Мой подъезд</div>
            <div style={{ fontSize: 11, color: T.textDim }}>менеджер УК</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: T.text, marginBottom: 24 }}>Вход</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Логин" value={login} onChange={setLogin} placeholder="manager" icon={Icons.user} />
          <Input label="Пароль" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={Icons.lock} />

          {auth.error && (
            <div style={{ fontSize: 13, color: T.bad }}>{auth.error}</div>
          )}

          <Button type="submit" full size="lg" disabled={auth.isLoading || !login || !password} style={{ marginTop: 8, height: 48 }}>
            {auth.isLoading ? <Spinner size={18} color="#373C46" /> : 'Войти'}
          </Button>
        </form>

        <div style={{ marginTop: 16, fontSize: 12, color: T.textDim, textAlign: 'center' }}>
          Demo: логин <b>manager</b>, пароль <b>12345</b>
        </div>
      </div>
    </div>
  )
})
