import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      const isPublic =
        path === '/' || path === '/review' || path.startsWith('/review/') || path.startsWith('/r/') || path.endsWith('/login')
      if (!isPublic) {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('userId')
        localStorage.removeItem('userName')
        window.location.href = '/'
      }
    }
    return Promise.reject(err)
  },
)

export default apiClient
