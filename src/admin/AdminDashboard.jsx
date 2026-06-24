import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, ArrowUpRight } from 'lucide-react'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [ordersResult, productsResult, usersResult] = await Promise.all([
        supabase.from('orders').select('id, total, status, created_at'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' })
      ])

      const totalOrders = ordersResult.data?.length || 0
      const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0
      const pendingOrders = ordersResult.data?.filter(o => o.status === 'pending').length || 0

      const recentOrders = ordersResult.data
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5) || []

      setStats({
        totalOrders,
        totalRevenue,
        totalProducts: productsResult.count || 0,
        totalCustomers: usersResult.count || 0,
        pendingOrders,
        recentOrders
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your store.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <ShoppingBag size={24} color="#2563eb" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h3 className="stat-value">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
            <DollarSign size={24} color="#16a34a" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Revenue</p>
            <h3 className="stat-value">${stats.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e8ff' }}>
            <Package size={24} color="#9333ea" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Products</p>
            <h3 className="stat-value">{stats.totalProducts}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <Users size={24} color="#d97706" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Customers</p>
            <h3 className="stat-value">{stats.totalCustomers}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card recent-orders">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <a href="/admin/orders" className="view-all">View All <ArrowUpRight size={16} /></a>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders yet</p>
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <span className="order-id">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td>${parseFloat(order.total).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-card quick-actions">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>

          <div className="actions-grid">
            <a href="/admin/products" className="action-btn">
              <Package size={20} />
              <span>Add Product</span>
            </a>
            <a href="/admin/orders" className="action-btn">
              <ShoppingBag size={20} />
              <span>View Orders</span>
            </a>
            <a href="/admin/coupons" className="action-btn">
              <TrendingUp size={20} />
              <span>Create Coupon</span>
            </a>
            <a href="/admin/customers" className="action-btn">
              <Users size={20} />
              <span>View Customers</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
