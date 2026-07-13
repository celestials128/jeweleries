import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Table, Button, Alert, Row, Col, Form } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { resolveMediaUrl } from '../../utils/media'
import { discountAPI, settingsAPI } from '../../services/api'
import './Cart.css'

interface CartItem {
  id: number | string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

const FREE_SHIPPING_THRESHOLD = 200

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState<{ code: string; discountAmount: number } | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [shippingFee, setShippingFee] = useState(20)
  const navigate = useNavigate()

  const normalizeCartItems = (raw: any[]): CartItem[] => {
    if (!Array.isArray(raw)) return []
    return raw
      .filter(item => item && item.id !== undefined && item.id !== null)
      .map(item => ({
        id: item.id,
        name: item.name || 'Produs',
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        imageUrl: resolveMediaUrl(item.imageUrl || '')
      }))
  }

  useEffect(() => {
    const cart = normalizeCartItems(JSON.parse(localStorage.getItem('cart') || '[]'))
    setCartItems(cart)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart:updated'))

    const saved = localStorage.getItem('discount')
    if (saved) {
      try { setDiscountApplied(JSON.parse(saved)) } catch {}
    }

    settingsAPI.getPublic()
      .then(res => setShippingFee(Number(res.data.shippingFee) || 20))
      .catch(() => {})
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = discountApplied?.discountAmount ?? 0
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const shipping = totalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : shippingFee
  const grandTotal = totalAfterDiscount + shipping

  const money = (value: number) =>
    value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const removeItem = (productId: number | string) => {
    const removedItem = cartItems.find(item => String(item.id) === String(productId))
    const updated = cartItems.filter(item => String(item.id) !== String(productId))
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart:updated'))
    if (removedItem) toast.info(`${removedItem.name} a fost eliminat din cos.`)
  }

  const updateQuantity = (productId: number | string, quantity: number) => {
    if (quantity <= 0) { removeItem(productId); return }
    const updated = cartItems.map(item =>
      String(item.id) === String(productId) ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
    )
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart:updated'))
  }

  const handleApplyDiscount = async () => {
    setDiscountError('')
    if (!discountCode.trim()) return
    setDiscountLoading(true)
    try {
      const res = await discountAPI.validate(discountCode.trim(), subtotal)
      const applied = { code: res.data.code, discountAmount: Number(res.data.discountAmount) }
      setDiscountApplied(applied)
      localStorage.setItem('discount', JSON.stringify(applied))
      toast.success(`Cod aplicat: -${money(applied.discountAmount)} RON`)
    } catch (err: any) {
      setDiscountError(err.response?.data?.error || 'Cod invalid.')
      setDiscountApplied(null)
      localStorage.removeItem('discount')
    } finally {
      setDiscountLoading(false)
    }
  }

  const handleRemoveDiscount = () => {
    setDiscountApplied(null)
    setDiscountCode('')
    setDiscountError('')
    localStorage.removeItem('discount')
  }

  const quantityOptions = useMemo(() => Array.from({ length: 10 }, (_, idx) => idx + 1), [])

  if (cartItems.length === 0) {
    return (
      <Container className="cart-page py-5">
        <Alert variant="light" className="cart-empty-alert">
          <h3>Cosul tau este gol</h3>
          <p>Descopera colectia noastra de bijuterii.</p>
        </Alert>
        <div className="text-center">
          <Link to="/products">
            <Button variant="dark" size="lg">Continua cumparaturile</Button>
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="cart-page py-4 py-md-5">
      <h1 className="cart-title">Cosul meu</h1>

      <Table responsive="lg" className="cart-table">
        <thead>
          <tr>
            <th>Produs</th>
            <th>Disponibilitate</th>
            <th>Pret</th>
            <th>Cantitate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map(item => (
            <tr key={item.id} className="cart-table-row">
              <td data-label="Produs" className="cart-product-cell">
                <button
                  type="button"
                  className="cart-remove-icon"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Sterge ${item.name}`}
                >
                  x
                </button>
                <div className="cart-product-thumb">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="cart-thumb-placeholder">*</div>}
                </div>
                <div className="cart-product-info">
                  <div className="cart-product-name">{item.name}</div>
                  <button type="button" className="cart-favorite-btn">Adauga la Favorite</button>
                </div>
              </td>
              <td data-label="Disponibilitate" className="cart-availability">In stoc magazin</td>
              <td data-label="Pret" className="cart-price-cell">{money(item.price)} Lei</td>
              <td data-label="Cantitate" className="cart-qty-cell">
                <Form.Select
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  className="cart-qty-select"
                >
                  {quantityOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  {item.quantity > 10 && <option value={item.quantity}>{item.quantity}</option>}
                </Form.Select>
              </td>
              <td data-label="Total" className="cart-total-cell">
                {money(Number(item.price) * Number(item.quantity))} Lei
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Row className="mt-4 mt-md-5">
        <Col lg={6}></Col>
        <Col lg={6}>
          <div className="cart-voucher-card">
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Cod de discount</p>
            {discountApplied ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#d4edda', color: '#155724', padding: '0.35rem 0.75rem', borderRadius: 20, fontWeight: 600, fontSize: '0.9rem' }}>
                  Cod aplicat: {discountApplied.code} - -{money(discountApplied.discountAmount)} RON
                </span>
                <button type="button" onClick={handleRemoveDiscount} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
                  Elimina
                </button>
              </div>
            ) : (
              <div className="cart-voucher-row">
                <input
                  type="text"
                  value={discountCode}
                  onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError('') }}
                  placeholder="Introdu codul de discount"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountLoading || !discountCode.trim()}
                >
                  {discountLoading ? 'Se verifica...' : 'Aplica'}
                </button>
              </div>
            )}
            {discountError && (
              <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.4rem' }}>{discountError}</div>
            )}
          </div>

          <div className="cart-summary-card">
            <div className="cart-summary-line">
              <span>Subtotal produse</span>
              <strong>{money(subtotal)} Lei</strong>
            </div>
            {discountApplied && (
              <div className="cart-summary-line" style={{ color: '#16a34a' }}>
                <span>Discount ({discountApplied.code})</span>
                <strong>-{money(discountAmount)} Lei</strong>
              </div>
            )}
            <div className="cart-summary-line">
              <span>Cost transport</span>
              {shipping === 0
                ? <strong style={{ color: '#16a34a' }}>Gratuit</strong>
                : <strong>{money(shipping)} Lei</strong>}
            </div>
            {shipping > 0 && (
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                Adauga produse de {money(FREE_SHIPPING_THRESHOLD - totalAfterDiscount)} Lei pentru transport gratuit.
              </div>
            )}
            <div className="cart-summary-total">
              <span>TOTAL DE PLATA</span>
              <strong>{money(grandTotal)} Lei</strong>
            </div>
          </div>

          <div className="cart-actions">
            <Button variant="dark" className="w-100 mb-2" onClick={() => navigate('/checkout')}>
              Continua cu plata
            </Button>
            <Link to="/products" className="w-100">
              <Button variant="outline-dark" className="w-100">Continua cumparaturile</Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
