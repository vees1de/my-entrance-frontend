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
  return [{ title: 'Мой подъезд — вход' }]
}

export default observer(function CleanerLogin() {
  const { auth } = useStore()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (auth.isAuthenticated && auth.role === 'cleaner') {
      navigate('/cleaner/dashboard', { replace: true })
    }
  }, [auth.isAuthenticated, auth.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await auth.login({ login, password })
      navigate('/cleaner/dashboard', { replace: true })
    } catch {
      // error shown from store
    }
  }

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: T.bg, fontFamily: FONT, color: T.text, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '32px 24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 56, marginTop: 56 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accent, color: '#373C46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: -1 }}>
            М
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1, color: T.text }}>
            Мой подъезд
          </div>
          <div style={{ fontSize: 15, color: T.textMute, marginTop: 6 }}>
            Вход для сотрудника
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Логин"
            value={login}
            onChange={setLogin}
            placeholder="anna.k"
            icon={Icons.user}
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            icon={Icons.lock}
          />

          {auth.error && (
            <div style={{ fontSize: 13, color: T.bad, fontFamily: FONT, marginTop: 4 }}>
              {auth.error}
            </div>
          )}

          <div style={{ flex: 1 }} />

          <Button
            type="submit"
            full
            size="lg"
            disabled={auth.isLoading || !login || !password}
            style={{ height: 56, fontSize: 17, borderRadius: 14, marginTop: 32 }}
          >
            {auth.isLoading ? <Spinner size={18} color="#373C46" /> : 'Войти'}
          </Button>
        </form>

        <div style={{ marginTop: 16, fontSize: 12, color: T.textDim, textAlign: 'center' }}>
          Demo: логин <b>anna.k</b>, пароль <b>12345</b>
        </div>
      </div>
    </div>
  )
})
