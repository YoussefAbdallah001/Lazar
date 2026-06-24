import { Link } from 'react-router-dom'
import { useCustomerAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './StoreLayout.css'

export default function StoreLayout({ children }) {
  const { user, signOut } = useCustomerAuth()
  const { itemCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="store-layout">
      <header className="store-header">
        <div className="container header-container">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="logo">
            LAZAR
          </Link>

          <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link to="/shop?category=t-shirts" onClick={() => setMobileMenuOpen(false)}>T-Shirts</Link>
            <Link to="/shop?category=shoes" onClick={() => setMobileMenuOpen(false)}>Shoes</Link>
            <Link to="/shop?category=pants" onClick={() => setMobileMenuOpen(false)}>Pants</Link>
          </nav>

          <div className="header-actions">
            <Link to="/shop" className="header-icon-btn">
              <Search size={20} />
            </Link>

            <Link to="/cart" className="header-icon-btn cart-btn">
              <ShoppingCart size={20} />
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu">
                <Link to="/account" className="header-icon-btn">
                  <User size={20} />
                </Link>
                <button onClick={signOut} className="logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="header-icon-btn">
                <User size={20} />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="store-main">
        {children}
      </main>

      <footer className="store-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h3 className="footer-logo">LAZAR</h3>
              <p>Premium fashion for the modern lifestyle. Quality clothing and accessories.</p>
            </div>

            <div className="footer-section">
              <h4>Shop</h4>
              <ul>
                <li><Link to="/shop?category=t-shirts">T-Shirts</Link></li>
                <li><Link to="/shop?category=shoes">Shoes</Link></li>
                <li><Link to="/shop?category=pants">Pants</Link></li>
                <li><Link to="/shop?category=jackets">Jackets</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Help</h4>
              <ul>
                <li><Link to="/shop">Shipping Info</Link></li>
                <li><Link to="/shop">Returns</Link></li>
                <li><Link to="/shop">FAQ</Link></li>
                <li><Link to="/shop">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Connect</h4>
              <ul>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">Facebook</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Lazar Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
