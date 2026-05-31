import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from 'recharts'
import { cowsApi, farmsApi } from '../api/client'

// Цвета для графиков
const COLORS = ['#c2570a', '#2d6fa4', '#b45309', '#b91c1c', '#3d7a4a', '#6e6560', '#9b7b5e']

const STATUS_COLORS: Record<string, string> = {
  healthy:  '#3d7a4a',
  pregnant: '#2d6fa4',
  sick:     '#b91c1c',
  dry:      '#b45309',
}

// Перевод статусов на русский
const STATUS_RU: Record<string, string> = {
  healthy:  'Здоровые',
  sick:     'Больные',
  pregnant: 'Стельные',
  dry:      'Сухостой',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [farms, setFarms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const statsRes = await cowsApi.getStats()
      const farmsRes = await farmsApi.getAll()
      setStats(statsRes.data)
      setFarms(farmsRes.data)
    } catch (e) {
      setError('Не удалось загрузить статистику')
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }
  if (error) {
    return <div className="page-error">{error}</div>
  }

  // Подготовка данных для графиков
  const breedData = Object.entries(stats.byBreed).map(([name, value]) => ({ name, value }))

  const statusData = Object.entries(stats.byStatus).map(([key, value]) => ({
    name: STATUS_RU[key] || key,
    value,
    key,
  }))

  const milkData = Object.entries(stats.avgMilkByBreed)
    .map(([breed, avg]) => ({ breed, avg }))
    .filter((x: any) => x.avg > 0)
    .sort((a: any, b: any) => b.avg - a.avg)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Дашборд фермы</h1>
        <p className="page-subtitle">Статистика и аналитика поголовья коров</p>
      </div>

      {/* Карточки с ключевыми показателями */}
      <div className="stats-grid">
        <div className="stat-card stat-card--green">
          <div className="stat-card-body">
            <p className="stat-card-title">Всего коров</p>
            <p className="stat-card-value">{stats.total}</p>
            <p className="stat-card-subtitle">на всех фермах</p>
          </div>
        </div>

        <div className="stat-card stat-card--blue">
          <div className="stat-card-body">
            <p className="stat-card-title">Здоровых</p>
            <p className="stat-card-value">{stats.healthyCount}</p>
            <p className="stat-card-subtitle">
              {stats.total > 0 ? Math.round(stats.healthyCount / stats.total * 100) : 0}% от стада
            </p>
          </div>
        </div>

        <div className="stat-card stat-card--orange">
          <div className="stat-card-body">
            <p className="stat-card-title">Среднее молоко</p>
            <p className="stat-card-value">{stats.avgMilkPerDay} л/день</p>
            <p className="stat-card-subtitle">по всем породам</p>
          </div>
        </div>

        <div className="stat-card stat-card--red">
          <div className="stat-card-body">
            <p className="stat-card-title">Стельных</p>
            <p className="stat-card-value">{stats.pregnantCount}</p>
            <p className="stat-card-subtitle">
              {stats.total > 0 ? Math.round(stats.pregnantCount / stats.total * 100) : 0}% от стада
            </p>
          </div>
        </div>
      </div>

      {/* Круговые диаграммы */}
      <div className="charts-row">
        <div className="chart-card">
          <h2 className="chart-title">Распределение по породам</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={breedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {breedData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Статусы животных</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((item: any) => (
                  <Cell key={item.key} fill={STATUS_COLORS[item.key] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Столбчатая диаграмма надоя */}
      <div className="chart-card chart-card--full">
        <h2 className="chart-title">Среднее производство молока по породам (л/день)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={milkData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5dfd4" />
            <XAxis dataKey="breed" tick={{ fill: '#6e6560', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6e6560', fontSize: 12 }} unit=" л" />
            <Tooltip formatter={(v: any) => [`${v} л/день`, 'Среднее']} />
            <Bar dataKey="avg" name="Молоко (л/день)" radius={[4, 4, 0, 0]}>
              {milkData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Сводка по фермам из представления v_farm_summary */}
      <div className="info-row">
        <div className="info-card">
          <h3 className="info-card-title">Сводка по стаду</h3>
          <table className="simple-table">
            <tbody>
              <tr><td>Средний вес</td><td><strong>{stats.avgWeight} кг</strong></td></tr>
              <tr><td>Среднее молоко/день</td><td><strong>{stats.avgMilkPerDay} л</strong></td></tr>
              <tr><td>Пород отслеживается</td><td><strong>{Object.keys(stats.byBreed).length}</strong></td></tr>
              <tr><td>Больных животных</td><td><strong className="text-danger">{stats.byStatus['sick'] || 0}</strong></td></tr>
              <tr><td>Сухостойных</td><td><strong>{stats.byStatus['dry'] || 0}</strong></td></tr>
            </tbody>
          </table>
        </div>

        <div className="info-card">
          <h3 className="info-card-title">Фермы</h3>
          <table className="simple-table">
            <thead>
              <tr>
                <th>Ферма</th>
                <th>Коров</th>
                <th>Больных</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((f: any) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td><strong>{f.cow_count}</strong></td>
                  <td>
                    {f.sick_count > 0
                      ? <strong className="text-danger">{f.sick_count}</strong>
                      : <span className="text-muted">0</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
