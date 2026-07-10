import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { productAPI, blogAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './Home.css'

interface Product {
  id: number
  name: string
  description: string
  price: number
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [articlesLoading, setArticlesLoading] = useState(true)

  useEffect(() => {
    productAPI.getAll()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : []
        const normalized: Product[] = data.map((product: Product) => ({
          ...product,
          imageUrl: resolveMediaUrl(product.imageUrl || product.imageUrls?.[0] || '')
        }))
        setProducts(normalized.slice(0, 4))
        setAllProducts(normalized)
      })
      .catch(err => console.error('Failed to fetch products', err))
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

  const getCategoryProducts = (categoryIndex: number) => {
    const start = categoryIndex * 6
    const source = allProducts.length > 0 ? allProducts : products
    return source.slice(start, start + 6)
  }

  return (
    <div className="home">
      {/* Featured Products Section */}
      <section className="featured-section">
        <h2>PIESE CELESTIALE CU DIAMANTE NATURALE</h2>
        {products.length > 0 ? (
          <div className="featured-grid">
            {products.map(product => (
              <Link key={product.id} to={`/products/${product.id}`} className="featured-card-link">
                <div className="featured-card">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} />
                    : <div className="featured-card-no-img">✨</div>
                  }
                  <h3>{product.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        ) : loading ? (
          <p>Loading products...</p>
        ) : (
          <p>Nu exista produse momentan.</p>
        )}
      </section>

      {/* See More Button */}
      <div className="see-more-container">
        <Link to="/products" className="button button-outline">Vezi mai multe</Link>
      </div>

      {/* Category Sections */}
      {[
        { label: 'BRATARI', title: 'BIJUTERII DIN ARGINT' },
        { label: 'CERCEI', title: 'BIJUTERII DIN AUR' }
      ].map((category, idx) => (
        <section key={idx} className="category-section">
          <h2>{category.title}</h2>
          <div className="category-grid">
            {getCategoryProducts(idx).map((product, i) => (
              <div key={product.id || i} className="category-card">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="category-label">Fara imagine</div>}
                <span className="category-label">{category.label}</span>
              </div>
            ))}
          </div>
          <div className="see-more-container">
            <button className="button button-outline">Vezi toate</button>
          </div>
        </section>
      ))}

      {/* Features Section */}
      <section className="features-section">
        <h2>CE OFERIM?</h2>
        <div className="features">
          <div className="feature">
            <div className="feature-icon">📦</div>
            <h3>Livrare Premium Gratuita</h3>
            <p>Experienta ineditã</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Livrare Rapidã Si Colet Asigurat</h3>
            <p>Informatii Despre Livrare</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>Plata Online Securizata</h3>
            <p>Cum Platesc</p>
          </div>
        </div>
      </section>

      {/* Blog Articles Section */}
      <section className="blog-section">
        <h2>ARTICOLE CELESTIALE</h2>
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

      {/* Contact Section */}
      <section className="contact-section">
        <h2>AI INTREBARI? CONTACTEAZA-NE</h2>
        <div className="contact-info">
          <p>Luni - Vineri: 8:00 - 16:00</p>
          <p>Tel:</p>
          <p>Email:</p>
          <p>Contact Celestials:</p>
        </div>
      </section>
    </div>
  )
}
