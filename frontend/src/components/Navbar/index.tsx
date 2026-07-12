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

        <Nav className="header-links-row">
          <Nav.Link as={Link} to="/products?section=noutati">Noutati</Nav.Link>
          {!isAdmin && productTypes.map(type => (
            <Nav.Link key={type.id} as={Link} to={`/products?type=${encodeURIComponent(type.slug)}`}>
              {toTitleCase(type.name)}
            </Nav.Link>
          ))}
          {!isAdmin && <Nav.Link as={Link} to="/cart">Cos</Nav.Link>}
          {isLoggedIn && !isAdmin && <Nav.Link as={Link} to="/orders">Comenzile mele</Nav.Link>}
          {isAdmin && <Nav.Link as={Link} to="/admin" className="admin-link">Admin</Nav.Link>}
          {!isLoggedIn && <Nav.Link as={Link} to="/login" className="login-link">Login</Nav.Link>}
          {isLoggedIn && <Nav.Link onClick={handleLogout} className="logout-btn">Logout</Nav.Link>}
        </Nav>
      </Container>
    </header>
  )
}
