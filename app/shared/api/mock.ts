import type {
  Review,
  CleaningRecord,
  Cleaner,
  DayMetrics,
  AuthResponse,
  SubmitReviewDto,
  SubmitCleaningDto,
  ReviewFilters,
  LoginCredentials,
} from '../types'

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms))

let reviewId = 100
let cleaningId = 100

const MOCK_REVIEWS: Review[] = [
  { id: '1', entranceId: 'e2', entrance: 2, floor: 4, rating: 'bad', comment: 'Не помыли пол на 4 этаже, пыль на перилах осталась.', photoUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 420%22%3E%3Crect width=%22640%22 height=%22420%22 fill=%22%23eef1f6%22/%3E%3Crect x=%2272%22 y=%2270%22 width=%22496%22 height=%22280%22 rx=%2218%22 fill=%22%23fff%22 stroke=%22%23cbd5e1%22 stroke-width=%224%22/%3E%3Cpath d=%22M110 308l120-120 86 86 68-68 146 146H110z%22 fill=%22%2396ea28%22/%3E%3Ccircle cx=%22476%22 cy=%22132%22 r=%2242%22 fill=%22%23f59e0b%22/%3E%3C/svg%3E', cleanerId: 'c1', cleanerName: 'Анна Кравченко', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '2', entranceId: 'e1', entrance: 1, floor: 2, rating: 'bad', comment: 'Лужа на лестничной клетке, мусор в углу не убран.', cleanerId: 'c2', cleanerName: 'Елена Митина', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: '3', entranceId: 'e1', entrance: 1, floor: 3, rating: 'ok', comment: 'В целом нормально, но окно немытое.', cleanerId: 'c3', cleanerName: 'Ирина Соколова', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: '4', entranceId: 'e3', entrance: 3, floor: 5, rating: 'ok', comment: 'Запах хлорки слишком сильный.', cleanerId: 'c1', cleanerName: 'Анна Кравченко', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString() },
  { id: '5', entranceId: 'e1', entrance: 1, floor: 2, rating: 'good', comment: 'Чисто, всё хорошо. Спасибо.', cleanerId: 'c4', cleanerName: 'Светлана Новак', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: '6', entranceId: 'e1', entrance: 1, floor: 5, rating: 'good', cleanerId: 'c3', cleanerName: 'Ирина Соколова', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6.5).toISOString() },
  { id: '7', entranceId: 'e3', entrance: 3, floor: 4, rating: 'good', cleanerId: 'c5', cleanerName: 'Татьяна Белова', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString() },
  { id: '8', entranceId: 'e3', entrance: 3, floor: 3, rating: 'good', cleanerId: 'c5', cleanerName: 'Татьяна Белова', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7.5).toISOString() },
]

const MOCK_CLEANERS: Cleaner[] = [
  { id: 'c1', name: 'Анна Кравченко', phone: '+7 905 ••• 12 38', entranceId: 'e2', entrance: 2, address: 'Ленина 14 · подъезд 2', status: 'in_progress', floorsCompleted: 4, floorsTotal: 5, lastCleaningAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), badReviewsToday: 1, totalReviews: 86, shift: '09:00–17:00' },
  { id: 'c2', name: 'Елена Митина', phone: '+7 916 ••• 04 71', entranceId: 'e1', entrance: 1, address: 'Гагарина 7 · подъезд 1', status: 'in_progress', floorsCompleted: 3, floorsTotal: 4, lastCleaningAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(), badReviewsToday: 2, totalReviews: 142, shift: '09:00–17:00' },
  { id: 'c3', name: 'Ирина Соколова', phone: '+7 903 ••• 88 22', entranceId: 'e1', entrance: 1, address: 'Ленина 14 · подъезд 1', status: 'done', floorsCompleted: 5, floorsTotal: 5, lastCleaningAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), badReviewsToday: 0, totalReviews: 201, shift: '09:00–17:00' },
  { id: 'c4', name: 'Светлана Новак', phone: '+7 967 ••• 19 84', entranceId: 'e3', entrance: 3, address: 'Победы 22 · подъезд 1', status: 'done', floorsCompleted: 5, floorsTotal: 5, lastCleaningAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), badReviewsToday: 0, totalReviews: 263, shift: '07:00–11:00' },
  { id: 'c5', name: 'Татьяна Белова', phone: '+7 925 ••• 51 09', entranceId: 'e3', entrance: 3, address: 'Победы 22 · подъезд 3', status: 'done', floorsCompleted: 6, floorsTotal: 6, lastCleaningAt: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString(), badReviewsToday: 0, totalReviews: 178, shift: '09:00–17:00' },
  { id: 'c6', name: 'Ольга Семёнова', phone: '+7 985 ••• 33 14', entranceId: 'e2', entrance: 2, address: 'Мира 9 · подъезд 2', status: 'not_started', floorsCompleted: 0, floorsTotal: 5, badReviewsToday: 0, totalReviews: 41, shift: '13:00–17:00' },
  { id: 'c7', name: 'Марина Петрова', phone: '+7 921 ••• 76 50', entranceId: 'e2', entrance: 2, address: 'Мира 9 · подъезд 1', status: 'not_started', floorsCompleted: 0, floorsTotal: 5, badReviewsToday: 0, totalReviews: 12, shift: '14:00–18:00' },
]

