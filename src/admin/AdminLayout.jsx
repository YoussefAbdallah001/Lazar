import { Outlet, NavLink } from 'react-router-dom'
import { useAdminAuth } from '../context/AuthContext'
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Folder, LogOut } from 'lucide-react'
import './AdminLayout.css'

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth()

  function handleLogout() {
    logout()
    window.location.href = '/admin/login'
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>LAZAR</h1>
          <span className="admin-subtitle">Admin Panel</span>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Package size={20} />
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={20} />
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/admin/customers"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Folder size={20} />
            <span>Categories</span>
          </NavLink>

          <NavLink
            to="/admin/coupons"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Tag size={20} />
            <span>Coupons</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">
              {admin?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="admin-name">{admin?.username}</p>
              <p className="admin-email">{admin?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
