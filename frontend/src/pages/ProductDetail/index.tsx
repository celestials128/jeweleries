import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Button, Spinner, Badge } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { productAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './ProductDetail.css'

interface Product {
  id: number
  name: string
  description: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  stock: number
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    productAPI.getById(Number(id))
      .then(res => {
        const p: Product = res.data
        const urls: string[] = []
        if (Array.isArray(p.imageUrls)) {
          p.imageUrls.forEach(u => {
            const r = resolveMediaUrl(u)
            if (r && !urls.includes(r)) urls.push(r)
          })
        }
        const main = resolveMediaUrl(p.imageUrl)
        if (main && !urls.includes(main)) urls.unshift(main)
        setImages(urls)
        setProduct(p)
      })
      .catch(() => toast.error('Produsul nu a putut fi incarcat.'))
      .finally(() => setLoading(false))
  }, [id])

  const addToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((item: any) => String(item.id) === String(product.id))
    if (existing) {
      existing.quantity = Number(existing.quantity || 1) + 1
    } else {
      cart.push({ ...product, price: Number(product.price) || 0, quantity: 1 })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart:updated'))
    toast.success(`${product.name} a fost adaugat in cos.`)
  }

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" style={{ color: '#1e3a8a' }} />
      </Container>
    )
  }

  if (!product) {
    return (
      <Container className="py-5 text-center">
        <h2>Produsul nu a fost gasit.</h2>
        <Link to="/products"><Button variant="primary" className="mt-3">Inapoi la produse</Button></Link>
      </Container>
    )
  }

  return (
    <Container className="product-detail-container py-5">
      <button className="pd-back-btn" onClick={() => navigate(-1)}>← Inapoi</button>

      <Row className="g-5 mt-1">
        {/* Left: images */}
        <Col lg={6}>
          <div className="pd-main-image-wrap" onClick={() => setZoomOpen(true)} title="Click pentru zoom">
            {images.length > 0
              ? <img src={images[selectedIndex]} alt={product.name} className="pd-main-image" />
              : <div className="pd-no-image">Fara imagine</div>
            }
            {images.length > 0 && <span className="pd-zoom-hint">🔍</span>}
          </div>

          {images.length > 1 && (
            <div className="pd-thumbnails">
              {images.map((url, i) => (
                <button
                  key={i}
                  className={`pd-thumb-btn${i === selectedIndex ? ' active' : ''}`}
                  onClick={() => setSelectedIndex(i)}
                >
                  <img src={url} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </Col>

        {/* Right: details */}
        <Col lg={6} className="pd-info">
          <h1 className="pd-name">{product.name}</h1>
          <div className="pd-price">${Number(product.price).toFixed(2)}</div>

          <div className="pd-stock">
            {product.stock > 0
              ? <Badge bg="success">In stoc ({product.stock} disponibile)</Badge>
              : <Badge bg="danger">Stoc epuizat</Badge>
            }
          </div>

          {product.description && (
            <div className="pd-description">
              <h5>Descriere</h5>
              <p>{product.description}</p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="pd-add-to-cart"
            disabled={product.stock === 0}
            onClick={addToCart}
          >
            🛒 Adauga in Cos
          </Button>
        </Col>
      </Row>

      {/* Zoom overlay */}
      {zoomOpen && images.length > 0 && (
        <div className="pd-zoom-overlay" onClick={() => setZoomOpen(false)}>
          <img src={images[selectedIndex]} alt={product.name} className="pd-zoom-image" onClick={e => e.stopPropagation()} />
          <button className="pd-zoom-close" onClick={() => setZoomOpen(false)}>✕</button>
        </div>
      )}
    </Container>
  )
}
