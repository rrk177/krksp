import React, { useEffect, useState } from 'react'
import { usersApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const roleClass: Record<string, string> = {
  admin:   'badge-admin',
  manager: 'badge-manager',
  viewer:  'badge-viewer',
}

const roleRu: Record<string, string> = {
  admin:   'Администратор',
  manager: 'Менеджер',
  viewer:  'Наблюдатель',
}

export default function UsersPage() {
  const { user: me } = useAuth()

  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Форма создания пользователя
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState('')
  const [role, setRole] = useState('viewer')
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  function loadUsers() {
    setLoading(true)
    usersApi.getAll()
      .then(res => {
        setUsers(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Не удалось загрузить пользователей')
        setLoading(false)
      })
  }

  // Валидация формы создания пользователя
  function validateForm() {
    if (!name.trim()) return 'Имя обязательно'
    if (!email.trim()) return 'Email обязателен'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email'
    if (!password.trim()) return 'Пароль обязателен'
    if (password.length < 6) return 'Пароль минимум 6 символов'
    return null
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const err = validateForm()
    if (err) {
      setFormError(err)
      return
    }

    setCreating(true)
    setFormError('')

    try {
      await usersApi.create({
        name: name.trim(),
        email: email.trim(),
        password,
        age: age ? Number(age) : undefined,
        role,
      })
      // Очищаем форму и обновляем список
      setName('')
      setEmail('')
      setPassword('')
      setAge('')
      setRole('viewer')
      setShowForm(false)
      loadUsers()
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (Array.isArray(msg)) {
        setFormError(msg.join(', '))
      } else {
        setFormError(msg || 'Не удалось создать пользователя')
      }
    }

    setCreating(false)
  }

  // Поиск по имени и email
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Пользователи</h1>
          <p className="page-subtitle">Управление учётными записями</p>
        </div>
        {me?.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Отмена' : '+ Добавить'}
          </button>
        )}
      </div>

      {/* Форма создания нового пользователя */}
      {showForm && (
        <div className="form-card">
          <h2 className="form-card-title">Новый пользователь</h2>
          <form onSubmit={handleCreate} className="create-form">
            {formError && <div className="form-error">{formError}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Имя *</label>
                <input className="form-input" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Пароль * (мин. 6 символов)</label>
                <input className="form-input" type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Возраст</label>
                <input className="form-input" type="number" placeholder="Возраст" value={age} onChange={e => setAge(e.target.value)} min="0" max="120" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Роль</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="viewer">Наблюдатель</option>
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Создание...' : 'Создать пользователя'}
            </button>
          </form>
        </div>
      )}

      {error && <div className="page-error">{error}</div>}

      <div className="filter-bar">
        <input
          className="form-input filter-search"
          placeholder="Поиск по имени или почте..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <div className="table-card">
          <div className="table-header">{filtered.length} пользователей</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Электронная почта</th>
                  <th>Возраст</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={u.id === me?.id ? 'row-highlight' : ''}>
                    <td className="text-muted">#{u.id}</td>
                    <td>
                      <strong>{u.name}</strong>
                      {u.id === me?.id && <span className="you-label"> (вы)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.age ?? '—'}</td>
                    <td>
                      <span className={`user-badge ${roleClass[u.role]}`}>
                        {roleRu[u.role] || u.role}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
