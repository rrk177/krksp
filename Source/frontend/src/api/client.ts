import axios from 'axios'

// Базовый URL бэкенда
const API_URL = 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Добавляем токен в каждый запрос, если он есть в localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Если сервер вернул 401 — чистим токен и редиректим на логин
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Методы для работы с авторизацией
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  me: () =>
    api.get('/auth/me'),
}

// Методы для работы с пользователями
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
}

// Методы для работы с коровами
export const cowsApi = {
  getAll: (params?: any) => api.get('/cows', { params }),
  getStats: () => api.get('/cows/stats'),
  getById: (id: number) => api.get(`/cows/${id}`),
  create: (data: any) => api.post('/cows', data),
  update: (id: number, data: any) => api.put(`/cows/${id}`, data),
  remove: (id: number) => api.delete(`/cows/${id}`),
}

// Методы для работы с фермами
export const farmsApi = {
  getAll: () => api.get('/farms'),
  getById: (id: number) => api.get(`/farms/${id}`),
  create: (data: any) => api.post('/farms', data),
  update: (id: number, data: any) => api.put(`/farms/${id}`, data),
  remove: (id: number) => api.delete(`/farms/${id}`),
}

// Методы для работы с записями надоя
export const milkApi = {
  getAll: (cowId?: number) => api.get('/milk-records', { params: cowId ? { cowId } : {} }),
  getTotalByDate: (date: string) => api.get('/milk-records/total', { params: { date } }),
  create: (data: any) => api.post('/milk-records', data),
  remove: (id: number) => api.delete(`/milk-records/${id}`),
}
