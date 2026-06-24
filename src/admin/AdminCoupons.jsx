import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import './AdminPages.css'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: ''
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  async function loadCoupons() {
    try {
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      setCoupons(data || [])
    } catch (error) {
      console.error('Error loading coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(coupon = null) {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        min_order_amount: coupon.min_order_amount?.toString() || '',
        max_uses: coupon.max_uses?.toString() || '',
        expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : ''
      })
    } else {
      setEditingCoupon(null)
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_uses: '',
        expires_at: ''
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const couponData = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      active: true
    }

    try {
      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData)
        if (error) throw error
      }

      setShowModal(false)
      loadCoupons()
    } catch (error) {
      console.error('Error saving coupon:', error)
      alert('Failed to save coupon')
    }
  }

  async function deleteCoupon(coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id)

      if (error) throw error
      loadCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('Failed to delete coupon')
    }
  }

  async function toggleCoupon(coupon) {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: !coupon.active })
        .eq('id', coupon.id)

      if (error) throw error
      loadCoupons()
    } catch (error) {
      console.error('Error toggling coupon:', error)
    }
  }

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Coupons</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Add Coupon
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min. Order</th>
              <th>Uses</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id}>
                <td><code className="coupon-code">{coupon.code}</code></td>
                <td>
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}%`
                    : `$${coupon.discount_value}`
                  }
                </td>
                <td>{coupon.min_order_amount ? `$${coupon.min_order_amount}` : '-'}</td>
                <td>{coupon.uses_count || 0} / {coupon.max_uses || '∞'}</td>
                <td>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}</td>
                <td>
                  <button
                    className={`toggle-btn ${coupon.active ? 'active' : ''}`}
                    onClick={() => toggleCoupon(coupon)}
                  >
                    {coupon.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn-sm" onClick={() => openModal(coupon)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn-sm danger" onClick={() => deleteCoupon(coupon)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="SUMMER20"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select
                    className="form-input"
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min. Order Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Uses</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.max_uses}
                    onChange={e => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expires At</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expires_at}
                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
