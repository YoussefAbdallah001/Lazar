import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import ProductCard from '../components/ProductCard'
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react'
import './Pages.css'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').eq('featured', true).eq('active', true).limit(8),
        supabase.from('categories').select('*').order('display_order')
      ])
      setFeaturedProducts(productsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-label">New Collection 2024</span>
          <h1 className="hero-title">
            Discover Your <br />Perfect Style
          </h1>
          <p className="hero-subtitle">
            Premium fashion for the modern lifestyle. Quality clothing and accessories that define you.
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="btn btn-primary btn-lg">
              Shop Now
              <ArrowRight size={18} />
            </Link>
            <Link to="/shop?featured=true" className="btn btn-secondary btn-lg">
              View Featured
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg" alt="Fashion" />
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <Truck size={32} />
              <h3>Free Shipping</h3>
              <p>On orders over $100</p>
            </div>
            <div className="feature-item">
              <Shield size={32} />
              <h3>Secure Payment</h3>
              <p>100% secure checkout</p>
            </div>
            <div className="feature-item">
              <RefreshCw size={32} />
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <Link to="/shop" className="view-all">View All <ArrowRight size={16} /></Link>
          </div>
          <div className="categories-grid">
            {categories.slice(0, 4).map(category => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="category-card"
              >
                <div className="category-image">
                  <img src={category.image_url || `https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg`} alt={category.name} />
                </div>
                <div className="category-overlay">
                  <h3>{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <Link to="/shop?featured=true" className="view-all">View All <ArrowRight size={16} /></Link>
          </div>

          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2>Join Our Newsletter</h2>
            <p>Subscribe to get special offers, free giveaways, and updates.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed!') }}>
              <input
                type="email"
                placeholder="Enter your email"
                className="form-input"
                required
              />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
