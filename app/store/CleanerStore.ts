import { makeAutoObservable } from 'mobx'
import type { CleaningRecord, CleanerStatus } from '../shared/types'
import { cleaningsApi } from '../shared/api/index'
import type { RootStore } from './RootStore'

export class CleanerStore {
  todayRecords: CleaningRecord[] = []
  status: CleanerStatus = 'not_started'
  isSubmitting = false
  isLoading = false
  error = ''

  constructor(private root: RootStore) {
    makeAutoObservable(this)
  }

  async loadToday() {
    this.isLoading = true
    this.error = ''
    try {
      const records = await cleaningsApi.getToday()
      this.todayRecords = records
      this.status = records.length === 0 ? 'not_started' : 'in_progress'
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка загрузки'
    } finally {
      this.isLoading = false
    }
  }

  async submitCleaning(floor: number, photo: File, entranceId?: string) {
    const resolvedEntranceId = entranceId ?? this.root.auth.entranceId
    if (!this.root.auth.userId || !resolvedEntranceId) {
      throw new Error('Нет данных о подъезде')
    }
    this.isSubmitting = true
    this.error = ''
    try {
      const record = await cleaningsApi.submit({
        cleanerId: this.root.auth.userId,
        entranceId: resolvedEntranceId,
        floor,
        photo,
      })
      this.todayRecords = [record, ...this.todayRecords]
      this.status = 'in_progress'
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка отправки'
      throw e
    } finally {
      this.isSubmitting = false
    }
  }
}
