/**
 * API layer — set VITE_USE_MOCK=true at build time to use mock data; otherwise the
 * real backend is called via VITE_API_URL.
 *
 * Server uses UPPERCASE Rating (BAD/OK/GOOD) and roles (MANAGER/CLEANER); the frontend
 * uses lowercase. The server returns `entrance` as an object and `cleaners` as a list,
 * `/reviews` returns `{ items, total, ... }` — the mappers below normalize all of that
 * into the flat shapes in shared/types.ts so stores/components stay simple.
 */

import type {
  AuthResponse,
  Building,
  Cleaner,
  CleanerStatus,
  CleaningRecord,
  DayMetrics,
  Entrance,
  LoginCredentials,
  QrGenerateBuildingRequest,
  QrGenerateRequest,
  QrResolveResponse,
  Rating,
  Review,
  ReviewFilters,
  Street,
  SubmitCleaningDto,
  SubmitReviewDto,
} from '../types'
import {
  mockAuth,
  mockCleanersApi,
  mockCleaningsApi,
  mockMetricsApi,
  mockReviewsApi,
} from './mock'
import apiClient from './client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ── Mappers ─────────────────────────────────────────────────────

const toLowerRating = (r: string): Rating =>
  (r?.toLowerCase?.() ?? 'ok') as Rating

const toUpperRating = (r: Rating): string => r.toUpperCase()

interface ServerReview {
  id: string
  entranceId: string
  entrance: {
    id: string
    number: number
    address: string
    streetName?: string | null
    buildingNumber?: string | null
    entranceNumber?: number
    floorsTotal?: number | null
  }
  address?: string
  streetName?: string | null
  buildingNumber?: string | null
  entranceNumber?: number
  floorsTotal?: number | null
  floor: number
  rating: 'BAD' | 'OK' | 'GOOD'
  comment: string | null
  photoUrl: string | null
  cleaners: Array<{ id: string; name: string }>
  createdAt: string
}

const mapReview = (r: ServerReview): Review => ({
  id: r.id,
  entranceId: r.entranceId,
  entrance: r.entranceNumber ?? r.entrance?.entranceNumber ?? r.entrance?.number ?? 0,
  address: r.address ?? r.entrance?.address,
  streetName: r.streetName ?? r.entrance?.streetName ?? undefined,
  buildingNumber: r.buildingNumber ?? r.entrance?.buildingNumber ?? undefined,
  entranceNumber: r.entranceNumber ?? r.entrance?.entranceNumber ?? r.entrance?.number,
  floorsTotal: r.floorsTotal ?? r.entrance?.floorsTotal ?? undefined,
  floor: r.floor,
  rating: toLowerRating(r.rating),
  comment: r.comment ?? undefined,
  photoUrl: r.photoUrl ?? undefined,
  cleanerId: r.cleaners?.[0]?.id,
  cleanerName: r.cleaners?.length
    ? r.cleaners.map((c) => c.name).join(', ')
    : undefined,
  createdAt: r.createdAt,
})

interface ServerCleaner {
  id: string
  name: string
  phone: string | null
  shift: string | null
  entrances: Array<{
    id: string
    buildingId?: string
    number: number
    address: string
    streetName?: string | null
    buildingNumber?: string | null
    entranceNumber?: number
    floorsTotal: number
  }>
  floorsPlanned: number
  floorsCompleted: number
  status: CleanerStatus
  lastCleaningAt: string | null
  lastPhotoUrl: string | null
  badReviewsToday: number
  totalReviews: number
}

const mapCleaner = (c: ServerCleaner): Cleaner => {
  const first = c.entrances?.[0]
  return {
    id: c.id,
    name: c.name,
    phone: c.phone ?? '',
    entranceId: first?.id ?? '',
    entrance: first?.number ?? 0,
    address:
      c.entrances.length > 1
        ? `${c.entrances.length} подъезда`
        : first?.address ?? '—',
    status: c.status,
    floorsCompleted: c.floorsCompleted,
    floorsTotal: c.floorsPlanned,
    lastCleaningAt: c.lastCleaningAt ?? undefined,
    lastPhotoUrl: c.lastPhotoUrl ?? undefined,
    badReviewsToday: c.badReviewsToday,
    totalReviews: c.totalReviews,
    shift: c.shift ?? '',
  }
}

