import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import './Blog.css'

interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  author: { id: number; email: string }
  published: boolean
  createdAt: string
}

export default function Blog() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8080/api/blogs/published')
      .then(res => res.json())
      .then(data => setBlogs(data))
      .catch(err => console.error('Failed to fetch blogs', err))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" style={{ color: '#a67c52' }} />
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5" style={{ fontSize: '48px', letterSpacing: '3px', textTransform: 'uppercase', color: '#2a2a2a' }}>
        Celestials Blog
      </h1>
      <p className="text-center mb-5" style={{ fontSize: '18px', color: '#666' }}>
        Discover stories, tips, and insights from our jewelry world
      </p>
      
      {blogs.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: '18px', color: '#999' }}>No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <Row className="g-4">
          {blogs.map(blog => (
            <Col key={blog.id} md={6} lg={4}>
              <Card className="blog-card h-100 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="blog-title">{blog.title}</Card.Title>
                  <p className="text-muted small">{formatDate(blog.createdAt)}</p>
                  <p className="blog-excerpt flex-grow-1">{blog.excerpt || blog.content.substring(0, 150)}...</p>
                  <Link to={`/blog/${blog.id}`}>
                    <Button variant="outline-primary" className="mt-3">
                      Read More
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  )
}
