/**
 * API layer — toggle VITE_USE_MOCK=true in .env to use mock data.
 * To switch to real API: set VITE_USE_MOCK=false and implement the real* functions below.
 *
 * Required real API endpoints:
 *   POST   /auth/login          — LoginCredentials → AuthResponse
 *   POST   /reviews             — multipart/form-data (SubmitReviewDto) → Review
 *   GET    /reviews             — ?rating&entranceId&cleanerId&hasPhoto → Review[]
 *   POST   /cleanings           — multipart/form-data (SubmitCleaningDto) → CleaningRecord
 *   GET    /cleanings/today     — ?cleanerId → CleaningRecord[]
 *   GET    /cleaners            — → Cleaner[]
 *   GET    /metrics/day         — → DayMetrics
 */

import type {
  LoginCredentials,
  SubmitReviewDto,
  SubmitCleaningDto,
  ReviewFilters,
} from '../types'
import {
  mockAuth,
  mockReviewsApi,
  mockCleaningsApi,
  mockCleanersApi,
  mockMetricsApi,
} from './mock'
import apiClient from './client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// ── Real API implementations ───────────────────────────────────

const realAuth = {
  login: (creds: LoginCredentials) =>
    apiClient.post('/auth/login', creds).then((r) => r.data),
}

const realReviewsApi = {
  submit: (data: SubmitReviewDto) => {
    const form = new FormData()
    form.append('entranceId', data.entranceId)
    form.append('floor', String(data.floor))
    form.append('rating', data.rating)
    if (data.comment) form.append('comment', data.comment)
    if (data.photo) form.append('photo', data.photo)
    return apiClient.post('/reviews', form).then((r) => r.data)
  },
  getAll: (filters: ReviewFilters) =>
    apiClient.get('/reviews', { params: filters }).then((r) => r.data),
}

const realCleaningsApi = {
  submit: (data: SubmitCleaningDto) => {
    const form = new FormData()
    form.append('cleanerId', data.cleanerId)
    form.append('entranceId', data.entranceId)
    form.append('floor', String(data.floor))
    form.append('photo', data.photo)
    return apiClient.post('/cleanings', form).then((r) => r.data)
  },
  getToday: (cleanerId: string) =>
    apiClient.get('/cleanings/today', { params: { cleanerId } }).then((r) => r.data),
}

const realCleanersApi = {
  getAll: () => apiClient.get('/cleaners').then((r) => r.data),
}

const realMetricsApi = {
  getDay: () => apiClient.get('/metrics/day').then((r) => r.data),
}

// ── Exported API (swaps between mock and real) ─────────────────

export const authApi = USE_MOCK ? mockAuth : realAuth
export const reviewsApi = USE_MOCK ? mockReviewsApi : realReviewsApi
export const cleaningsApi = USE_MOCK ? mockCleaningsApi : realCleaningsApi
export const cleanersApi = USE_MOCK ? mockCleanersApi : realCleanersApi
export const metricsApi = USE_MOCK ? mockMetricsApi : realMetricsApi
