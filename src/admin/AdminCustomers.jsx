import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Search, Eye, X } from 'lucide-react'
import './AdminPages.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      const { data } = await supabase
        .from('users')
        .select('*, orders(count, total)')
        .order('created_at', { ascending: false })

      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  async function viewCustomerDetails(customer) {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })

    setSelectedCustomer({ ...customer, orders: orders || [] })
  }

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Customers</h1>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => {
              const orderCount = customer.orders?.length || 0
              const totalSpent = customer.orders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0

              return (
                <tr key={customer.id}>
                  <td className="customer-name">{customer.name || 'N/A'}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{orderCount}</td>
                  <td>${totalSpent.toFixed(2)}</td>
                  <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn-sm" onClick={() => viewCustomerDetails(customer)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="modal-close" onClick={() => setSelectedCustomer(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="customer-details">
              <div className="details-section">
                <h3>Information</h3>
                <p><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
                <p><strong>Joined:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>

              <div className="details-section">
                <h3>Order History ({selectedCustomer.orders?.length || 0} orders)</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.orders?.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_number || `#${order.id.slice(0, 8)}`}</td>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
