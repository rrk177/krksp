import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Проверяем поля перед отправкой
  function validate() {
    if (!name.trim()) return 'Имя обязательно'
    if (!email.trim()) return 'Email обязателен'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email'
    if (!password.trim()) return 'Пароль обязателен'
    if (password.length < 6) return 'Пароль должен быть минимум 6 символов'
    if (age && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      return 'Возраст от 0 до 120'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setLoading(true)
    setError('')

    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        age: age ? Number(age) : undefined,
      })
      // После регистрации отправляем на страницу входа
      navigate('/login')
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (Array.isArray(msg)) {
        setError(msg.join(', '))
      } else {
        setError(msg || 'Ошибка регистрации')
      }
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Ферма Коров</h1>
          <p className="auth-subtitle">Создайте аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Полное имя *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Иван Иванов"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Электронная почта *</label>
            <input
              className="form-input"
              type="email"
              placeholder="ivan@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль * (минимум 6 символов)</label>
            <input
              className="form-input"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Возраст (необязательно)</label>
            <input
              className="form-input"
              type="number"
              placeholder="25"
              value={age}
              onChange={e => setAge(e.target.value)}
              min="0"
              max="120"
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}
