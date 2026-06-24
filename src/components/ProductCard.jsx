import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0

  async function handleAddToCart(e) {
    e.preventDefault()
    await addToCart(product, 1)
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        {!imageLoaded && <div className="image-placeholder" />}
        <img
          src={product.image_urls?.[0] || 'https://via.placeholder.com/400x400'}
          alt={product.name}
          className={`product-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
        />

        {discount > 0 && (
          <span className="discount-badge">-{discount}%</span>
        )}

        <div className={`product-actions ${isHovered ? 'visible' : ''}`}>
          <button className="action-btn" onClick={handleAddToCart}>
            <ShoppingCart size={18} />
          </button>
          <button className="action-btn">
            <Heart size={18} />
          </button>
          <div className="action-btn view-btn">
            <Eye size={18} />
          </div>
        </div>
      </div>

      <div className="product-info">
        <span className="product-category">{product.categories?.name}</span>
        <h3 className="product-name">{product.name}</h3>

        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              fill={i < Math.round(product.rating || 0) ? '#fbbf24' : 'none'}
              color="#fbbf24"
            />
          ))}
          <span className="rating-count">({product.review_count || 0})</span>
        </div>

        <div className="product-price">
          <span className="current-price">${product.price}</span>
          {product.compare_at_price && (
            <span className="original-price">${product.compare_at_price}</span>
          )}
        </div>

        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <span className="low-stock">Only {product.stock_quantity} left</span>
        )}

        {product.stock_quantity === 0 && (
          <span className="out-of-stock">Out of Stock</span>
        )}
      </div>
    </Link>
  )
}
