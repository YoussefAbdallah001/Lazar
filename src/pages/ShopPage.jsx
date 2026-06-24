import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import ProductCard from '../components/ProductCard'
import './Pages.css'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('newest')

  const categoryFilter = searchParams.get('category') || ''
  const featuredFilter = searchParams.get('featured') === 'true'
  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [categoryFilter, featuredFilter, searchQuery, sortBy])

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  async function loadProducts() {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('active', true)

      if (categoryFilter) {
        const cat = categories.find(c => c.slug === categoryFilter)
        if (cat) {
          query = query.eq('category_id', cat.id)
        }
      }

      if (featuredFilter) {
        query = query.eq('featured', true)
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true })
          break
        case 'price-high':
          query = query.order('price', { ascending: false })
          break
        case 'rating':
          query = query.order('rating', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data } = await query

      let filtered = data || []

      // Price range filter
      if (priceRange.min || priceRange.max) {
        filtered = filtered.filter(p => {
          if (priceRange.min && p.price < parseFloat(priceRange.min)) return false
          if (priceRange.max && p.price > parseFloat(priceRange.max)) return false
          return true
        })
      }

      setProducts(filtered)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleCategoryChange(slug) {
    const params = new URLSearchParams(searchParams)
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    setSearchParams(params)
  }

  function handlePriceFilter() {
    loadProducts()
  }

  function clearFilters() {
    setSearchParams({})
    setPriceRange({ min: '', max: '' })
  }

  const hasFilters = categoryFilter || featuredFilter || searchQuery || priceRange.min || priceRange.max

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-header">
          <h1>{categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name || 'Shop' : 'Shop All Products'}</h1>
          <p>{products.length} products</p>
        </div>

        <div className="shop-layout">
          <aside className="filters-sidebar">
            <div className="filter-group">
              <h3>Categories</h3>
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={!categoryFilter}
                  onChange={() => handleCategoryChange('')}
                />
                All Categories
              </label>
              {categories.map(cat => (
                <label key={cat.id} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === cat.slug}
                    onChange={() => handleCategoryChange(cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Price Range</h3>
              <div className="price-inputs">
                <input
                  type="number"
                  className="form-input"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handlePriceFilter} style={{ marginTop: '12px' }}>
                Apply
              </button>
            </div>

            {hasFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} style={{ marginTop: '16px', width: '100%' }}>
                Clear Filters
              </button>
            )}
          </aside>

          <main className="products-main">
            <div className="sort-bar">
              <span className="product-count">{products.length} products</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <p>No products found</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
