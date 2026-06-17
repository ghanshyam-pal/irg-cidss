// src/services/api.js
// Single axios instance — add auth headers, error interceptors here

import axios from 'axios'
import { API_BASE_URL } from '@/config'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cidss_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handler — 401 redirects to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cidss_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
