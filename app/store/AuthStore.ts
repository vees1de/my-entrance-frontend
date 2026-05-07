import { makeAutoObservable } from 'mobx'
import type { LoginCredentials } from '../shared/types'
import { authApi } from '../shared/api/index'

export class AuthStore {
  token = ''
  role: 'cleaner' | 'manager' | null = null
  userId = ''
  userName = ''
  entranceId = ''
  hasHydrated = false
  isLoading = false
  error = ''

  constructor() {
    makeAutoObservable(this)
  }

  hydrate() {
    if (typeof window === 'undefined') {
      this.hasHydrated = true
      return
    }
    this.token = localStorage.getItem('token') ?? ''
    this.role = (localStorage.getItem('role') as 'cleaner' | 'manager') ?? null
    this.userId = localStorage.getItem('userId') ?? ''
    this.userName = localStorage.getItem('userName') ?? ''
    this.entranceId = localStorage.getItem('entranceId') ?? ''
    this.hasHydrated = true
  }

  get isAuthenticated() {
    return Boolean(this.token)
  }

  get currentRole() {
    return this.role
  }

  async login(creds: LoginCredentials) {
    this.isLoading = true
    this.error = ''
    try {
      const res = await authApi.login(creds)
      this.token = res.token
      this.role = res.role
      this.userId = res.userId
      this.userName = res.name
      this.entranceId = res.entranceId ?? ''
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.token)
        localStorage.setItem('role', res.role)
        localStorage.setItem('userId', res.userId)
        localStorage.setItem('userName', res.name)
        localStorage.setItem('entranceId', res.entranceId ?? '')
      }
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка входа'
      throw e
    } finally {
      this.isLoading = false
    }
  }

  logout() {
    this.token = ''
    this.role = null
    this.userId = ''
    this.userName = ''
    this.entranceId = ''
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('entranceId')
    }
  }
}
