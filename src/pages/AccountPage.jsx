import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useCustomerAuth } from '../context/AuthContext'
import { User, Package, MapPin, Settings, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Pages.css'

export default function AccountPage() {
  const { user, signOut } = useCustomerAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  async function loadOrders() {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2>Please sign in</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>You need to be logged in to view your account</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '24px' }}>Sign In</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="container account-page">
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '32px' }}>My Account</h1>

      <div className="account-layout">
        <aside className="account-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`account-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} style={{ marginRight: '8px' }} />
              {tab.label}
            </button>
          ))}
          <button
            className="account-nav-item"
            onClick={signOut}
            style={{ marginTop: 'auto', color: 'var(--gray-500)' }}
          >
            Sign Out
          </button>
        </aside>

        <div className="account-content">
          {activeTab === 'overview' && (
            <>
              <h1>Overview</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--gray-500)', marginBottom: '8px', fontSize: '13px' }}>Total Orders</p>
                  <p style={{ fontSize: '28px', fontWeight: 600 }}>{orders.length}</p>
                </div>
                <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--gray-500)', marginBottom: '8px', fontSize: '13px' }}>Total Spent</p>
                  <p style={{ fontSize: '28px', fontWeight: 600 }}>
                    ${orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--gray-500)', marginBottom: '8px', fontSize: '13px' }}>Wishlist Items</p>
                  <p style={{ fontSize: '28px', fontWeight: 600 }}>0</p>
                </div>
              </div>

              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Account Information</h2>
              <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Name</strong>
                  <span style={{ color: 'var(--gray-600)' }}>{user.name || 'Not set'}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Email</strong>
                  <span style={{ color: 'var(--gray-600)' }}>{user.email}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Phone</strong>
                  <span style={{ color: 'var(--gray-600)' }}>{user.phone || 'Not set'}</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <h1>Order History</h1>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <Package size={48} style={{ marginBottom: '16px', color: 'var(--gray-300)' }} />
                  <p>No orders yet</p>
                  <Link to="/shop" className="btn btn-primary" style={{ marginTop: '16px' }}>Start Shopping</Link>
                </div>
              ) : (
                <div>
                  {orders.map(order => (
                    <div
                      key={order.id}
                      style={{
                        padding: '24px',
                        background: 'var(--gray-50)',
                        borderRadius: '12px',
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <p style={{ fontWeight: 600 }}>{order.order_number}</p>
                          <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '12px' }}>
                        {order.order_items.map((item, i, arr) => (
                          <span key={i}>
                            {item.product_name} ({item.quantity}){i < arr.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <p style={{ fontWeight: 600 }}>${parseFloat(order.total).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <h1>Settings</h1>
              <form style={{ maxWidth: '400px' }} onSubmit={(e) => { e.preventDefault(); alert('Settings saved!') }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={user.name}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    defaultValue={user.phone}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
