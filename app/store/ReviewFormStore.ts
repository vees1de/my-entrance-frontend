import { makeAutoObservable } from 'mobx'
import type { Rating } from '../shared/types'
import { reviewsApi } from '../shared/api/index'

export class ReviewFormStore {
  rating: Rating | null = null
  comment = ''
  photo: File | null = null
  isSubmitting = false
  isSubmitted = false
  error = ''

  constructor() {
    makeAutoObservable(this)
  }

  get canSubmit() {
    return this.rating !== null && !this.isSubmitting
  }

  setRating(rating: Rating) {
    this.rating = rating
    this.error = ''
  }

  setComment(comment: string) {
    this.comment = comment
  }

  setPhoto(photo: File | null) {
    this.photo = photo
  }

  async submit(entranceId: string, floor: number) {
    if (!this.canSubmit || !this.rating) return
    this.isSubmitting = true
    this.error = ''
    try {
      await reviewsApi.submit({
        entranceId,
        floor,
        rating: this.rating,
        comment: this.comment || undefined,
        photo: this.photo ?? undefined,
      })
      this.isSubmitted = true
    } catch (e: any) {
      this.error = e.message ?? 'Ошибка отправки. Попробуйте ещё раз.'
    } finally {
      this.isSubmitting = false
    }
  }
}
