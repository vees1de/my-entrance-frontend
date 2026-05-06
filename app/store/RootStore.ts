import { AuthStore } from './AuthStore'
import { ReviewFormStore } from './ReviewFormStore'
import { CleanerStore } from './CleanerStore'
import { ManagerStore } from './ManagerStore'
import { ReviewsStore } from './ReviewsStore'
import { CleanersStore } from './CleanersStore'

export class RootStore {
  auth: AuthStore
  reviewForm: ReviewFormStore
  cleaner: CleanerStore
  manager: ManagerStore
  reviews: ReviewsStore
  cleaners: CleanersStore

  constructor() {
    this.auth = new AuthStore()
    this.reviewForm = new ReviewFormStore()
    this.cleaner = new CleanerStore(this)
    this.manager = new ManagerStore()
    this.reviews = new ReviewsStore()
    this.cleaners = new CleanersStore()
  }
}
