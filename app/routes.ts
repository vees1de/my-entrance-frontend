import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('review/:entranceId/:floor', 'routes/review.tsx'),
  route('cleaner/login', 'routes/cleaner.login.tsx'),
  route('cleaner/dashboard', 'routes/cleaner.dashboard.tsx'),
  route('manager/login', 'routes/manager.login.tsx'),
  layout('routes/manager.layout.tsx', [
    route('manager/overview', 'routes/manager.overview.tsx'),
    route('manager/reviews', 'routes/manager.reviews.tsx'),
    route('manager/cleaners', 'routes/manager.cleaners.tsx'),
    route('manager/qr', 'routes/manager.qr.tsx'),
  ]),
] satisfies RouteConfig
