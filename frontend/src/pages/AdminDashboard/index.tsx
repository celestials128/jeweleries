import React, { useEffect, useMemo, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner, Badge, Pagination } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { productAPI, uploadAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './AdminDashboard.css'

interface Product {
  id?: number
  name: string
  description: string
  price: number
  imageUrl?: string
  imageUrls?: string[]
  stock: number
}

interface ProductForm {
  name: string
  description: string
  price: number
  stock: number
}

interface FormImage {
  id: string
  url: string
  isNew: boolean
  file?: File
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: 0,
  stock: 0
}

function getProductImageUrls(product: Product): string[] {
  const urls: string[] = []

  if (Array.isArray(product.imageUrls)) {
    for (const url of product.imageUrls) {
      const resolved = resolveMediaUrl(url)
      if (resolved && !urls.includes(resolved)) urls.push(resolved)
    }
  }

  const mainImage = resolveMediaUrl(product.imageUrl)
  if (mainImage && !urls.includes(mainImage)) {
    urls.unshift(mainImage)
  }

  return urls
}

function getUploadedUrl(data: any): string | null {
  if (!data) return null
  if (typeof data === 'string' && data.length > 0) return data
  if (data.data && typeof data.data === 'string') return data.data
  return data.url || data.imageUrl || data.fileUrl || data.location || data.path || data.uri || null
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [images, setImages] = useState<FormImage[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage))
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [products.length, currentPage])

  const fetchProducts = () => {
    productAPI.getAll()
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        const message = err.response?.data?.error || 'Failed to fetch products'
        setError(message)
        toast.error(message)
      })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: FormImage[] = Array.from(files).map((file, idx) => ({
      id: `new-${Date.now()}-${idx}-${file.name}`,
      url: URL.createObjectURL(file),
      isNew: true,
      file
    }))

    // Append to end of existing previewed files
    setImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    setImages(prev => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const buildFinalImageUrls = async (): Promise<string[]> => {
    const result: string[] = []

    for (const image of images) {
      if (!image.isNew) {
        result.push(image.url)
        continue
      }

      if (!image.file) {
        throw new Error('A selected image is missing file data.')
      }

      const uploadResponse = await uploadAPI.uploadImage(image.file)
      console.log('[Upload response]', uploadResponse.data)
      const uploadedUrl = getUploadedUrl(uploadResponse.data)
      console.log('[Resolved upload URL]', uploadedUrl)

      if (!uploadedUrl) {
        throw new Error('Upload completed but no image URL was returned by backend.')
      }

      result.push(uploadedUrl)
    }

    return result
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const finalImageUrls = await buildFinalImageUrls()
      const productData = {
        ...form,
        imageUrl: finalImageUrls[0] || '',
        imageUrls: finalImageUrls
      }

      if (editing) {
        await productAPI.update(editing, productData)
        // Update in place so the product keeps its position in the list
        const updatedProduct = { ...productData, id: editing }
        setProducts(prev => prev.map(p => p.id === editing ? updatedProduct : p))
        setSuccess('Product updated successfully!')
        toast.success('Produsul a fost actualizat.')
      } else {
        await productAPI.create(productData)
        setSuccess('Product created successfully!')
        toast.success('Produsul a fost creat.')
        fetchProducts()
      }
      setForm(EMPTY_FORM)
      setImages([])
      setEditing(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    const imageUrls = getProductImageUrls(product)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: Number(product.price || 0),
      stock: Number(product.stock || 0)
    })
    setImages(
      imageUrls.map((url, idx) => ({
        id: `existing-${product.id || 'p'}-${idx}`,
        url,
        isNew: false
      }))
    )
    setEditing(product.id || null)

    setTimeout(() => {
      const formElement = document.querySelector('.admin-form-card')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 0)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await productAPI.delete(id)
      setSuccess('Product deleted successfully!')
      toast.success('Produsul a fost sters.')
      fetchProducts()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to delete product'
      setError(message)
      toast.error(message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleCancel = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImages([])
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = useMemo(
    () => products.slice(startIndex, endIndex),
    [products, startIndex, endIndex]
  )

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (
    <Container fluid className="admin-dashboard py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="admin-title">Admin Dashboard - Product Management</h1>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="admin-card admin-form-card shadow-sm border-0">
            <Card.Header className="admin-card-header d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">
                {editing ? 'Edit Product' : 'Create New Product'}
              </Card.Title>
              <Button size="sm" variant="light" onClick={handleCancel}>
                {editing ? '+ New Product' : 'Clear Form'}
              </Button>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </Form.Group>

                <Row className="g-2">
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price *</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stock *</Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Product Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  <Form.Text className="text-muted d-block mt-2">
                    Add images, reorder with arrows, and remove unwanted images.
                  </Form.Text>
                </Form.Group>

                {images.length > 0 && (
                  <div className="mb-4">
                    <Form.Label>Images ({images.length})</Form.Label>
                    <div className="image-preview-grid">
                      {images.map((image, index) => (
                        <div key={image.id} className="image-preview-item">
                          <img src={image.url} alt={`Preview ${index + 1}`} />
                          <div className="image-tools">
                            <button
                              type="button"
                              className="btn-image-tool"
                              onClick={() => moveImage(index, 'left')}
                              disabled={index === 0}
                              title="Move left"
                            >
                              {'<'}
                            </button>
                            <button
                              type="button"
                              className="btn-image-tool"
                              onClick={() => moveImage(index, 'right')}
                              disabled={index === images.length - 1}
                              title="Move right"
                            >
                              {'>'}
                            </button>
                            <button
                              type="button"
                              className="btn-image-tool btn-remove-image"
                              onClick={() => removeImage(index)}
                              title="Remove"
                            >
                              x
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || !form.name}
                    className="flex-grow-1 admin-btn-submit"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Saving...
                      </>
                    ) : (
                      editing ? 'Update Product' : 'Create Product'
                    )}
                  </Button>
                  {editing && (
                    <Button variant="outline-secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="admin-card shadow-sm border-0">
            <Card.Header className="admin-card-header">
              <Card.Title className="mb-0">Products ({products.length})</Card.Title>
            </Card.Header>
            <Card.Body className="table-responsive">
              {products.length === 0 ? (
                <p className="text-muted text-center py-4">No products yet. Create one to get started.</p>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">
                      Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of {products.length} products
                    </span>
                  </div>
                  <Table hover className="mb-4">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map(product => (
                        <tr
                          key={product.id}
                          className="product-row-clickable"
                          onClick={() => handleEdit(product)}
                          title="Click to edit"
                        >
                          <td>
                            <div>
                              <strong>{product.name}</strong>
                              <div className="text-muted small">{product.description?.substring(0, 40)}</div>
                            </div>
                          </td>
                          <td>
                            <Badge bg="info">${Number(product.price).toFixed(2)}</Badge>
                          </td>
                          <td>
                            <Badge bg={product.stock > 0 ? 'success' : 'danger'}>
                              {product.stock} units
                            </Badge>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(product.id!)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center">
                      <Pagination className="pagination-admin">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
