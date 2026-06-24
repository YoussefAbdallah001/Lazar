import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { CheckCircle } from 'lucide-react'
import './Pages.css'

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [orderNumber])

  async function loadOrder() {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('order_number', orderNumber)
        .single()

      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '64px 24px' }}>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h1>Order Not Found</h1>
        <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>We couldn't find your order</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '24px' }}>Go Home</Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '64px 24px' }}>
      <div className="order-confirmation">
        <div className="success-icon">
          <CheckCircle />
        </div>

        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been placed successfully.</p>

        <div className="order-details-card">
          <p style={{ marginBottom: '8px', color: 'var(--gray-500)', fontSize: '13px' }}>Order Number</p>
          <p style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>{order.order_number}</p>

          <p style={{ marginBottom: '8px', color: 'var(--gray-500)', fontSize: '13px' }}>Estimated Delivery</p>
          <p style={{ fontSize: '16px', marginBottom: '24px' }}>
            {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px' }}>
            <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '12px' }}>Order Items</p>
            {order.order_items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: 'var(--gray-600)' }}>{item.product_name} x{item.quantity}</span>
                <span style={{ fontWeight: 500 }}>${item.total}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: '16px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--gray-600)' }}>Subtotal</span>
              <span>${order.subtotal}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--success)' }}>
                <span>Discount</span>
                <span>-${order.discount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--gray-600)' }}>Shipping</span>
              <span>{order.shipping === 0 ? 'FREE' : `$${order.shipping}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px', marginTop: '8px' }}>
              <span>Total</span>
              <span>${order.total}</span>
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>
          A confirmation email has been sent to {order.shipping_email}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/shop" className="btn btn-secondary">Continue Shopping</Link>
          <Link to="/account" className="btn btn-primary">View Order</Link>
        </div>
      </div>
    </div>
  )
}