interface ServerMetrics {
  cleaningsDone: number
  cleaningsPlanned: number
  reviewsTotal: number
  reviewsBad: number
  activeCleaners: number
  totalCleaners: number
  weeklyAvgRating: number | null
}

const mapMetrics = (m: ServerMetrics): DayMetrics => ({
  cleaningsDone: m.cleaningsDone,
  cleaningsPlanned: m.cleaningsPlanned,
  reviewsTotal: m.reviewsTotal,
  reviewsBad: m.reviewsBad,
  activecleaners: m.activeCleaners,
  weeklyAvgRating: m.weeklyAvgRating ?? 0,
})

interface ServerAuth {
  token: string
  role: 'MANAGER' | 'CLEANER'
  userId: string
  name: string
  entranceId?: string
}

const mapAuth = (a: ServerAuth): AuthResponse => ({
  token: a.token,
  role: a.role.toLowerCase() as AuthResponse['role'],
  userId: a.userId,
  name: a.name,
  entranceId: a.entranceId,
})

// ── Real API ────────────────────────────────────────────────────

const realAuth = {
  login: (creds: LoginCredentials) =>
    apiClient.post<ServerAuth>('/auth/login', creds).then((r) => mapAuth(r.data)),
}

const realReviewsApi = {
  submit: (data: SubmitReviewDto) => {
    const form = new FormData()
    form.append('entranceId', data.entranceId)
    form.append('floor', String(data.floor))
    form.append('rating', toUpperRating(data.rating))
    if (data.comment) form.append('comment', data.comment)
    if (data.photo) form.append('photo', data.photo)
    return apiClient.post<ServerReview>('/reviews', form).then((r) => mapReview(r.data))
  },
  getAll: (filters: ReviewFilters): Promise<Review[]> => {
    const params: Record<string, string | boolean> = {}
    if (filters.rating) params.rating = toUpperRating(filters.rating as Rating)
    if (filters.entranceId) params.entranceId = filters.entranceId
    if (filters.streetId) params.streetId = filters.streetId
    if (filters.buildingId) params.buildingId = filters.buildingId
    if (filters.cleanerId) params.cleanerId = filters.cleanerId
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo
    if (filters.hasPhoto !== undefined) params.hasPhoto = filters.hasPhoto
    return apiClient
      .get<{ items: ServerReview[] }>('/reviews', { params })
      .then((r) => r.data.items.map(mapReview))
  },
}

const realCleaningsApi = {
  submit: (data: SubmitCleaningDto) => {
    const form = new FormData()
    form.append('entranceId', data.entranceId)
    form.append('floor', String(data.floor))
    form.append('photo', data.photo)
    return apiClient.post<CleaningRecord>('/cleanings', form).then((r) => r.data)
  },
  getToday: (cleanerId?: string): Promise<CleaningRecord[]> =>
    apiClient
      .get<CleaningRecord[]>('/cleanings/today', {
        params: cleanerId ? { cleanerId } : {},
      })
      .then((r) => r.data),
}

const realCleanersApi = {
  getAll: (): Promise<Cleaner[]> =>
    apiClient.get<ServerCleaner[]>('/cleaners').then((r) => r.data.map(mapCleaner)),
}

const realMetricsApi = {
  getDay: (): Promise<DayMetrics> =>
    apiClient.get<ServerMetrics>('/metrics/day').then((r) => mapMetrics(r.data)),
}

interface ServerEntranceWithAssignments {
  id: string
  buildingId: string
  number: number
  address: string
  streetName?: string | null
  buildingNumber?: string | null
  entranceNumber?: number
  floorsTotal: number
  assignments?: Array<{ cleanerId: string; cleaner: { id: string; name: string } }>
}

interface ServerBuilding {
  id: string
  streetId: string
  number: string
  floorsTotal: number
  entrancesCount?: number | null
  createdAt?: string
  street: { id: string; name: string; city?: string | null }
}

