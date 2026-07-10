import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function Home() {
  const [promotions, setPromotions] = useState<Product[]>([])
  const [handmade, setHandmade] = useState<Product[]>([])
  const [popular, setPopular] = useState<Product[]>([])
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [articlesLoading, setArticlesLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      productAPI.getAll({ section: 'promotii', limit: 8 }),
      productAPI.getAll({ section: 'handmade', limit: 8 }),
      productAPI.getAll({ section: 'popular', limit: 8 })
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

  const sections = [
    { key: 'promotii', title: 'PROMOTII', products: promotions, link: '/products?section=promotii' },
    { key: 'handmade', title: 'COLECTIA HANDMADE', products: handmade, link: '/products?section=handmade' },
    { key: 'popular', title: 'PRODUSE POPULARE', products: popular, link: '/products?section=popular' }
  ]

  return (
    <div className="home">
      {sections.map(section => (
        <section key={section.key} className="featured-section">
          <h2>{section.title}</h2>
          {section.products.length > 0 ? (
            <div className="featured-grid">
              {section.products.map(product => (
                <div key={product.id} className="featured-card">
                  <Link to={`/products/${product.id}`}>
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} />
                      : <div className="featured-card-no-img">✨</div>
                    }
                  </Link>
                  <h3>{product.name}</h3>
                  <div className="featured-footer">
                    <span className="price">${Number(product.discountedPrice || product.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <p>Loading products...</p>
          ) : (
            <p>Nu exista produse momentan.</p>
          )}
          {section.products.length > 0 && (
            <div className="see-more-container">
              <Link to={section.link} className="button button-outline">Vezi mai multe</Link>
            </div>
          )}
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
