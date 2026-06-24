import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useCustomerAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Lock, ArrowLeft } from 'lucide-react'
import './Pages.css'

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useCustomerAuth()
  const { clearCart } = useCart()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    notes: ''
  })

  const cartData = location.state || {}

  if (!cartData.cart?.items?.length) {
    return (
      <div className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2>No items to checkout</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>Your cart is empty</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '24px' }}>Shop Now</Link>
      </div>
    )
  }

  const { subtotal = 0, discount = 0, shipping = 0, total = 0, coupon } = cartData

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const orderNumber = `LZR-${Date.now().toString(36).toUpperCase()}`

      const orderData = {
        user_id: user?.id || null,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount,
        shipping,
        total,
        shipping_name: formData.name,
        shipping_email: formData.email,
        shipping_phone: formData.phone,
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_zip: formData.zip,
        shipping_country: formData.country,
        notes: formData.notes || null
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cartData.cart.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update product stock
      for (const item of cartData.cart.items) {
        await supabase.rpc('decrement_stock', {
          product_id: item.productId,
          quantity: item.quantity
        })
      }

      await clearCart()

      navigate(`/order-confirmation/${orderNumber}`)
    } catch (error) {
      console.error('Order error:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container checkout-page">
      <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <ArrowLeft size={18} /> Back to Cart
      </Link>

      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '32px' }}>Checkout</h1>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Information</h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">State/Province</label>
              <input
                type="text"
                className="form-input"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">ZIP/Postal Code</label>
              <input
                type="text"
                className="form-input"
                value={formData.zip}
                onChange={e => setFormData({ ...formData, zip: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select
                className="form-input"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                required
              >
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Order Notes (Optional)</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px' }}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes about your order"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            <Lock size={18} /> {loading ? 'Placing Order...' : 'Place Order'}
          </button>

          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '12px', textAlign: 'center' }}>
            By placing your order, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>

        <div className="cart-summary" style={{ height: 'fit-content', position: 'sticky', top: '104px' }}>
          <h2>Order Summary</h2>

          {cartData.cart.items.map(item => (
            <div key={item.id || item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ color: 'var(--gray-600)' }}>{item.name} x{item.quantity}</span>
              <span style={{ fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: '12px', marginBottom: '16px' }} />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="summary-row" style={{ color: 'var(--success)' }}>
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
