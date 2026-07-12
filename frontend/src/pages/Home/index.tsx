import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productAPI, blogAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './Home.css'

interface Product {
  id: number
  name: string
  description: string
  price: number
  discountedPrice?: number
  discountPercent?: number
  imageUrl?: string
  imageUrls?: string[]
  stock: number
}

interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  author: { email: string }
  createdAt: string
}

function useItemsPerPage() {
  const [items, setItems] = useState(() => window.innerWidth <= 768 ? 2 : 4)
  useEffect(() => {
    const handler = () => setItems(window.innerWidth <= 768 ? 2 : 4)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return items
}

function ProductCarousel({ products, loading, sectionLink, onProductAdded }: {
  products: Product[]
  loading: boolean
  sectionLink: string
  onProductAdded: (productName: string) => void
}) {
  const [page, setPage] = useState(0)
  const itemsPerPage = useItemsPerPage()
  const navigate = useNavigate()

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const visible = products.slice(page * itemsPerPage, (page + 1) * itemsPerPage)

  // Reset page if itemsPerPage changes (resize)
  useEffect(() => { setPage(0) }, [itemsPerPage])

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
    onProductAdded(product.name)
  }

  if (loading) return <p className="carousel-empty">Se incarca...</p>
  if (products.length === 0) return <p className="carousel-empty">Nu exista produse momentan.</p>

  return (
    <div className="carousel-wrapper">
      <button
        className={`carousel-arrow carousel-arrow-left${page === 0 ? ' carousel-arrow-disabled' : ''}`}
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
        aria-label="Inapoi"
      >&#8249;</button>

      <div className="carousel-track">
        {visible.map(product => {
          const mainPrice = Number(product.discountedPrice || product.price)
          const hasDiscount = product.discountPercent && product.discountPercent > 0
          const inStock = Number(product.stock) > 0

          return (
            <div key={product.id} className="pcard" onClick={() => navigate(`/products/${product.id}`)}>
              <div className="pcard-img-wrap">
                {product.imageUrl
                  ? <img src={product.imageUrl} alt={product.name} />
                  : <div className="pcard-no-img">✨</div>
                }
              </div>

              <div className="pcard-body">
                <h3 className="pcard-name">{product.name}</h3>

                {hasDiscount && (
                  <p className="pcard-original">Pret: {Number(product.price).toFixed(2)} RON</p>
                )}
                <p className="pcard-price">de la {mainPrice.toFixed(2)} RON</p>

                <span className={`pcard-stock ${inStock ? 'in-stock' : 'out-stock'}`}>
                  {inStock ? '✓ In stoc' : '✗ Stoc epuizat'}
                </span>

                <button
                  className="pcard-add-btn"
                  onClick={(e) => addToCart(e, product)}
                >
                  Adauga in cos
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <button
        className={`carousel-arrow carousel-arrow-right${page >= totalPages - 1 ? ' carousel-arrow-disabled' : ''}`}
        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={page >= totalPages - 1}
        aria-label="Inainte"
      >&#8250;</button>
    </div>
  )
}

export default function Home() {
  const [promotions, setPromotions] = useState<Product[]>([])
  const [handmade, setHandmade] = useState<Product[]>([])
  const [popular, setPopular] = useState<Product[]>([])
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, string>>({})
  const feedbackTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    Promise.all([
      productAPI.getAll({ section: 'promotii', limit: 16 }),
      productAPI.getAll({ section: 'handmade', limit: 16 }),
      productAPI.getAll({ section: 'popular', limit: 16 })
    ])
      .then(([promoRes, handmadeRes, popularRes]) => {
        const normalize = (items: any[]): Product[] =>
          (Array.isArray(items) ? items : []).map((product: Product) => ({
            ...product,
            imageUrl: resolveMediaUrl(product.imageUrl || product.imageUrls?.[0] || '')
          }))

        setPromotions(normalize(promoRes.data))
        setHandmade(normalize(handmadeRes.data))
        setPopular(normalize(popularRes.data))
      })
      .catch(err => console.error('Failed to fetch home products', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    blogAPI.getPublished()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : []
        setArticles(data.slice(0, 3))
      })
      .catch(err => console.error('Failed to fetch blog articles', err))
      .finally(() => setArticlesLoading(false))
  }, [])

  useEffect(() => () => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  const sections = [
    { key: 'promotii', title: 'Promotii', products: promotions, link: '/products?section=promotii' },
    { key: 'popular', title: 'Produse Populare', products: popular, link: '/products?section=popular' },
    { key: 'handmade', title: 'Colectia Handmade', products: handmade, link: '/products?section=handmade' }
  ]

  const handleProductAdded = (sectionKey: string, productName: string) => {
    setSectionFeedback(prev => ({ ...prev, [sectionKey]: `${productName} a fost adaugat in cos.` }))
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setSectionFeedback(prev => ({ ...prev, [sectionKey]: '' }))
    }, 2200)
  }

  return (
    <div className="home">
      {sections.map(section => (
        <section key={section.key} className="featured-section">
          <div className="featured-section-header">
            <div className="featured-section-title-wrap">
              <h2>{section.title}</h2>
              {sectionFeedback[section.key] && (
                <p className="section-cart-feedback">{sectionFeedback[section.key]}</p>
              )}
            </div>
            <Link to={section.link} className="section-see-all">
              <span>Vezi toate</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <ProductCarousel
            products={section.products}
            loading={loading}
            sectionLink={section.link}
            onProductAdded={(productName) => handleProductAdded(section.key, productName)}
          />
        </section>
      ))}

      <section className="features-section">
        <h2>CE OFERIM?</h2>
        <div className="features">
          <div className="feature">
            <div className="feature-icon">📦</div>
            <h3>Livrare Premium Gratuita</h3>
            <p>Experienta inedita</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Livrare Rapida Si Colet Asigurat</h3>
            <p>Informatii Despre Livrare</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>Plata Online Securizata</h3>
            <p>Cum Platesc</p>
          </div>
        </div>
      </section>

      <section className="blog-section">
        <h2>ARTICOLE</h2>
        {articlesLoading ? (
          <p>Se incarca articolele...</p>
        ) : articles.length === 0 ? (
          <p>Nu exista articole inca.</p>
        ) : (
          <div className="blog-grid">
            {articles.map(article => (
              <Link key={article.id} to={`/blog/${article.id}`} className="blog-card-link">
                <div className="blog-card">
                  <div className="blog-card-body">
                    <p className="blog-meta">
                      {article.author?.email || 'Celestials'} • {new Date(article.createdAt).toLocaleDateString('ro-RO')}
                    </p>
                    <h4>{article.title}</h4>
                    <p>{article.excerpt || article.content.substring(0, 150)}...</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
