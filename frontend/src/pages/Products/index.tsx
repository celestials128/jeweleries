import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Container, Spinner } from 'react-bootstrap'
import { productAPI, productTypeAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './Products.css'

interface ProductType {
  id: number
  name: string
  slug: string
  description?: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  discountedPrice?: number
  discountPercent?: number
  handmade?: boolean
  popular?: boolean
  imageUrl?: string
  imageUrls?: string[]
  stock: number
  type?: ProductType
}

const generatePlaceholder = (text: string, color: string = '#9b59b6') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${color}"/>
      <text x="200" y="200" text-anchor="middle" dy=".3em" fill="white" font-size="18" font-family="Arial, sans-serif" font-weight="bold">
        ${text}
      </text>
    </svg>
  `.trim()
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const sectionTitles: Record<string, string> = {
  noutati: 'Noutati',
  promotii: 'Promotii',
  handmade: 'Colectia Handmade',
  popular: 'Produse Populare'
}

export default function Products() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [types, setTypes] = useState<ProductType[]>([])
  const [newArrivalsByType, setNewArrivalsByType] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'popular' | 'name-asc'>('price-asc')
  const [onlyPopular, setOnlyPopular] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [onlyDiscounted, setOnlyDiscounted] = useState(false)
  const [onlyHandmade, setOnlyHandmade] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const section = (searchParams.get('section') || '').toLowerCase()
  const typeSlug = searchParams.get('type') || ''

  useEffect(() => {
    productTypeAPI.getAll()
      .then(res => setTypes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTypes([]))
  }, [])

  useEffect(() => {
    setLoading(true)

    if (section === 'noutati') {
      productAPI.getNewArrivals(3)
        .then(res => setNewArrivalsByType(res.data || {}))
        .catch(() => setNewArrivalsByType({}))
        .finally(() => setLoading(false))
      return
    }

    const params: { type?: string; section?: string } = {}
    if (typeSlug) params.type = typeSlug
    if (section && section !== 'noutati') params.section = section

    productAPI.getAll(params)
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Failed to fetch products', err))
      .finally(() => setLoading(false))
  }, [section, typeSlug])

  const activeType = useMemo(() => {
    if (!typeSlug) return null
    return types.find(t => t.slug.toLowerCase() === typeSlug.toLowerCase()) || null
  }, [typeSlug, types])

  const title = useMemo(() => {
    if (section && sectionTitles[section]) return sectionTitles[section]
    if (activeType) return activeType.name
    return 'Colectia Noastra'
  }, [section, activeType])

  const getPrimaryImage = (product: Product) => {
    const colors = ['#9b59b6', '#f39c12', '#1abc9c', '#e74c3c', '#3498db', '#2c3e50', '#95a5a6', '#34495e', '#d35400', '#c0392b', '#8e44ad', '#16a085']
    const colorIndex = product.id % colors.length
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      const firstImage = resolveMediaUrl(product.imageUrls[0])
      if (firstImage) return firstImage
    }
    const mainImage = resolveMediaUrl(product.imageUrl)
    if (mainImage) return mainImage
    return generatePlaceholder(product.name, colors[colorIndex])
  }

  const addToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((i: any) => String(i.id) === String(product.id))
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ id: product.id, name: product.name, price: Number(product.discountedPrice || product.price), quantity: 1, imageUrl: product.imageUrl })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart:updated'))
  }

  const baseProducts = useMemo(
    () => (section === 'noutati' ? Object.values(newArrivalsByType).flat() : products),
    [section, newArrivalsByType, products]
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const min = minPrice.trim() === '' ? null : Number(minPrice)
    const max = maxPrice.trim() === '' ? null : Number(maxPrice)

    const filtered = baseProducts.filter(product => {
      const effectivePrice = Number(product.discountedPrice || product.price || 0)
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description || '').toLowerCase().includes(normalizedSearch)
      const matchesPopular = !onlyPopular || Boolean(product.popular)
      const matchesStock = !onlyInStock || Number(product.stock) > 0
      const matchesDiscount = !onlyDiscounted || Number(product.discountPercent || 0) > 0
      const matchesHandmade = !onlyHandmade || Boolean(product.handmade)
      const matchesMin = min === null || (!Number.isNaN(min) && effectivePrice >= min)
      const matchesMax = max === null || (!Number.isNaN(max) && effectivePrice <= max)

      return matchesSearch && matchesPopular && matchesStock && matchesDiscount && matchesHandmade && matchesMin && matchesMax
    })

    filtered.sort((a, b) => {
      const aPrice = Number(a.discountedPrice || a.price || 0)
      const bPrice = Number(b.discountedPrice || b.price || 0)

      if (sortBy === 'price-asc') return aPrice - bPrice
      if (sortBy === 'price-desc') return bPrice - aPrice
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'ro', { sensitivity: 'base' })

      const popularDiff = Number(Boolean(b.popular)) - Number(Boolean(a.popular))
      if (popularDiff !== 0) return popularDiff
      return aPrice - bPrice
    })

    return filtered
  }, [baseProducts, searchTerm, onlyPopular, onlyInStock, onlyDiscounted, onlyHandmade, minPrice, maxPrice, sortBy])

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('price-asc')
    setOnlyPopular(false)
    setOnlyInStock(false)
    setOnlyDiscounted(false)
    setOnlyHandmade(false)
    setMinPrice('')
    setMaxPrice('')
  }

  const hasActiveFilters = searchTerm || onlyPopular || onlyInStock || onlyDiscounted || onlyHandmade || minPrice || maxPrice

  const renderProductCard = (product: Product) => {
    const hasDiscount = product.discountPercent && product.discountPercent > 0
    const mainPrice = Number(product.discountedPrice || product.price)
    const inStock = Number(product.stock) > 0
    const primaryImage = getPrimaryImage(product)

    return (
      <div key={product.id} className="pcard-grid" onClick={() => navigate(`/products/${product.id}`)}>
        <div className="pcard-grid-img">
          <img src={primaryImage} alt={product.name} />
        </div>
        <div className="pcard-grid-body">
          <h3 className="pcard-grid-name">{product.name}</h3>
          {hasDiscount && (
            <p className="pcard-grid-original">{Number(product.price).toFixed(2)} RON</p>
          )}
          <p className="pcard-grid-price">de la {mainPrice.toFixed(2)} RON</p>
          <span className={`pcard-grid-stock ${inStock ? 'in-stock' : 'out-stock'}`}>
            {inStock ? '✓ In stoc' : '✗ Stoc epuizat'}
          </span>
          <button className="pcard-grid-btn" onClick={(e) => addToCart(e, product)}>
            Adauga in cos
          </button>
        </div>
      </div>
    )
  }

  const filterSidebar = (
    <aside className="products-filters">
      <div className="filters-title">Filtre</div>

      <div className="filter-group">
        <label htmlFor="search-filter">Cauta produs</label>
        <input
          id="search-filter"
          type="text"
          placeholder="Nume sau descriere..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Pret (RON)</label>
        <div className="price-range">
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Min"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Max"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group filter-checks">
        <label><input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} /><span>In stoc</span></label>
        <label><input type="checkbox" checked={onlyDiscounted} onChange={e => setOnlyDiscounted(e.target.checked)} /><span>Cu reducere</span></label>
        <label><input type="checkbox" checked={onlyPopular} onChange={e => setOnlyPopular(e.target.checked)} /><span>Populare</span></label>
        <label><input type="checkbox" checked={onlyHandmade} onChange={e => setOnlyHandmade(e.target.checked)} /><span>Handmade</span></label>
      </div>

      {hasActiveFilters && (
        <button type="button" className="clear-filters-btn" onClick={clearFilters}>
          Reseteaza filtrele
        </button>
      )}
    </aside>
  )

  if (loading) return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <Spinner animation="border" style={{ color: '#a67c52' }} />
    </Container>
  )

  return (
    <div className="products-page">
      <Container fluid="lg">
        {/* Breadcrumb */}
        <nav className="products-breadcrumb">
          <Link to="/">Acasa</Link>
          <span className="breadcrumb-sep"> / </span>
          <span>{title}</span>
        </nav>

        {/* Category header */}
        <div className="products-header">
          <h1 className="products-title">{title}</h1>
          {activeType?.description && (
            <p className="products-description">{activeType.description}</p>
          )}
        </div>

        {/* Mobile filters toggle */}
        <button
          className="mobile-filters-toggle"
          onClick={() => setMobileFiltersOpen(prev => !prev)}
        >
          <span>&#9776; Filtre</span>
          {hasActiveFilters && <span className="filters-badge">activ</span>}
        </button>

        <div className="products-layout">
          {/* Left sidebar — always visible on desktop, toggled on mobile */}
          <div className={`products-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
            {filterSidebar}
          </div>

          <div className="products-main">
            {/* Sort bar */}
            <div className="products-sort-bar">
              <span className="products-count">
                {filteredProducts.length > 0
                  ? `${filteredProducts.length} produs${filteredProducts.length !== 1 ? 'e' : ''}`
                  : 'Niciun produs'}
              </span>
              <div className="sort-control">
                <label htmlFor="sort-select">Ordoneaza:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="price-asc">Pret crescator</option>
                  <option value="price-desc">Pret descrescator</option>
                  <option value="popular">Cele mai populare</option>
                  <option value="name-asc">Nume A-Z</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="no-products-msg">Nu am gasit produse pentru filtrele selectate.</p>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(renderProductCard)}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
