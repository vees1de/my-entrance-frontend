import { makeAutoObservable, computed } from 'mobx'
import type { DayMetrics, Review, Cleaner } from '../shared/types'
import { metricsApi, reviewsApi, cleanersApi } from '../shared/api/index'

export class ManagerStore {
  metrics: DayMetrics | null = null
  badReviews: Review[] = []
  cleaners: Cleaner[] = []
  isLoading = false
  error = ''

  constructor() {
    makeAutoObservable(this)
  }

  get activecleaners() {
    return this.cleaners.filter((c) => c.status !== 'not_started')
  }

  async loadOverview() {
    this.isLoading = true
    this.error = ''
    try {
      const [metrics, reviews, cleaners] = await Promise.all([
        metricsApi.getDay(),
        reviewsApi.getAll({ rating: 'bad' }),
        cleanersApi.getAll(),
      ])
      this.metrics = metrics
      this.badReviews = reviews
      this.cleaners = cleaners
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка загрузки'
    } finally {
      this.isLoading = false
    }
  }
}
