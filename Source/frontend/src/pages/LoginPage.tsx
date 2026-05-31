import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Простая клиентская валидация
    if (!email.trim()) {
      setError('Введите email')
      return
    }
    if (!password.trim()) {
      setError('Введите пароль')
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (Array.isArray(msg)) {
        setError(msg.join(', '))
      } else {
        setError(msg || 'Ошибка входа. Проверьте данные.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Ферма Коров</h1>
          <p className="auth-subtitle">Войдите в систему</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Электронная почта</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@farm.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              placeholder="Введите пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>

        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>

      </div>
    </div>
  )
}
