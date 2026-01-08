import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
}

// Shop API
export const shopApi = {
  getCategories: () => api.get('/shop/categories'),
  getCategoryProducts: (categoryId, params) =>
    api.get(`/shop/categories/${categoryId}/products`, { params }),
  getProducts: (params) => api.get('/shop/products', { params }),
  getProduct: (id) => api.get(`/shop/products/${id}`),
  getFeaturedProducts: () => api.get('/shop/products/featured'),
  getNewProducts: () => api.get('/shop/products/new'),
}

// Order API
export const orderApi = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  checkout: (data) => api.post('/orders/checkout', data),
  applyPromotion: (data) => api.post('/orders/apply-promotion', data),
  exportOrders: () => api.get('/orders/export'),
}

// Deposit API
export const depositApi = {
  getBalance: () => api.get('/deposit/balance'),
  getTransactions: (params) => api.get('/deposit/transactions', { params }),
  createDeposit: (data) => api.post('/deposit/create', data),
}

// Admin API
export const adminApi = {
  // Categories
  getCategories: (params) => api.get('/admin/categories', { params }),
  getAllCategories: () => api.get('/admin/categories/all'),
  getCategory: (id) => api.get(`/admin/categories/${id}`),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.post(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Product Accounts (Stock management)
  getAccounts: (productId) => api.get(`/admin/products/${productId}/accounts`),
  addAccounts: (productId, data) => api.post(`/admin/products/${productId}/accounts`, data),
  deleteAccount: (productId, accountId) => api.delete(`/admin/products/${productId}/accounts/${accountId}`),
  clearAccounts: (productId) => api.post(`/admin/products/${productId}/accounts/clear`),
  searchAccount: (query) => api.get('/admin/accounts/search', { params: { q: query } }),

  // Promotions
  getPromotions: (params) => api.get('/admin/promotions', { params }),
  getPromotion: (id) => api.get(`/admin/promotions/${id}`),
  createPromotion: (data) => api.post('/admin/promotions', data),
  updatePromotion: (id, data) => api.put(`/admin/promotions/${id}`, data),
  deletePromotion: (id) => api.delete(`/admin/promotions/${id}`),
  togglePromotion: (id) => api.patch(`/admin/promotions/${id}/toggle`),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  getOrderStats: (params) => api.get('/admin/orders/statistics', { params }),

  // Transactions
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getTransaction: (id) => api.get(`/admin/transactions/${id}`),
  getTransactionStats: () => api.get('/admin/transactions/statistics'),
  manualDeposit: (data) => api.post('/admin/transactions/deposit', data),
}
