import React, { useEffect, useState } from 'react'
import { Container, Table, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap'
import { toast } from 'react-toastify'
import '../Blog/Blog.css'

interface BlogPost {
  id: number
  title: string
  content: string
  excerpt: string
  published: boolean
  createdAt: string
}

export default function AdminBlog() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    published: false
  })

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = () => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:8080/api/blogs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBlogs(data))
      .catch(err => console.error('Failed to fetch blogs', err))
      .finally(() => setLoading(false))
  }

  const handleOpenModal = (blog?: BlogPost) => {
    if (blog) {
      setEditingId(blog.id)
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt,
        published: blog.published
      })
    } else {
      setEditingId(null)
      setFormData({ title: '', content: '', excerpt: '', published: false })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    try {
      const url = editingId 
        ? `http://localhost:8080/api/blogs/${editingId}`
        : 'http://localhost:8080/api/blogs'
      const method = editingId ? 'PUT' : 'POST'
      const headers = editingId
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-User-Id': userId! }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingId ? 'Blog updated!' : 'Blog created!')
        setShowModal(false)
        fetchBlogs()
      } else {
        toast.error('Failed to save blog')
      }
    } catch (err) {
      toast.error('Error saving blog')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return
    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`http://localhost:8080/api/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Blog deleted!')
        fetchBlogs()
      } else {
        toast.error('Failed to delete blog')
      }
    } catch (err) {
      toast.error('Error deleting blog')
    }
  }

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" />
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Blog Posts</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + New Blog Post
        </Button>
      </div>

      {blogs.length === 0 ? (
        <Alert variant="info">No blog posts yet. Create one to get started!</Alert>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map(blog => (
              <tr key={blog.id}>
                <td>{blog.title}</td>
                <td>{blog.published ? '✓ Published' : '⊗ Draft'}</td>
                <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                <td>
                  <Button size="sm" variant="warning" onClick={() => handleOpenModal(blog)} className="me-2">
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(blog.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Blog Post' : 'New Blog Post'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="blog-form">
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Blog post title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Excerpt</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.excerpt}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short summary (optional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Blog post content"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Publish"
                checked={formData.published}
                onChange={e => setFormData({ ...formData, published: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
