import React, { useEffect, useMemo, useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner, Badge, Pagination } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { authAPI, productAPI, productTypeAPI, uploadAPI, orderAPI, adminUserAPI, discountAPI } from '../../services/api'
import { resolveMediaUrl } from '../../utils/media'
import './AdminDashboard.css'

interface ProductType {
  id: number
  name: string
  slug: string
  description?: string
}

interface Product {
  id?: number
  name: string
  description: string
  price: number
  discountedPrice?: number
  discountPercent?: number
  imageUrl?: string
  imageUrls?: string[]
  stock: number
  handmade?: boolean
  popular?: boolean
  type?: ProductType
}

interface ProductForm {
  name: string
  description: string
  price: number
  stock: number
  typeId: number | ''
  discountPercent: number
  handmade: boolean
  popular: boolean
}

interface FormImage {
  id: string
  url: string
  isNew: boolean
  file?: File
}

interface AdminUser {
  id: number
  username: string
  email?: string
  role: string
  orderCount: number
  totalSpent: number
  lastOrderDate?: string
}

interface UserOrder {
  id: number
  status: string
  paymentMethod?: string
  total: number
  createdAt: string
  items: { id: number; quantity: number; price: number; productName?: string }[]
}

interface Order {
  id: number
  status: string
  paymentMethod?: string
  total: number
  createdAt: string
}

