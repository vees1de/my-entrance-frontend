import { makeAutoObservable, reaction } from 'mobx'
import type { Review, ReviewFilters } from '../shared/types'
import { reviewsApi } from '../shared/api/index'

export class ReviewsStore {
  reviews: Review[] = []
  filters: ReviewFilters = {}
  isLoading = false
  error = ''

  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    makeAutoObservable(this)
    reaction(
      () => JSON.stringify(this.filters),
      () => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => this.loadReviews(), 300)
      }
    )
  }

  setFilter<K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) {
    this.filters = { ...this.filters, [key]: value }
  }

  clearFilters() {
    this.filters = {}
  }

  async loadReviews() {
    this.isLoading = true
    this.error = ''
    try {
      const reviews = await reviewsApi.getAll(this.filters)
      this.reviews = reviews
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка загрузки'
    } finally {
      this.isLoading = false
    }
  }
}
