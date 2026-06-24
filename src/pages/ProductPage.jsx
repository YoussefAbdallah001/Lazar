import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import { Star, Heart, Share2, Truck, Shield, Minus, Plus, ShoppingCart } from 'lucide-react'
import './Pages.css'

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    loadProduct()
  }, [slug])

  async function loadProduct() {
    setLoading(true)
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .eq('slug', slug)
        .single()

      if (error) throw error

      setProduct(productData)

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, users(name)')
        .eq('product_id', productData.id)
        .order('created_at', { ascending: false })

      setReviews(reviewsData || [])

      // Load related products
      if (productData.category_id) {
        const { data: related } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('category_id', productData.category_id)
          .neq('id', productData.id)
          .eq('active', true)
          .limit(4)

        setRelatedProducts(related || [])
      }

      setSelectedImage(0)
      setQuantity(1)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToCart() {
    setAddingToCart(true)
    await addToCart(product, quantity)
    setTimeout(() => setAddingToCart(false), 500)
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '32px 0' }}>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '32px 0' }}>
        <div className="empty-state">Product not found</div>
      </div>
    )
  }

  const images = product.image_urls?.length > 0
    ? product.image_urls
    : ['https://via.placeholder.com/600x600']

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--gray-500)' }}>
          <Link to="/">Home</Link>
          {' / '}
          <Link to="/shop">Shop</Link>
          {product.categories && (
            <>
              {' / '}
              <Link to={`/shop?category=${product.categories.slug}`}>{product.categories.name}</Link>
            </>
          )}
          {' / '}
          <span style={{ color: 'var(--black)' }}>{product.name}</span>
        </nav>

        <div className="product-grid">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img src={images[selectedImage]} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`gallery-thumb ${selectedImage === i ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="product-details">
            {product.categories && (
              <Link
                to={`/shop?category=${product.categories.slug}`}
                style={{ color: 'var(--gray-500)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}
              >
                {product.categories.name}
              </Link>
            )}

            <h1>{product.name}</h1>

            <div className="product-meta">
              <div className="product-rating">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(product.rating || 0) ? '#fbbf24' : 'none'}
                    color="#fbbf24"
                  />
                ))}
                <span>({product.review_count || 0} reviews)</span>
              </div>

              {product.stock_quantity > 0 ? (
                <span style={{ color: '#16a34a', fontSize: '14px' }}>In Stock</span>
              ) : (
                <span style={{ color: 'var(--gray-500)', fontSize: '14px' }}>Out of Stock</span>
              )}
            </div>

            <div className="product-price-section">
              <span className="price">${product.price}</span>
              {product.compare_at_price && (
                <>
                  <span className="compare-price">${product.compare_at_price}</span>
                  <span style={{
                    marginLeft: '12px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <p className="product-description">{product.description}</p>

            <div className="quantity-selector">
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Quantity
                </label>
                <div className="quantity-input">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                    min="1"
                    max={product.stock_quantity}
                  />
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="stock-status">
                {product.stock_quantity <= 10 && product.stock_quantity > 0 ? (
                  <span style={{ color: '#dc2626' }}>Only {product.stock_quantity} left</span>
                ) : (
                  <span>{product.stock_quantity} available</span>
                )}
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || addingToCart}
            >
              <ShoppingCart size={20} />
              {addingToCart ? 'Added!' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn btn-secondary">
                <Heart size={18} /> Wishlist
              </button>
              <button className="btn btn-secondary">
                <Share2 size={18} /> Share
              </button>
            </div>

            {/* Features */}
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Truck size={20} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Free Shipping</strong>
                  <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>On orders over $100</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={20} />
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Secure Payment</strong>
                  <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>100% secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section style={{ marginTop: '64px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="empty-state">No reviews yet</div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {reviews.map(review => (
                <div
                  key={review.id}
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--gray-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600'
                    }}>
                      {(review.users?.name || 'A')[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500' }}>{review.users?.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p style={{ color: 'var(--gray-700)', lineHeight: '1.6' }}>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: '64px' }}>
            <div className="section-header">
              <h2>Related Products</h2>
              <Link to={`/shop?category=${product.categories?.slug}`} className="view-all">View All</Link>
            </div>
            <div className="products-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
