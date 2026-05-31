import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'

// Тип данных пользователя
interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

// Провайдер авторизации — оборачивает всё приложение
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // При загрузке страницы читаем пользователя из localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  // Вход — получаем токен, сохраняем в localStorage
  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    const { access_token, user: userData } = response.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // Выход — чистим localStorage
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // Проверка роли пользователя
  const isRole = (...roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
