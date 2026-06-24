import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Search, Eye, X } from 'lucide-react'
import './AdminPages.css'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  async function loadOrders() {
    try {
      let query = supabase
        .from('orders')
        .select('*, users(email, name)')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(o =>
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.shipping_email?.toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(orderId, newStatus) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error
      loadOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
    }
  }

  async function viewOrderDetails(order) {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    setSelectedOrder({ ...order, items: items || [] })
  }

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Orders</h1>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-input status-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>
                  <span className="order-number">{order.order_number || `#${order.id.slice(0, 8)}`}</span>
                </td>
                <td>
                  <div className="customer-info">
                    <span>{order.shipping_name || order.users?.name || 'Guest'}</span>
                    <small>{order.shipping_email || order.users?.email}</small>
                  </div>
                </td>
                <td>
                  <select
                    className="status-select-sm"
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <span className="order-total">${parseFloat(order.total).toFixed(2)}</span>
                </td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="action-btn-sm" onClick={() => viewOrderDetails(order)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order {selectedOrder.order_number || `#${selectedOrder.id.slice(0, 8)}`}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="order-details">
              <div className="details-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedOrder.shipping_name}</p>
                <p><strong>Email:</strong> {selectedOrder.shipping_email}</p>
                <p><strong>Phone:</strong> {selectedOrder.shipping_phone}</p>
              </div>

              <div className="details-section">
                <h3>Shipping Address</h3>
                <p>{selectedOrder.shipping_address}</p>
                <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}</p>
                <p>{selectedOrder.shipping_country}</p>
              </div>

              <div className="details-section">
                <h3>Order Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price}</td>
                        <td>${item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>${selectedOrder.shipping}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${selectedOrder.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
