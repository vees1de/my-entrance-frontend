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
    if (!this.root.auth.userId) return
    this.isLoading = true
    this.error = ''
    try {
      const records = await cleaningsApi.getToday(this.root.auth.userId)
      this.todayRecords = records
      if (records.length === 0) {
        this.status = 'not_started'
      } else if (records.length >= 5) {
        this.status = 'done'
      } else {
        this.status = 'in_progress'
      }
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка загрузки'
    } finally {
      this.isLoading = false
    }
  }

  async submitCleaning(floor: number, photo: File) {
    if (!this.root.auth.userId || !this.root.auth.entranceId) return
    this.isSubmitting = true
    this.error = ''
    try {
      const record = await cleaningsApi.submit({
        cleanerId: this.root.auth.userId,
        entranceId: this.root.auth.entranceId,
        floor,
        photo,
      })
      this.todayRecords.push(record)
      if (this.todayRecords.length >= 5) {
        this.status = 'done'
      } else {
        this.status = 'in_progress'
      }
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка отправки'
      throw e
    } finally {
      this.isSubmitting = false
    }
  }
}
