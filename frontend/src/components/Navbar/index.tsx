import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar as BootstrapNavbar, Nav, Container, Overlay, Popover } from 'react-bootstrap'
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
  const [cartItems, setCartItems] = useState<any[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [showCartPreview, setShowCartPreview] = useState(false)
  const cartTriggerRef = useRef<HTMLDivElement | null>(null)
  const hidePreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshCart = () => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    const normalized = Array.isArray(raw)
      ? raw
          .filter(item => item && item.id !== undefined && item.id !== null)
          .map(item => ({
            id: item.id,
            name: item.name || 'Produs',
            price: Number(item.price) || 0,
            quantity: Math.max(1, Number(item.quantity) || 1)
          }))
      : []
    setCartItems(normalized)
  }

  useEffect(() => {
    refreshCart()
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'cart') {
        refreshCart()
      }
    }
    const handleCartUpdated = () => {
      refreshCart()
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('cart:updated', handleCartUpdated)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('cart:updated', handleCartUpdated)
      if (hidePreviewTimeoutRef.current) {
        clearTimeout(hidePreviewTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    productTypeAPI.getAll()
      .then(res => setProductTypes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProductTypes([]))
  }, [])

  const cartTotalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const cartTotalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cartItems]
  )

  const cartBadgeLabel = useMemo(
    () => (cartTotalItems > 99 ? '99+' : String(cartTotalItems)),
    [cartTotalItems]
  )

  const clearHidePreviewTimeout = () => {
    if (hidePreviewTimeoutRef.current) {
      clearTimeout(hidePreviewTimeoutRef.current)
      hidePreviewTimeoutRef.current = null
    }
  }

  const openCartPreview = () => {
    clearHidePreviewTimeout()
    setShowCartPreview(true)
  }

  const scheduleCloseCartPreview = () => {
    clearHidePreviewTimeout()
    hidePreviewTimeoutRef.current = setTimeout(() => {
      setShowCartPreview(false)
    }, 220)
  }

  const handleLogout = () => {
    localStorage.clear()
    setCartItems([])
    window.dispatchEvent(new Event('cart:updated'))
    onLogout()
    navigate('/')
  }

  return (
    <BootstrapNavbar expand="lg" sticky="top" className="navbar-custom">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="navbar-logo">
          ✨ CELESTIALS
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* Product navigation - hidden for admins */}
            {!isAdmin && (
              <>
                <Nav.Link as={Link} to="/products?section=noutati">Noutati</Nav.Link>
                {productTypes.map(type => (
                  <Nav.Link key={type.id} as={Link} to={`/products?type=${encodeURIComponent(type.slug)}`}>
                    {toTitleCase(type.name)}
                  </Nav.Link>
                ))}
              </>
            )}

            {/* Cart - shown for all non-admin users */}
            {!isAdmin && (
              <>
                <div
                  ref={cartTriggerRef}
                  className="cart-link-wrapper"
                  onMouseEnter={openCartPreview}
                  onMouseLeave={scheduleCloseCartPreview}
                >
                  <Nav.Link
                    as={Link}
                    to="/cart"
                    className="cart-link"
                    onFocus={openCartPreview}
                    onBlur={scheduleCloseCartPreview}
                  >
                    <span className="cart-link-icon">🛒</span>
                    <span className="cart-link-text">Cos</span>
                    {cartTotalItems > 0 && (
                      <span className="cart-count-badge">
                        {cartBadgeLabel}
                      </span>
                    )}
                  </Nav.Link>
                </div>
                <Overlay target={cartTriggerRef.current} show={showCartPreview} placement="bottom">
                  {(overlayProps) => (
                    <Popover
                      {...overlayProps}
                      id="cart-preview"
                      className="cart-preview-popover"
                      onMouseEnter={openCartPreview}
                      onMouseLeave={scheduleCloseCartPreview}
                    >
                      <Popover.Header as="h3">Cos ({cartTotalItems})</Popover.Header>
                      <Popover.Body>
                        {cartItems.length === 0 ? (
                          <p className="cart-preview-empty">Cosul este gol.</p>
                        ) : (
                          <>
                            <div className="cart-preview-list">
                              {cartItems.slice(0, 3).map(item => (
                                <div key={item.id} className="cart-preview-item">
                                  <span className="cart-preview-name">{item.name}</span>
                                  <span className="cart-preview-meta">x{item.quantity} - ${item.price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            {cartItems.length > 3 && (
                              <div className="cart-preview-more">+{cartItems.length - 3} alte produse</div>
                            )}
                            <div className="cart-preview-total">Total: ${cartTotalPrice.toFixed(2)}</div>
                          </>
                        )}
                      </Popover.Body>
                    </Popover>
                  )}
                </Overlay>
              </>
            )}

            {/* Orders - shown for all logged in users */}
            {isLoggedIn && <Nav.Link as={Link} to="/orders">Comenzi</Nav.Link>}

            {/* Admin - shown only for admins */}
            {isAdmin && <Nav.Link as={Link} to="/admin" className="admin-link">⚙️ Admin</Nav.Link>}

            {/* Login - only for non-logged-in users */}
            {!isLoggedIn && <Nav.Link as={Link} to="/login" className="login-link">Login</Nav.Link>}

            {/* Logout - only for logged in users */}
            {isLoggedIn && (
              <Nav.Link onClick={handleLogout} className="logout-btn">
                Logout
              </Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}
