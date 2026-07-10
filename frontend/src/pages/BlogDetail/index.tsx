import React, { useEffect, useState } from 'react'
import { Container, Spinner, Button, Row, Col } from 'react-bootstrap'
import { useParams, Link } from 'react-router-dom'
import '../Blog/Blog.css'

interface BlogPost {
  id: number
  title: string
  content: string
  author: { id: number; email: string }
  published: boolean
  createdAt: string
}

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>()
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8080/api/blogs/${id}`)
        .then(res => res.json())
        .then(data => setBlog(data))
        .catch(err => console.error('Failed to fetch blog', err))
        .finally(() => setLoading(false))
    }
  }, [id])

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

  if (!blog) {
    return (
      <Container className="py-5 text-center">
        <h2>Blog post not found</h2>
        <Link to="/">
          <Button variant="primary" className="mt-3">
            Back to Home
          </Button>
        </Link>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8} className="mx-auto">
          <div className="blog-detail">
            <h1>{blog.title}</h1>
            <div className="blog-meta">
              <span>By {blog.author.email}</span>
              <span className="ms-3">Published: {formatDate(blog.createdAt)}</span>
            </div>
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.content }} />
            <div className="mt-5">
              <Link to="/">
                <Button variant="outline-primary">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