const mapBuilding = (b: ServerBuilding): Building => ({
  id: b.id,
  streetId: b.streetId,
  number: b.number,
  floorsTotal: b.floorsTotal,
  entrancesCount: b.entrancesCount,
  address: `${b.street.name}, д. ${b.number}`,
  streetName: b.street.name,
  createdAt: b.createdAt,
})

const mapEntrance = (e: ServerEntranceWithAssignments): Entrance => ({
  id: e.id,
  buildingId: e.buildingId,
  number: e.entranceNumber ?? e.number,
  address: e.address,
  streetName: e.streetName,
  buildingNumber: e.buildingNumber,
  entranceNumber: e.entranceNumber ?? e.number,
  floorsTotal: e.floorsTotal,
  assignedCleanerIds: e.assignments?.map((a) => a.cleanerId) ?? [],
})

const realStreetsApi = {
  getAll: (): Promise<Street[]> => apiClient.get<Street[]>('/streets').then((r) => r.data),
  create: (dto: { name: string; city?: string }): Promise<Street> =>
    apiClient.post<Street>('/streets', dto).then((r) => r.data),
}

const realBuildingsApi = {
  getAll: (streetId?: string): Promise<Building[]> =>
    apiClient
      .get<ServerBuilding[]>('/buildings', { params: streetId ? { streetId } : {} })
      .then((r) => r.data.map(mapBuilding)),
  create: (dto: { streetId: string; number: string; floorsTotal: number }): Promise<Building> =>
    apiClient.post<ServerBuilding>('/buildings', dto).then((r) => mapBuilding(r.data)),
}

const realEntrancesApi = {
  getAll: (buildingId?: string): Promise<Entrance[]> =>
    apiClient
      .get<ServerEntranceWithAssignments[]>('/entrances', {
        params: buildingId ? { buildingId } : {},
      })
      .then((r) => r.data.map(mapEntrance)),
  create: (dto: { buildingId: string; number: number }): Promise<Entrance> =>
    apiClient.post<ServerEntranceWithAssignments>('/entrances', dto).then((r) => mapEntrance(r.data)),
  update: (
    id: string,
    dto: { buildingId?: string; number?: number },
  ): Promise<Entrance> =>
    apiClient.patch<ServerEntranceWithAssignments>(`/entrances/${id}`, dto).then((r) => mapEntrance(r.data)),
  remove: (id: string): Promise<void> =>
    apiClient.delete(`/entrances/${id}`).then(() => undefined),
  assign: (id: string, cleanerId: string) =>
    apiClient.post(`/entrances/${id}/assignments`, { cleanerId }).then((r) => r.data),
  unassign: (id: string, cleanerId: string) =>
    apiClient.delete(`/entrances/${id}/assignments/${cleanerId}`).then((r) => r.data),
}

const realQrApi = {
  resolve: (token: string): Promise<QrResolveResponse> =>
    apiClient.get<QrResolveResponse>(`/qr/resolve/${token}`).then((r) => r.data),
  preview: (entranceId: string, floor: number): Promise<Blob> =>
    apiClient
      .get<Blob>(`/qr/${entranceId}/${floor}`, { responseType: 'blob' })
      .then((r) => r.data),
  generate: (req: QrGenerateRequest): Promise<Blob> =>
    apiClient
      .post<Blob>('/qr/generate', req, { responseType: 'blob' })
      .then((r) => r.data),
  generateBuilding: (req: QrGenerateBuildingRequest): Promise<Blob> =>
    apiClient
      .post<Blob>('/qr/generate-building', req, { responseType: 'blob' })
      .then((r) => r.data),
}

// ── Exports ─────────────────────────────────────────────────────

export const authApi = USE_MOCK ? mockAuth : realAuth
export const reviewsApi = USE_MOCK ? mockReviewsApi : realReviewsApi
export const cleaningsApi = USE_MOCK ? mockCleaningsApi : realCleaningsApi
export const cleanersApi = USE_MOCK ? mockCleanersApi : realCleanersApi
export const metricsApi = USE_MOCK ? mockMetricsApi : realMetricsApi
export const streetsApi = realStreetsApi
export const buildingsApi = realBuildingsApi
export const entrancesApi = realEntrancesApi
export const qrApi = realQrApi
