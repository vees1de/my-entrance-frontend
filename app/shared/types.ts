export type Rating = 'bad' | 'ok' | 'good'
export type CleanerStatus = 'not_started' | 'in_progress' | 'done'

export interface Review {
  id: string
  entranceId: string
  entrance: number
  floor: number
  rating: Rating
  comment?: string
  photoUrl?: string
  cleanerId?: string
  cleanerName?: string
  createdAt: string
}

export interface CleaningRecord {
  id: string
  cleanerId: string
  entranceId: string
  floor: number
  photoUrl: string
  createdAt: string
}

export interface Cleaner {
  id: string
  name: string
  phone: string
  entranceId: string
  entrance: number
  address: string
  status: CleanerStatus
  floorsCompleted: number
  floorsTotal: number
  lastCleaningAt?: string
  lastPhotoUrl?: string
  badReviewsToday: number
  totalReviews: number
  shift: string
}

export interface DayMetrics {
  cleaningsDone: number
  cleaningsPlanned: number
  reviewsTotal: number
  reviewsBad: number
  activecleaners: number
  weeklyAvgRating: number
}

export interface Entrance {
  id: string
  number: number
  address: string
  floorsTotal: number
}

export type QrLayout = 'one-per-page' | 'grid-2x3'

export interface QrGenerateRequest {
  entranceId: string
  floors: number[]
  options?: {
    title?: string
    subtitle?: string
    footer?: string
    layout?: QrLayout
  }
}

export interface ReviewFilters {
  rating?: Rating | ''
  entranceId?: string
  cleanerId?: string
  dateFrom?: string
  dateTo?: string
  hasPhoto?: boolean
}

export interface LoginCredentials {
  login: string
  password: string
}

export interface AuthResponse {
  token: string
  role: 'cleaner' | 'manager'
  userId: string
  name: string
  entranceId?: string
}

export interface SubmitReviewDto {
  entranceId: string
  floor: number
  rating: Rating
  comment?: string
  photo?: File
}

export interface SubmitCleaningDto {
  cleanerId: string
  entranceId: string
  floor: number
  photo: File
}
