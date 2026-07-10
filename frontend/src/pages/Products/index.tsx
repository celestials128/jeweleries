import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Spinner, Carousel } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { productAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './Products.css'

interface Product {
  id: number
  name: string
  description: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  stock: number
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productAPI.getAll()
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to fetch products', err))
      .finally(() => setLoading(false))
  }, [])

  const getImageUrls = (product: Product) => {
    const colors = ['#9b59b6', '#f39c12', '#1abc9c', '#e74c3c', '#3498db', '#2c3e50', '#95a5a6', '#34495e', '#d35400', '#c0392b', '#8e44ad', '#16a085']
    const colorIndex = product.id % colors.length
    const urls: string[] = []

    if (Array.isArray(product.imageUrls)) {
      for (const imageUrl of product.imageUrls) {
        const resolved = resolveMediaUrl(imageUrl)
        if (resolved && !urls.includes(resolved)) {
          urls.push(resolved)
        }
      }
    }

    const mainImage = resolveMediaUrl(product.imageUrl)
    if (mainImage && !urls.includes(mainImage)) {
      urls.unshift(mainImage)
    }

    if (urls.length === 0) {
      urls.push(generatePlaceholder(product.name, colors[colorIndex]))
    }

    return urls
  }

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((item: any) => String(item.id) === String(product.id))
    if (existing) {
      existing.quantity = Number(existing.quantity || 1) + 1
    } else {
      cart.push({
        ...product,
        price: Number(product.price) || 0,
        quantity: 1
      })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart:updated'))
    toast.success(`${product.name} a fost adaugat in cos.`)
  }

  if(loading) return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <Spinner animation="border" style={{ color: '#a67c52' }} />
    </Container>
  )

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5" style={{ fontSize: "48px", letterSpacing: "3px", textTransform: "uppercase", color: "#2a2a2a" }}>
        Colectia Noastră
      </h1>
      <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
        {products.map(product => (
          <Col key={product.id}>
            <Card className="product-card h-100 border-0 shadow-sm">
              {(() => {
                const productImages = getImageUrls(product)
                if (productImages.length === 1) {
                  return <Card.Img variant="top" src={productImages[0]} alt={product.name} />
                }

                return (
                  <Carousel interval={null} indicators={productImages.length > 1} controls={productImages.length > 1} className="product-image-carousel">
                    {productImages.map((image, index) => (
                      <Carousel.Item key={`${product.id}-${index}`}>
                        <Card.Img variant="top" src={image} alt={`${product.name} ${index + 1}`} />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )
              })()}
              <Card.Body className="d-flex flex-column">
                <Card.Title className="product-title">{product.name}</Card.Title>
                <Card.Text className="flex-grow-1">{product.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="price">${product.price.toFixed(2)}</span>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock > 0 ? '🛒 Adauga' : 'Out of Stock'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  )
}