interface DiscountCode {
  id: number
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  assignedUsername?: string
  maxUses?: number
  usedCount: number
  expiresAt?: string
  active: boolean
  createdAt: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  typeId: '',
  discountPercent: 0,
  handmade: false,
  popular: false
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
  const [types, setTypes] = useState<ProductType[]>([])
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDescription, setNewTypeDescription] = useState('')
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null)
  const [editingTypeName, setEditingTypeName] = useState('')
  const [editingTypeDescription, setEditingTypeDescription] = useState('')

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'discounts' | 'settings'>('products')

  // Users tab state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)
  const [userOrders, setUserOrders] = useState<Record<number, UserOrder[]>>({})
  const [userOrdersLoading, setUserOrdersLoading] = useState<Record<number, boolean>>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all')
  const [orderSortBy, setOrderSortBy] = useState<'createdAt' | 'total' | 'id'>('createdAt')
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Discount codes state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [discountCodesLoading, setDiscountCodesLoading] = useState(false)
  const [discountForm, setDiscountForm] = useState({ code: '', type: 'PERCENTAGE', value: '', assignedUsername: '', maxUses: '', expiresAt: '' })
  const [userSearch, setUserSearch] = useState('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [images, setImages] = useState<FormImage[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [nameFilter, setNameFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [flagFilters, setFlagFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'price' | 'stock'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const itemsPerPage = 10

  useEffect(() => {
    fetchProducts()
    fetchTypes()
    fetchOrders()
  }, [])

  const fetchProducts = () => {
    productAPI.getAll()
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        const message = err.response?.data?.error || 'Failed to fetch products'
        setError(message)
        toast.error(message)
      })
  }

  const fetchTypes = () => {
    productTypeAPI.getAllAdmin()
      .then(res => setTypes(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        const message = err.response?.data?.error || 'Failed to fetch categories'
        setError(message)
        toast.error(message)
      })
  }

  const fetchOrders = () => {
    setOrdersLoading(true)
    orderAPI.getAllAdmin()
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        const message = err.response?.data?.error || 'Failed to fetch orders'
        toast.error(message)
      })
      .finally(() => setOrdersLoading(false))
  }

  const fetchUsers = () => {
    setUsersLoading(true)
    adminUserAPI.getAll()
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Nu s-au putut incarca utilizatorii.'))
      .finally(() => setUsersLoading(false))
  }

  const fetchDiscountCodes = () => {
    setDiscountCodesLoading(true)
    discountAPI.getAll()
      .then(res => setDiscountCodes(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Nu s-au putut incarca codurile de discount.'))
      .finally(() => setDiscountCodesLoading(false))
  }

  const handleCreateDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        code: discountForm.code.trim().toUpperCase(),
        type: discountForm.type,
        value: discountForm.value
      }
      if (discountForm.assignedUsername.trim()) payload.assignedUsername = discountForm.assignedUsername.trim()
      if (discountForm.maxUses.trim()) payload.maxUses = discountForm.maxUses.trim()
      if (discountForm.expiresAt.trim()) payload.expiresAt = new Date(discountForm.expiresAt).toISOString()
      await discountAPI.create(payload)
      toast.success('Cod creat!')
      setDiscountForm({ code: '', type: 'PERCENTAGE', value: '', assignedUsername: '', maxUses: '', expiresAt: '' })
      fetchDiscountCodes()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Eroare la creare cod.')
    }
  }

  const handleDeleteDiscountCode = async (id: number) => {
    if (!window.confirm('Sterge codul de discount?')) return
    try {
      await discountAPI.delete(id)
      toast.success('Cod sters.')
      setDiscountCodes(prev => prev.filter(dc => dc.id !== id))
    } catch {
      toast.error('Eroare la stergere.')
    }
  }

  const handleToggleDiscountCode = async (id: number) => {
    try {
      const res = await discountAPI.toggle(id)
      setDiscountCodes(prev => prev.map(dc => dc.id === id ? res.data : dc))
    } catch {
      toast.error('Eroare la actualizare.')
    }
  }

  const toggleUserOrders = async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }
    setExpandedUserId(userId)
    if (userOrders[userId]) return // already loaded
    setUserOrdersLoading(prev => ({ ...prev, [userId]: true }))
    try {
      const res = await adminUserAPI.getOrders(userId)
      setUserOrders(prev => ({ ...prev, [userId]: Array.isArray(res.data) ? res.data : [] }))
    } catch {
      toast.error('Nu s-au putut incarca comenzile utilizatorului.')
    } finally {
      setUserOrdersLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]:
        name === 'price' || name === 'stock' || name === 'discountPercent'
          ? Number(value)
          : name === 'typeId'
            ? (value === '' ? '' : Number(value))
            : value
    }))
  }

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(prev => ({ ...prev, [name]: checked }))
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
      const uploadedUrl = getUploadedUrl(uploadResponse.data)
      if (!uploadedUrl) {
        throw new Error('Upload completed but no image URL was returned by backend.')
      }
      result.push(uploadedUrl)
    }

    return result
  }

  const computedDiscountedPrice = useMemo(() => {
    const base = Number(form.price || 0)
    const discount = Math.max(0, Math.min(99.99, Number(form.discountPercent || 0)))
    if (base <= 0) return 0
    return Number((base * ((100 - discount) / 100)).toFixed(2))
  }, [form.price, form.discountPercent])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (form.typeId === '') {
        throw new Error('Selecteaza o categorie pentru produs.')
      }

      const finalImageUrls = await buildFinalImageUrls()
      const productData = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        discountPercent: Number(form.discountPercent),
        handmade: form.handmade,
        popular: form.popular,
        type: { id: Number(form.typeId) },
        imageUrl: finalImageUrls[0] || '',
        imageUrls: finalImageUrls
      }

      if (editing) {
        await productAPI.update(editing, productData)
        setSuccess('Product updated successfully!')
        toast.success('Produsul a fost actualizat.')
      } else {
        await productAPI.create(productData)
        setSuccess('Product created successfully!')
        toast.success('Produsul a fost creat.')
      }

      fetchProducts()
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
      stock: Number(product.stock || 0),
      typeId: product.type?.id || '',
      discountPercent: Number(product.discountPercent || 0),
      handmade: Boolean(product.handmade),
      popular: Boolean(product.popular)
    })
    setImages(
      imageUrls.map((url, idx) => ({
        id: `existing-${product.id || 'p'}-${idx}`,
        url,
        isNew: false
      }))
    )
    setEditing(product.id || null)
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

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Noua parola trebuie sa aiba cel putin 6 caractere.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Parolele nu coincid.')
      return
    }

    setPasswordLoading(true)
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      toast.success('Parola a fost actualizata.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Nu s-a putut actualiza parola.'
      toast.error(message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const createType = async () => {
    const name = newTypeName.trim()
    if (!name) return
    try {
      await productTypeAPI.create({ name, description: newTypeDescription.trim() || undefined })
      setNewTypeName('')
      setNewTypeDescription('')
      fetchTypes()
      toast.success('Categoria a fost adaugata.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Nu s-a putut adauga categoria.')
    }
  }

  const saveType = async (id: number) => {
    const name = editingTypeName.trim()
    if (!name) return
    try {
      await productTypeAPI.update(id, { name, description: editingTypeDescription.trim() || undefined })
      setEditingTypeId(null)
      setEditingTypeName('')
      setEditingTypeDescription('')
      fetchTypes()
      toast.success('Categoria a fost actualizata.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Nu s-a putut actualiza categoria.')
    }
  }

  const deleteType = async (id: number) => {
    if (!confirm('Stergi aceasta categorie?')) return
    try {
      await productTypeAPI.delete(id)
      fetchTypes()
      toast.success('Categoria a fost stearsa.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Nu s-a putut sterge categoria.')
    }
  }

  const filteredAndSortedProducts = useMemo(() => {
    const normalizedNameFilter = nameFilter.trim().toLowerCase()
    const filtered = products.filter(product => {
      const matchesName =
        normalizedNameFilter.length === 0 ||
        product.name.toLowerCase().includes(normalizedNameFilter)
      const matchesCategory =
        categoryFilter === 'all' ||
        String(product.type?.id || '') === categoryFilter
      const matchesFlags = flagFilters.every(flag => {
        if (flag === 'handmade') return Boolean(product.handmade)
        if (flag === 'popular') return Boolean(product.popular)
        if (flag === 'discounted') return Number(product.discountPercent || 0) > 0
        return true
      })
      return matchesName && matchesCategory && matchesFlags
    })

    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ro', { sensitivity: 'base' })
      } else if (sortBy === 'category') {
        comparison = (a.type?.name || '').localeCompare(b.type?.name || '', 'ro', { sensitivity: 'base' })
      } else if (sortBy === 'price') {
        comparison = Number(a.discountedPrice || a.price || 0) - Number(b.discountedPrice || b.price || 0)
      } else if (sortBy === 'stock') {
        comparison = Number(a.stock || 0) - Number(b.stock || 0)
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [products, nameFilter, categoryFilter, flagFilters, sortBy, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredAndSortedProducts.length)
  const paginatedProducts = useMemo(
    () => filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage),
    [filteredAndSortedProducts, startIndex]
  )

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter
      const matchesPayment = orderPaymentFilter === 'all' || order.paymentMethod === orderPaymentFilter
      return matchesStatus && matchesPayment
    })

    filtered.sort((a, b) => {
      let comparison = 0
      if (orderSortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (orderSortBy === 'total') {
        comparison = Number(a.total || 0) - Number(b.total || 0)
      } else {
        comparison = Number(a.id || 0) - Number(b.id || 0)
      }
      return orderSortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [orders, orderStatusFilter, orderPaymentFilter, orderSortBy, orderSortDirection])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [nameFilter, categoryFilter, flagFilters, sortBy, sortDirection])

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (
    <Container fluid className="admin-dashboard py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="admin-title">Admin Dashboard</h1>
        </Col>
      </Row>

      {/* Tab navigation */}
      <Row className="mb-4">
        <Col>
          <div className="admin-tabs">
            <button className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Produse & Categorii</button>
            <button className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Comenzi</button>
            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); if (users.length === 0) fetchUsers() }}>Utilizatori</button>
            <button className={`admin-tab-btn ${activeTab === 'discounts' ? 'active' : ''}`} onClick={() => { setActiveTab('discounts'); if (discountCodes.length === 0) fetchDiscountCodes(); if (users.length === 0) fetchUsers() }}>Discounturi</button>
            <button className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Setari</button>
          </div>
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
        {activeTab === 'users' && (
          <Col xs={12}>
            <Card className="admin-card shadow-sm border-0">
              <Card.Header className="admin-card-header d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Utilizatori ({users.length})</Card.Title>
                <Button size="sm" variant="outline-primary" onClick={fetchUsers} disabled={usersLoading}>
                  {usersLoading ? <Spinner size="sm" animation="border" /> : '↻ Reincarca'}
                </Button>
              </Card.Header>
              <Card.Body className="table-responsive">
                {usersLoading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : users.length === 0 ? (
                  <p className="text-muted text-center py-4">Nu exista utilizatori inregistrati.</p>
                ) : (
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Utilizator</th>
                        <th>Email</th>
                        <th>Comenzi</th>
                        <th>Total cheltuit</th>
                        <th>Ultima comanda</th>
                        <th>Detalii</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <React.Fragment key={user.id}>
                          <tr>
                            <td><strong>{user.username}</strong></td>
                            <td>{user.email ? <a href={`mailto:${user.email}`}>{user.email}</a> : <span className="text-muted">—</span>}</td>
                            <td>
                              <Badge bg={user.orderCount > 0 ? 'primary' : 'secondary'}>
                                {user.orderCount} {user.orderCount === 1 ? 'comanda' : 'comenzi'}
                              </Badge>
                            </td>
                            <td>
                              {user.orderCount > 0
                                ? <strong>{Number(user.totalSpent).toFixed(2)} RON</strong>
                                : <span className="text-muted">—</span>}
                            </td>
                            <td>
                              {user.lastOrderDate
                                ? new Date(user.lastOrderDate).toLocaleDateString('ro-RO')
                                : <span className="text-muted">—</span>}
                            </td>
                            <td>
                              {user.orderCount > 0 && (
                                <Button
                                  size="sm"
                                  variant={expandedUserId === user.id ? 'primary' : 'outline-primary'}
                                  onClick={() => toggleUserOrders(user.id)}
                                >
                                  {expandedUserId === user.id ? '▲ Ascunde' : '▼ Comenzi'}
                                </Button>
                              )}
                            </td>
                          </tr>
                          {expandedUserId === user.id && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <div className="user-orders-panel">
                                  {userOrdersLoading[user.id] ? (
                                    <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                                  ) : (userOrders[user.id] || []).length === 0 ? (
                                    <p className="text-muted p-3 mb-0">Nicio comanda gasita.</p>
                                  ) : (
                                    <Table size="sm" className="mb-0 user-orders-table">
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Data</th>
                                          <th>Status</th>
                                          <th>Plata</th>
                                          <th>Total</th>
                                          <th>Produse</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(userOrders[user.id] || []).map(order => (
                                          <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</td>
                                            <td>
                                              <Badge bg={
                                                order.status === 'PAID' ? 'success' :
                                                order.status === 'SHIPPED' ? 'info' :
                                                order.status === 'CANCELLED' ? 'danger' :
                                                order.status === 'AWAITING_CASH_ON_DELIVERY' ? 'warning' : 'secondary'
                                              } text={order.status === 'AWAITING_CASH_ON_DELIVERY' ? 'dark' : undefined}>
                                                {order.status}
                                              </Badge>
                                            </td>
                                            <td>
                                              <span className="text-muted small">
                                                {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Numerar' : 'Card'}
                                              </span>
                                            </td>
                                            <td><strong>{Number(order.total).toFixed(2)} RON</strong></td>
                                            <td>
                                              <div className="order-items-list">
                                                {order.items.map(item => (
                                                  <span key={item.id} className="order-item-chip">
                                                    {item.productName} ×{item.quantity}
                                                  </span>
                                                ))}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {activeTab === 'products' && (
          <>
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
                  <Form.Control type="text" name="name" value={form.name} onChange={handleInputChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" value={form.description} onChange={handleInputChange} rows={3} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select name="typeId" value={form.typeId} onChange={handleInputChange} required>
                    <option value="">Select category</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row className="g-2">
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price *</Form.Label>
                      <Form.Control type="number" name="price" value={form.price} onChange={handleInputChange} step="0.01" min="0" required />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stock *</Form.Label>
                      <Form.Control type="number" name="stock" value={form.stock} onChange={handleInputChange} min="0" required />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control type="number" name="discountPercent" value={form.discountPercent} onChange={handleInputChange} min="0" max="99.99" step="0.01" />
                  <Form.Text className="text-muted">
                    Final price: ${computedDiscountedPrice.toFixed(2)}
                  </Form.Text>
                </Form.Group>

                <Row className="g-2">
                  <Col sm={6}>
                    <Form.Check
                      type="switch"
                      id="handmade-switch"
                      name="handmade"
                      checked={form.handmade}
                      onChange={handleToggleChange}
                      label="Handmade"
                    />
                  </Col>
                  <Col sm={6}>
                    <Form.Check
                      type="switch"
                      id="popular-switch"
                      name="popular"
                      checked={form.popular}
                      onChange={handleToggleChange}
                      label="Popular (manual)"
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Product Images</Form.Label>
                  <Form.Control type="file" multiple accept="image/*" onChange={handleImageSelect} />
                </Form.Group>

                {images.length > 0 && (
                  <div className="mb-4">
                    <Form.Label>Images ({images.length})</Form.Label>
                    <div className="image-preview-grid">
                      {images.map((image, index) => (
                        <div key={image.id} className="image-preview-item">
                          <img src={image.url} alt={`Preview ${index + 1}`} />
                          <div className="image-tools">
                            <button type="button" className="btn-image-tool" onClick={() => moveImage(index, 'left')} disabled={index === 0}>{'<'}</button>
                            <button type="button" className="btn-image-tool" onClick={() => moveImage(index, 'right')} disabled={index === images.length - 1}>{'>'}</button>
                            <button type="button" className="btn-image-tool btn-remove-image" onClick={() => removeImage(index)}>x</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={loading || !form.name} className="flex-grow-1 admin-btn-submit">
                    {loading ? <><Spinner size="sm" className="me-2" /> Saving...</> : (editing ? 'Update Product' : 'Create Product')}
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

          <Card className="admin-card shadow-sm border-0 mt-4">
            <Card.Header className="admin-card-header">
              <Card.Title className="mb-0">Product Categories</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-2 mb-3 flex-column">
                <Form.Control
                  type="text"
                  placeholder="Add new category (e.g. Bratari)"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                />
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Category description (optional, shown on the products page)"
                  value={newTypeDescription}
                  onChange={e => setNewTypeDescription(e.target.value)}
                />
                <Button onClick={createType}>Add</Button>
              </div>
              <div className="d-flex flex-column gap-2">
                {types.map(type => (
                  <div key={type.id} className="d-flex gap-2 align-items-start">
                    {editingTypeId === type.id ? (
                      <div className="flex-grow-1 d-flex flex-column gap-2">
                        <Form.Control value={editingTypeName} onChange={e => setEditingTypeName(e.target.value)} />
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Description (optional)"
                          value={editingTypeDescription}
                          onChange={e => setEditingTypeDescription(e.target.value)}
                        />
                        <div className="d-flex gap-2">
                          <Button size="sm" onClick={() => saveType(type.id)}>Save</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setEditingTypeId(null); setEditingTypeName(''); setEditingTypeDescription('') }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{type.name}</div>
                          {type.description && <div className="text-muted small">{type.description}</div>}
                        </div>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => {
                            setEditingTypeId(type.id)
                            setEditingTypeName(type.name)
                            setEditingTypeDescription(type.description || '')
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => deleteType(type.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="admin-card shadow-sm border-0">
            <Card.Header className="admin-card-header">
              <Card.Title className="mb-0">Products ({filteredAndSortedProducts.length})</Card.Title>
            </Card.Header>
            <Card.Body className="table-responsive">
              {products.length === 0 ? (
                <p className="text-muted text-center py-4">No products yet. Create one to get started.</p>
              ) : (
                <>
                  <div className="table-toolbar mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Filter by name..."
                      value={nameFilter}
                      onChange={e => setNameFilter(e.target.value)}
                    />
                    <Form.Select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All categories</option>
                      {types.map(type => (
                        <option key={type.id} value={String(type.id)}>{type.name}</option>
                      ))}
                    </Form.Select>
                    <Form.Select
                      value={flagFilters[0] || 'all'}
                      onChange={e => setFlagFilters(e.target.value === 'all' ? [] : [e.target.value])}
                    >
                      <option value="all">All flags</option>
                      <option value="handmade">Handmade</option>
                      <option value="popular">Popular</option>
                      <option value="discounted">Discounted</option>
                    </Form.Select>
                    <Form.Select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'name' | 'category' | 'price' | 'stock')}
                    >
                      <option value="name">Sort by Name</option>
                      <option value="category">Sort by Category</option>
                      <option value="price">Sort by Price</option>
                      <option value="stock">Sort by Stock</option>
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    >
                      {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                    </Button>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">
                      {filteredAndSortedProducts.length === 0
                        ? 'No products match current filters'
                        : `Showing ${startIndex + 1} to ${endIndex} of ${filteredAndSortedProducts.length} products`}
                    </span>
                  </div>
                  {paginatedProducts.length === 0 ? (
                    <p className="text-muted text-center py-4">No products match current filters.</p>
                  ) : (
                    <Table hover className="mb-4">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th style={{ minWidth: '110px', width: '110px' }}>Price</th>
                          <th>Flags</th>
                          <th>Stock</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map(product => (
                          <tr key={product.id} className="product-row-clickable" onClick={() => handleEdit(product)} title="Click to edit">
                            <td>
                              <div>
                                <strong>{product.name}</strong>
                                <div className="text-muted small">{product.description?.substring(0, 40)}</div>
                              </div>
                            </td>
                            <td>{product.type?.name || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                {Number(product.discountPercent || 0) > 0 && (
                                  <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                    {Number(product.price).toFixed(2)} RON
                                  </div>
                                )}
                                <span className="discount-price-badge" style={{ whiteSpace: 'nowrap' }}>{Number(product.discountedPrice || product.price).toFixed(2)} RON</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                {product.handmade && <Badge bg="secondary">Handmade</Badge>}
                                {product.popular && <Badge bg="warning" text="dark">Popular</Badge>}
                              </div>
                            </td>
                            <td>
                              <Badge bg={product.stock > 0 ? 'success' : 'danger'}>
                                {product.stock} units
                              </Badge>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                              <Button size="sm" variant="outline-danger" onClick={() => handleDelete(product.id!)}>
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}

                  {totalPages > 1 && paginatedProducts.length > 0 && (
                    <div className="d-flex justify-content-center">
                      <Pagination className="pagination-admin">
                        <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Pagination.Item key={page} active={page === currentPage} onClick={() => handlePageChange(page)}>
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
        </>
        )}

        {activeTab === 'orders' && (
          <Col xs={12}>
          <Card className="admin-card shadow-sm border-0">
            <Card.Header className="admin-card-header">
              <Card.Title className="mb-0">Comenzi ({filteredAndSortedOrders.length})</Card.Title>
            </Card.Header>
            <Card.Body className="table-responsive">
              {ordersLoading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
              ) : orders.length === 0 ? (
                <p className="text-muted text-center py-4">No orders yet.</p>
              ) : (
                <>
                  <div className="table-toolbar mb-3">
                    <Form.Select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                      <option value="all">All statuses</option>
                      <option value="AWAITING_CASH_ON_DELIVERY">Cash on delivery</option>
                      <option value="PENDING_PAYMENT">Pending payment</option>
                      <option value="PAID">Paid</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </Form.Select>
                    <Form.Select value={orderPaymentFilter} onChange={e => setOrderPaymentFilter(e.target.value)}>
                      <option value="all">All payment methods</option>
                      <option value="CARD_ONLINE">Card online</option>
                      <option value="CASH_ON_DELIVERY">Cash on delivery</option>
                    </Form.Select>
                    <Form.Select value={orderSortBy} onChange={e => setOrderSortBy(e.target.value as 'createdAt' | 'total' | 'id')}>
                      <option value="createdAt">Sort by date</option>
                      <option value="total">Sort by total</option>
                      <option value="id">Sort by order id</option>
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() => setOrderSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    >
                      {orderSortDirection === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                    </Button>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted small">{filteredAndSortedOrders.length} comenzi</span>
                  </div>
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Plata</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedOrders.map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>
                            <Badge bg={order.paymentMethod === 'CASH_ON_DELIVERY' ? 'warning' : 'primary'} text={order.paymentMethod === 'CASH_ON_DELIVERY' ? 'dark' : 'light'}>
                              {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash la livrare' : 'Card online'}
                            </Badge>
                          </td>
                          <td>{order.status}</td>
                          <td>{Number(order.total).toFixed(2)} RON</td>
                          <td>{new Date(order.createdAt).toLocaleString('ro-RO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
          </Col>
        )}

        {activeTab === 'discounts' && (
          <Col xs={12}>
            <Card className="admin-card shadow-sm border-0 mb-4">
              <Card.Header className="admin-card-header">
                <Card.Title className="mb-0">Creeaza cod de discount</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleCreateDiscountCode}>
                  <Row className="g-3">
                    <Col sm={6} md={3}>
                      <Form.Group>
                        <Form.Label>Cod *</Form.Label>
                        <Form.Control
                          value={discountForm.code}
                          onChange={e => setDiscountForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                          placeholder="ex: VARA20"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={2}>
                      <Form.Group>
                        <Form.Label>Tip *</Form.Label>
                        <Form.Select value={discountForm.type} onChange={e => setDiscountForm(f => ({ ...f, type: e.target.value }))}>
                          <option value="PERCENTAGE">Procent (%)</option>
                          <option value="FIXED">Fix (RON)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={2}>
                      <Form.Group>
                        <Form.Label>Valoare *</Form.Label>
                        <Form.Control
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={discountForm.value}
                          onChange={e => setDiscountForm(f => ({ ...f, value: e.target.value }))}
                          placeholder={discountForm.type === 'PERCENTAGE' ? '10' : '50'}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={3}>
                      <Form.Group style={{ position: 'relative' }}>
                        <Form.Label>Utilizator (optional)</Form.Label>
                        <Form.Control
                          value={userSearch}
                          onChange={e => {
                            setUserSearch(e.target.value)
                            setDiscountForm(f => ({ ...f, assignedUsername: '' }))
                            setUserDropdownOpen(true)
                          }}
                          onFocus={() => setUserDropdownOpen(true)}
                          placeholder={discountForm.assignedUsername || 'Lasă gol = general'}
                          autoComplete="off"
                        />
                        {userDropdownOpen && userSearch.length > 0 && (
                          <div style={{
                            position: 'absolute', zIndex: 1050, background: '#fff',
                            border: '1px solid #ece7e2', width: '100%', maxHeight: '180px',
                            overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}>
                            {users
                              .filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase()))
                              .slice(0, 20)
                              .map(u => (
                                <div
                                  key={u.id}
                                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0ece8', fontSize: '0.875rem' }}
                                  onMouseDown={() => {
                                    setDiscountForm(f => ({ ...f, assignedUsername: u.username }))
                                    setUserSearch(u.email || u.username)
                                    setUserDropdownOpen(false)
                                  }}
                                >
                                  <strong>{u.username}</strong>
                                  {u.email && <span style={{ color: '#6b7280', marginLeft: 6 }}>{u.email}</span>}
                                </div>
                              ))}
                            {users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                              <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: '0.875rem' }}>Niciun utilizator gasit</div>
                            )}
                          </div>
                        )}
                        {discountForm.assignedUsername && (
                          <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: 2 }}>
                            ✓ {discountForm.assignedUsername}
                            <button type="button" style={{ border: 'none', background: 'none', color: '#dc2626', marginLeft: 6, cursor: 'pointer', padding: 0 }}
                              onClick={() => { setDiscountForm(f => ({ ...f, assignedUsername: '' })); setUserSearch('') }}>✕</button>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={2}>
                      <Form.Group>
                        <Form.Label>Max utilizari</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={discountForm.maxUses}
                          onChange={e => setDiscountForm(f => ({ ...f, maxUses: e.target.value }))}
                          placeholder="nelimitat"
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={6} md={3}>
                      <Form.Group>
                        <Form.Label>Expira la</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={discountForm.expiresAt}
                          onChange={e => setDiscountForm(f => ({ ...f, expiresAt: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={2} className="d-flex align-items-end">
                      <Button type="submit" variant="primary" className="w-100">
                        Creeaza
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            <Card className="admin-card shadow-sm border-0">
              <Card.Header className="admin-card-header d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">Coduri de discount ({discountCodes.length})</Card.Title>
                <Button size="sm" variant="outline-primary" onClick={fetchDiscountCodes} disabled={discountCodesLoading}>
                  {discountCodesLoading ? <Spinner size="sm" animation="border" /> : '↻ Reincarca'}
                </Button>
              </Card.Header>
              <Card.Body className="table-responsive">
                {discountCodesLoading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : discountCodes.length === 0 ? (
                  <p className="text-muted text-center py-4">Nu exista coduri de discount.</p>
                ) : (
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Cod</th>
                        <th>Tip</th>
                        <th>Valoare</th>
                        <th>Utilizator</th>
                        <th>Max</th>
                        <th>Utilizat</th>
                        <th>Expira</th>
                        <th>Activ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountCodes.map(dc => (
                        <tr key={dc.id}>
                          <td><strong>{dc.code}</strong></td>
                          <td>{dc.type === 'PERCENTAGE' ? 'Procent' : 'Fix'}</td>
                          <td>{dc.type === 'PERCENTAGE' ? `${dc.value}%` : `${dc.value} RON`}</td>
                          <td>{dc.assignedUsername || <span className="text-muted">General</span>}</td>
                          <td>{dc.maxUses ?? <span className="text-muted">∞</span>}</td>
                          <td>{dc.usedCount}</td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {dc.expiresAt ? new Date(dc.expiresAt).toLocaleDateString('ro-RO') : <span className="text-muted">-</span>}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              style={{ minWidth: '70px' }}
                              variant={dc.active ? 'success' : 'secondary'}
                              onClick={() => handleToggleDiscountCode(dc.id)}
                            >
                              {dc.active ? 'Activ' : 'Inactiv'}
                            </Button>
                          </td>
                          <td>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteDiscountCode(dc.id)}>
                              Sterge
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {activeTab === 'settings' && (
          <Col md={6} lg={4}>
            <Card className="admin-card shadow-sm border-0">
              <Card.Header className="admin-card-header">
                <Card.Title className="mb-0">Schimba Parola</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handlePasswordUpdate}>
                  <Form.Group className="mb-3">
                    <Form.Label>Parola curenta</Form.Label>
                    <Form.Control
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Parola noua</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirma parola noua</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </Form.Group>
                  <Button type="submit" className="admin-btn-submit w-100" disabled={passwordLoading}>
                    {passwordLoading ? <><Spinner size="sm" className="me-2" />Se salveaza...</> : 'Actualizeaza parola'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  )
}
