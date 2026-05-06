import { makeAutoObservable } from 'mobx'
import type { Cleaner } from '../shared/types'
import { cleanersApi } from '../shared/api/index'

export class CleanersStore {
  cleaners: Cleaner[] = []
  isLoading = false
  error = ''

  constructor() {
    makeAutoObservable(this)
  }

  async loadAll() {
    this.isLoading = true
    this.error = ''
    try {
      this.cleaners = await cleanersApi.getAll()
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка загрузки'
    } finally {
      this.isLoading = false
    }
  }
}