let mockCleanings: CleaningRecord[] = [
  { id: 'r1', cleanerId: 'c1', entranceId: 'e2', floor: 1, photoUrl: '', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'r2', cleanerId: 'c1', entranceId: 'e2', floor: 2, photoUrl: '', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString() },
  { id: 'r3', cleanerId: 'c1', entranceId: 'e2', floor: 3, photoUrl: '', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { id: 'r4', cleanerId: 'c1', entranceId: 'e2', floor: 4, photoUrl: '', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
]

const MOCK_CREDS: Record<string, AuthResponse> = {
  'anna.k': { token: 'mock-cleaner-token', role: 'cleaner', userId: 'c1', name: 'Анна Кравченко', entranceId: 'e2' },
  'manager': { token: 'mock-manager-token', role: 'manager', userId: 'm1', name: 'Дмитрий Орлов' },
}

const MOCK_PASSWORDS: Record<string, string> = {
  'anna.k': '12345',
  'manager': '12345',
}

export const mockAuth = {
  login: async (creds: LoginCredentials): Promise<AuthResponse> => {
    await delay()
    const user = MOCK_CREDS[creds.login]
    if (!user || MOCK_PASSWORDS[creds.login] !== creds.password) {
      throw new Error('Неверный логин или пароль')
    }
    return user
  },
}

export const mockReviewsApi = {
  submit: async (data: SubmitReviewDto): Promise<Review> => {
    await delay()
    const review: Review = {
      id: String(++reviewId),
      entranceId: data.entranceId,
      entrance: 1,
      floor: data.floor,
      rating: data.rating,
      comment: data.comment,
      photoUrl: data.photo ? URL.createObjectURL(data.photo) : undefined,
      createdAt: new Date().toISOString(),
    }
    MOCK_REVIEWS.unshift(review)
    return review
  },
  getAll: async (filters: ReviewFilters): Promise<Review[]> => {
    await delay()
    return MOCK_REVIEWS.filter((r) => {
      if (filters.rating && r.rating !== filters.rating) return false
      if (filters.entranceId && r.entranceId !== filters.entranceId) return false
      if (filters.cleanerId && r.cleanerId !== filters.cleanerId) return false
      if (filters.hasPhoto && !r.photoUrl) return false
      return true
    })
  },
}

export const mockCleaningsApi = {
  submit: async (data: SubmitCleaningDto): Promise<CleaningRecord> => {
    await delay()
    const record: CleaningRecord = {
      id: String(++cleaningId),
      cleanerId: data.cleanerId,
      entranceId: data.entranceId,
      floor: data.floor,
      photoUrl: URL.createObjectURL(data.photo),
      createdAt: new Date().toISOString(),
    }
    mockCleanings.push(record)
    return record
  },
  getToday: async (cleanerId: string): Promise<CleaningRecord[]> => {
    await delay()
    return mockCleanings.filter((r) => r.cleanerId === cleanerId)
  },
}

export const mockCleanersApi = {
  getAll: async (): Promise<Cleaner[]> => {
    await delay()
    return MOCK_CLEANERS
  },
}

export const mockMetricsApi = {
  getDay: async (): Promise<DayMetrics> => {
    await delay()
    return {
      cleaningsDone: 32,
      cleaningsPlanned: 38,
      reviewsTotal: 47,
      reviewsBad: 4,
      activecleaners: 5,
      weeklyAvgRating: 79,
    }
  },
}
