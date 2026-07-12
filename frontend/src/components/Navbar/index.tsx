import React, { useEffect, useRef, useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

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
    const handleOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
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
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8.94 6.5H7V4.95c0-.45.3-.55.51-.55h1.3V2.14L7.02 2.13C4.8 2.13 4.33 3.79 4.33 4.85V6.5H3v2.27h1.33V14H7V8.77h1.8l.14-2.27z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3.4" />
                <circle cx="8" cy="8" r="2.7" fill="#f7f5f3" />
                <circle cx="11.5" cy="4.6" r="0.9" fill="#f7f5f3" />
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="social-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M9.6 2h2.2c.1 1 .8 2.1 2.2 2.4v2.1c-1.1-.1-2.1-.5-2.9-1.1v4.8a3.7 3.7 0 1 1-3.7-3.7c.4 0 .8.1 1.2.2v2.1a1.7 1.7 0 1 0 1 1.5z" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="social-icon">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1.8" y="4" width="12.4" height="8" rx="2.2" />
                <path d="M7 6.2v3.6l3-1.8z" fill="#f7f5f3" />
              </svg>
            </a>
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

          <button
            type="button"
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            aria-label={mobileMenuOpen ? 'Inchide meniul' : 'Deschide meniul'}
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
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
                <div className="account-menu-wrap" ref={accountMenuRef}>
                  <button
                    type="button"
                    className="account-link account-toggle-btn"
                    onClick={() => setAccountMenuOpen(prev => !prev)}
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span className="account-icon">👤</span>
                    <span>Contul meu</span>
                    <span className="account-caret">{accountMenuOpen ? '⌃' : '⌄'}</span>
                  </button>

                  {accountMenuOpen && (
                    <div className="account-dropdown-menu">
                      {isLoggedIn ? (
                        <>
                          <Link to="/orders" className="account-dropdown-item" onClick={() => setAccountMenuOpen(false)}>
                            Comenzile mele
                          </Link>
                          <button
                            type="button"
                            className="account-dropdown-item account-dropdown-logout"
                            onClick={() => {
                              setAccountMenuOpen(false)
                              handleLogout()
                            }}
                          >
                            Logout
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" className="account-dropdown-login-btn" onClick={() => setAccountMenuOpen(false)}>
                            Autentificare
                          </Link>
                          <div className="account-dropdown-register">
                            <span>Nu ai Cont?</span>
                            <Link to="/login" onClick={() => setAccountMenuOpen(false)}>Click aici</Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
          </div>
        </div>

        <div className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}>
          <Nav className="mobile-menu-links">
            <Nav.Link as={Link} to="/products?section=noutati" onClick={() => setMobileMenuOpen(false)}>Noutati</Nav.Link>
            {!isAdmin && productTypes.map(type => (
              <Nav.Link
                key={type.id}
                as={Link}
                to={`/products?type=${encodeURIComponent(type.slug)}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {toTitleCase(type.name)}
              </Nav.Link>
            ))}
            {!isAdmin && (
              <>
                <Nav.Link as={Link} to={isLoggedIn ? '/orders' : '/login'} onClick={() => setMobileMenuOpen(false)}>
                  Contul meu
                </Nav.Link>
                <Nav.Link as={Link} to="/cart" onClick={() => setMobileMenuOpen(false)}>
                  Cos ({cartTotalLabel} lei)
                </Nav.Link>
              </>
            )}
            {isAdmin && <Nav.Link as={Link} to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Nav.Link>}
            {isLoggedIn && (
              <Nav.Link
                as="button"
                className="mobile-logout-link"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
              >
                Logout
              </Nav.Link>
            )}
          </Nav>
        </div>
      </Container>
    </header>
  )
}
