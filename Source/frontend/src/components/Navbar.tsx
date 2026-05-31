import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Названия ролей на русском
const roleNames: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  viewer: 'Наблюдатель',
}

const roleBadges: Record<string, string> = {
  admin: 'badge-admin',
  manager: 'badge-manager',
  viewer: 'badge-viewer',
}

export default function Navbar() {
  const { user, logout, isRole } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-text">Ферма Коров</span>
          <span className="logo-sub">Управление</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Дашборд
        </NavLink>

        <NavLink to="/cows" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Коровы
        </NavLink>

        {isRole('admin', 'manager') && (
          <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Пользователи
          </NavLink>
        )}

      </div>

      <div className="sidebar-footer">
        {user && (
          <div className="user-card">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className={`user-badge ${roleBadges[user.role]}`}>
                {roleNames[user.role]}
              </span>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </nav>
  )
}
