import axios from 'axios'

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'
const configuredApiUrl = (import.meta.env.VITE_API_URL || browserOrigin).replace(/\/+$/, '')

export const API_URL = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl.slice(0, -4)
  : configuredApiUrl

const API_BASE_URL = `${API_URL}/api`

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if(token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  register: (username: string, password: string) => apiClient.post('/auth/register', { username, password }),
  login: (username: string, password: string) => apiClient.post('/auth/login', { username, password })
}

export const productAPI = {
  getAll: () => apiClient.get('/products'),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  create: (product: any) => apiClient.post('/admin/products', product),
  update: (id: number, product: any) => apiClient.put(`/admin/products/${id}`, product),
  delete: (id: number) => apiClient.delete(`/admin/products/${id}`)
}

export const blogAPI = {
  getPublished: () => axios.get(`${API_BASE_URL}/blogs/published`)
}

export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('directory', 'products')

    const uploadClient = axios.create({
      baseURL: API_BASE_URL
      // Do NOT set Content-Type here — browser must set it automatically
      // with the correct multipart boundary for the server to parse the file
    })

    uploadClient.interceptors.request.use(config => {
      const token = localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      // Ensure Content-Type is not overridden by a default JSON header
      delete config.headers['Content-Type']
      return config
    })

    return uploadClient.post('/upload', formData)
  }
}

export const orderAPI = {
  getAll: () => apiClient.get('/orders'),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  create: (items: any[]) => apiClient.post('/orders', { items }),
  updateStatus: (id: number, status: string) => apiClient.put(`/orders/${id}/status`, { status })
}

export const stripeAPI = {
  createPaymentIntent: (items: Array<{ productId: number; quantity: number }>) =>
    apiClient.post('/stripe/create-payment-intent', { items })
}

export default apiClient
