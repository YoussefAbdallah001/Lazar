import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react'
import './Pages.css'

export default function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="container cart-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <ShoppingBag size={64} style={{ marginBottom: '16px', color: 'var(--gray-300)' }} />
          <h2 style={{ marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Start shopping to add items to your cart</p>
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  async function handleUpdateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return
    await updateCartItem(itemId, newQuantity)
  }

  async function handleRemoveItem(itemId) {
    await removeFromCart(itemId)
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = couponResult?.discount || 0
  const shipping = subtotal >= 100 ? 0 : 10
  const total = subtotal - discount + shipping

  return (
    <div className="container cart-page">
      <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '32px' }}>Shopping Cart</h1>

      <div className="cart-container">
        <div className="cart-items">
          {cart.items.map(item => (
            <div key={item.id || item.productId} className="cart-item">
              <img
                src={item.image || 'https://via.placeholder.com/100'}
                alt={item.name}
                className="cart-item-image"
              />

              <div className="cart-item-details">
                <Link to={`/product/${item.productId}`} className="cart-item-name">
                  {item.name}
                </Link>
                <div className="cart-item-price">${item.price}</div>

                <div className="cart-controls">
                  <div className="cart-quantity">
                    <button
                      onClick={() => handleUpdateQuantity(item.id || item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input type="number" value={item.quantity} readOnly />
                    <button
                      onClick={() => handleUpdateQuantity(item.id || item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span style={{ fontWeight: 600 }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    className="remove-item"
                    onClick={() => handleRemoveItem(item.id || item.productId)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="coupon-input">
            <input
              type="text"
              className="form-input"
              placeholder="Coupon code"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                if (!couponCode) return
                setApplyingCoupon(true)
                setCouponResult(null)
                try {
                  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/coupons?code=eq.${couponCode}&active=eq.true&select=*`, {
                    headers: {
                      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                    }
                  })
                  const coupons = await res.json()
                  const coupon = coupons?.[0]

                  if (!coupon) {
                    setCouponResult({ error: 'Invalid coupon code' })
                  } else {
                    let calculatedDiscount = 0
                    if (coupon.discount_type === 'percentage') {
                      calculatedDiscount = (subtotal * coupon.discount_value / 100)
                    } else {
                      calculatedDiscount = coupon.discount_value
                    }
                    setCouponResult({
                      success: true,
                      discount: calculatedDiscount,
                      code: coupon.code
                    })
                  }
                } catch {
                  setCouponResult({ error: 'Failed to apply coupon' })
                } finally {
                  setApplyingCoupon(false)
                }
              }}
              disabled={applyingCoupon}
            >
              Apply
            </button>
          </div>

          {couponResult?.error && (
            <p style={{ color: 'var(--error)', fontSize: '13px' }}>{couponResult.error}</p>
          )}
          {couponResult?.success && (
            <p style={{ color: 'var(--success)', fontSize: '13px' }}>
              Coupon "{couponResult.code}" applied! -${couponResult.discount.toFixed(2)}
            </p>
          )}

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

          {shipping > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '12px' }}>
              Free shipping on orders over $100
            </p>
          )}

          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '16px' }}
            onClick={() => navigate('/checkout', { state: { cart, subtotal, discount, shipping, total, coupon: couponResult?.success ? couponResult : null } })}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <Link to="/shop" style={{ display: 'block', textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
