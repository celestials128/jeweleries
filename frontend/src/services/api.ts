import axios from 'axios'

const configuredApiUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

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
  register: (username: string, email: string, password: string) => apiClient.post('/auth/register', { username, email, password }),
  login: (username: string, password: string) => apiClient.post('/auth/login', { username, password }),
  me: () => apiClient.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (usernameOrEmail: string) =>
    apiClient.post('/auth/forgot-password', { usernameOrEmail }),
  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword })
}

export const productAPI = {
  getAll: (params?: { type?: string; section?: string; limit?: number }) => apiClient.get('/products', { params }),
  getNewArrivals: (perType: number = 3) => apiClient.get('/products/new-arrivals', { params: { perType } }),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  create: (product: any) => apiClient.post('/admin/products', product),
  update: (id: number, product: any) => apiClient.put(`/admin/products/${id}`, product),
  delete: (id: number) => apiClient.delete(`/admin/products/${id}`)
}

export const productTypeAPI = {
  getAll: () => apiClient.get('/product-types'),
  getAllAdmin: () => apiClient.get('/admin/product-types'),
  create: (payload: { name: string; description?: string }) => apiClient.post('/admin/product-types', payload),
  update: (id: number, payload: { name: string; description?: string }) => apiClient.put(`/admin/product-types/${id}`, payload),
  delete: (id: number) => apiClient.delete(`/admin/product-types/${id}`)
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
  getAllAdmin: () => apiClient.get('/admin/orders'),
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  create: (items: any[], paymentMethod: string = 'CASH_ON_DELIVERY', discountCode?: string) =>
    apiClient.post('/orders', { items, paymentMethod, discountCode }),
  claim: (id: number) => apiClient.post(`/orders/${id}/claim`),
  updateStatus: (id: number, status: string) => apiClient.put(`/orders/${id}/status`, { status })
}

export const adminUserAPI = {
  getAll: () => apiClient.get('/admin/users'),
  getOrders: (userId: number) => apiClient.get(`/admin/users/${userId}/orders`)
}

export const netopiaAPI = {
  getStatus: () => apiClient.get('/payments/netopia/status'),
  startCheckout: (payload: {
    items: Array<{ productId: number; quantity: number }>
    billing: {
      firstName: string
      lastName: string
      email: string
      phone: string
      country: string
      city: string
      address: string
      postalCode: string
    }
    returnUrl: string
    discountCode?: string
  }) => apiClient.post('/payments/netopia/start', payload)
}

export const stripeAPI = {
  getStatus: () => apiClient.get('/payments/stripe/status'),
  startCheckout: (payload: {
    items: Array<{ productId: number; quantity: number }>
    successUrl?: string
    cancelUrl?: string
    discountCode?: string
  }) => apiClient.post('/payments/stripe/start', payload)
}

export const discountAPI = {
  getAll: () => apiClient.get('/admin/discount-codes'),
  create: (payload: any) => apiClient.post('/admin/discount-codes', payload),
  delete: (id: number) => apiClient.delete(`/admin/discount-codes/${id}`),
  toggle: (id: number) => apiClient.patch(`/admin/discount-codes/${id}/toggle`),
  validate: (code: string, total: number) => apiClient.post('/discount-codes/validate', { code, total })
}

export const settingsAPI = {
  getPublic: () => apiClient.get('/settings'),
  getAdmin: () => apiClient.get('/admin/settings'),
  setShippingFee: (shippingFee: number) => apiClient.post('/admin/settings/shipping-fee', { shippingFee })
}

export default apiClient
