import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Nav, Container } from 'react-bootstrap'
import { productTypeAPI } from '../../services/api'
import './Navbar.css'

interface NavbarProps {
  isLoggedIn: boolean
  isAdmin: boolean
  onLogout: () => void
}

interface ProductType {
  id: number
  name: string
  slug: string
}

const toTitleCase = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value

export default function Navbar({ isLoggedIn, isAdmin, onLogout }: NavbarProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [cartTotalPrice, setCartTotalPrice] = useState(0)
  const [cartItemCount, setCartItemCount] = useState(0)

  const handleLogout = () => {
    localStorage.clear()
    onLogout()
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
  }

  useEffect(() => {
    productTypeAPI.getAll()
      .then(res => setProductTypes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProductTypes([]))
  }, [])

  useEffect(() => {
    const refreshCartTotal = () => {
      const raw = JSON.parse(localStorage.getItem('cart') || '[]')
      const total = Array.isArray(raw)
        ? raw.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.quantity) || 1)), 0)
        : 0
      const count = Array.isArray(raw)
        ? raw.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
        : 0
      setCartTotalPrice(total)
      setCartItemCount(count)
    }

    refreshCartTotal()
    window.addEventListener('cart:updated', refreshCartTotal)
    window.addEventListener('storage', refreshCartTotal)
    return () => {
      window.removeEventListener('cart:updated', refreshCartTotal)
      window.removeEventListener('storage', refreshCartTotal)
    }
  }, [])

  const cartTotalLabel = cartTotalPrice.toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return (
    <header className="navbar-custom">
      <Container>
        <div className="header-main-row">
          <div className="header-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-icon">f</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon">ig</a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="social-icon">t</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="social-icon">yt</a>
          </div>

          <Link to="/" className="navbar-logo">ASTERIA</Link>

          <form className="header-search" onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="CAUTA"
              aria-label="Cauta"
            />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
        </div>

        <div className="header-menu-row">
          <div className="header-menu-spacer" />
          <Nav className="header-links-row">
            <Nav.Link as={Link} to="/products?section=noutati">Noutati</Nav.Link>
            {!isAdmin && productTypes.map(type => (
              <Nav.Link key={type.id} as={Link} to={`/products?type=${encodeURIComponent(type.slug)}`}>
                {toTitleCase(type.name)}
              </Nav.Link>
            ))}
          </Nav>
          <div className="header-account-cart">
            {!isAdmin && (
              <>
                <Link to={isLoggedIn ? '/orders' : '/login'} className="account-link">
                  <span className="account-icon">👤</span>
                  <span>Contul meu</span>
                  <span className="account-caret">⌄</span>
                </Link>
                <Link to="/cart" className="cart-summary-link">
                  <span className="cart-icon-wrap">
                    <span className="cart-icon">🛒</span>
                    {cartItemCount > 0 && <span className="cart-count-top">{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
                  </span>
                  <span>{cartTotalLabel} lei</span>
                </Link>
              </>
            )}
            {isAdmin && <Link to="/admin" className="admin-link">Admin</Link>}
            {isLoggedIn && (
              <button type="button" onClick={handleLogout} className="logout-btn-inline">
                Logout
              </button>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}
