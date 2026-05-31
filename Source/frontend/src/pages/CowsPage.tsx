import React, { useEffect, useState } from 'react'
import { cowsApi, farmsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

const statusBadge: Record<string, string> = {
  healthy:  'badge-admin',
  pregnant: 'badge-manager',
  sick:     'badge-sick',
  dry:      'badge-viewer',
}

const statusRu: Record<string, string> = {
  healthy:  'Здоровая',
  sick:     'Больная',
  pregnant: 'Стельная',
  dry:      'Сухостой',
}

const BREEDS = ['Holstein', 'Jersey', 'Angus', 'Hereford', 'Simmental', 'Limousin', 'Charolais']
const STATUSES = ['healthy', 'sick', 'pregnant', 'dry']

const emptyForm = { name: '', breed: 'Holstein', age: '', weight: '', status: 'healthy', farmId: '' }

export default function CowsPage() {
  const { user: me } = useAuth()

  const [cows, setCows] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Фильтры
  const [breed, setBreed] = useState('')
  const [status, setStatus] = useState('')
  const [farmId, setFarmId] = useState('')
  const [search, setSearch] = useState('')

  // Форма создания/редактирования
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    farmsApi.getAll().then(res => setFarms(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    loadCows()
  }, [breed, status, farmId])

  function loadCows() {
    setLoading(true)
    const params: any = {}
    if (breed) params.breed = breed
    if (status) params.status = status
    if (farmId) params.farmId = farmId

    cowsApi.getAll(params)
      .then(res => {
        setCows(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Не удалось загрузить список коров')
        setLoading(false)
      })
  }

  function clearFilters() {
    setBreed('')
    setStatus('')
    setFarmId('')
    setSearch('')
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowForm(true)
  }

  function openEdit(cow: any) {
    setEditingId(cow.id)
    setForm({
      name:   cow.name,
      breed:  cow.breed,
      age:    String(cow.age),
      weight: String(cow.weight),
      status: cow.status,
      farmId: cow.farmId ? String(cow.farmId) : '',
    })
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setFormError('')
  }

  function validateForm() {
    if (!form.name.trim()) return 'Имя коровы обязательно'
    if (!form.breed) return 'Порода обязательна'
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 0) return 'Укажите корректный возраст'
    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0) return 'Укажите корректный вес'
    return null
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const err = validateForm()
    if (err) { setFormError(err); return }

    setSaving(true)
    setFormError('')

    const payload: any = {
      name:   form.name.trim(),
      breed:  form.breed,
      age:    Number(form.age),
      weight: Number(form.weight),
      status: form.status,
    }
    if (form.farmId) payload.farmId = Number(form.farmId)

    try {
      if (editingId !== null) {
        await cowsApi.update(editingId, payload)
      } else {
        await cowsApi.create(payload)
      }
      closeForm()
      loadCows()
    } catch (err: any) {
      const msg = err.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Ошибка сохранения'))
    }

    setSaving(false)
  }

  async function handleDelete(cow: any) {
    if (!window.confirm(`Удалить корову "${cow.name}"?`)) return
    try {
      await cowsApi.remove(cow.id)
      loadCows()
    } catch {
      setError('Не удалось удалить корову')
    }
  }

  const canEdit = me?.role === 'admin' || me?.role === 'manager'
  const canDelete = me?.role === 'admin'

  // Локальная фильтрация по имени
  const displayed = cows.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Реестр коров</h1>
          <p className="page-subtitle">Все зарегистрированные животные</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={showForm ? closeForm : openCreate}>
            {showForm && editingId === null ? 'Отмена' : '+ Добавить'}
          </button>
        )}
      </div>

      {/* Форма создания / редактирования */}
      {showForm && (
        <div className="form-card">
          <h2 className="form-card-title">
            {editingId !== null ? 'Редактирование коровы' : 'Новая корова'}
          </h2>
          <form onSubmit={handleSave} className="create-form">
            {formError && <div className="form-error">{formError}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Имя *</label>
                <input
                  className="form-input"
                  placeholder="Имя коровы"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Порода *</label>
                <select className="form-select" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })}>
                  {BREEDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Возраст (лет) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="30"
                  placeholder="Возраст"
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Вес (кг) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Вес"
                  value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Статус</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{statusRu[s]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ферма</label>
                <select className="form-select" value={form.farmId} onChange={e => setForm({ ...form, farmId: e.target.value })}>
                  <option value="">Не выбрана</option>
                  {farms.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : (editingId !== null ? 'Сохранить' : 'Добавить корову')}
              </button>
              <button type="button" className="btn-ghost" onClick={closeForm}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      {/* Панель фильтров */}
      <div className="filter-bar">
        <input
          className="form-input filter-search"
          placeholder="Поиск по имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select className="form-select" value={breed} onChange={e => setBreed(e.target.value)}>
          <option value="">Все породы</option>
          {BREEDS.map(b => <option key={b}>{b}</option>)}
        </select>

        <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{statusRu[s]}</option>
          ))}
        </select>

        <select className="form-select" value={farmId} onChange={e => setFarmId(e.target.value)}>
          <option value="">Все фермы</option>
          {farms.map((f: any) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <button className="btn-ghost" onClick={clearFilters}>Сбросить</button>
      </div>

      {error && <div className="page-error">{error}</div>}

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : (
        <div className="table-card">
          <div className="table-header">
            Показано {displayed.length} из {cows.length} коров
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Порода</th>
                  <th>Возраст</th>
                  <th>Вес (кг)</th>
                  <th>Молоко (л/день)</th>
                  <th>Статус</th>
                  <th>Ферма</th>
                  {(canEdit || canDelete) && <th></th>}
                </tr>
              </thead>
              <tbody>
                {displayed.map(cow => (
                  <tr key={cow.id}>
                    <td><strong>{cow.name}</strong></td>
                    <td>{cow.breed}</td>
                    <td>{cow.age} г.</td>
                    <td>{cow.weight}</td>
                    <td>{cow.avgMilk > 0 ? cow.avgMilk.toFixed(1) : '—'}</td>
                    <td>
                      <span className={`user-badge ${statusBadge[cow.status] || ''}`}>
                        {statusRu[cow.status] || cow.status}
                      </span>
                    </td>
                    <td>{cow.farmName || '—'}</td>
                    {(canEdit || canDelete) && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {canEdit && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '4px 10px', marginRight: '4px', fontSize: '13px' }}
                            onClick={() => openEdit(cow)}
                          >
                            Изменить
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '4px 10px', fontSize: '13px', color: '#ef4444' }}
                            onClick={() => handleDelete(cow)}
                          >
                            Удалить
                          </button>
                        )}
                      </td>
                    )}
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
