import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Table, Button, Alert, Row, Col, Form } from 'react-bootstrap'
import { toast } from 'react-toastify'
import './Cart.css'

export default function Cart() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const navigate = useNavigate()

  const normalizeCartItems = (raw: any[]): any[] => {
    if (!Array.isArray(raw)) return []
    return raw
      .filter(item => item && item.id !== undefined && item.id !== null)
      .map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1)
      }))
  }

  useEffect(() => {
    const cart = normalizeCartItems(JSON.parse(localStorage.getItem('cart') || '[]'))
    setCartItems(cart)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart:updated'))
  }, [])

  const removeItem = (productId: number | string) => {
    const removedItem = cartItems.find(item => String(item.id) === String(productId))
    const updated = cartItems.filter(item => String(item.id) !== String(productId))
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart:updated'))
    if (removedItem) {
      toast.info(`${removedItem.name} a fost eliminat din cos.`)
    }
  }

  const updateQuantity = (productId: number | string, quantity: number) => {
    if(quantity <= 0){
      removeItem(productId)
      return
    }
    const updated = cartItems.map(item =>
      String(item.id) === String(productId) ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
    )
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart:updated'))
  }

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if(cartItems.length === 0){
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          <h3>Cosul tau este gol</h3>
          <p>Descopera colectia noastra de bijuterii exquisite.</p>
        </Alert>
        <Link to="/products">
          <Button variant="primary" size="lg">Continua cumparaturile</Button>
        </Link>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4" style={{ color: '#2a2a2a', fontSize: '36px', letterSpacing: '2px' }}>
        ✨ Cosul Tau
      </h1>
      <Table responsive="lg" className="cart-table">
        <thead>
          <tr>
            <th>Produs</th>
            <th>Pret</th>
            <th>Cantitate</th>
            <th>Total</th>
            <th>Actiune</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map(item => (
            <tr key={item.id} className="cart-table-row">
              <td data-label="Produs" className="fw-600 cart-product-cell">{item.name}</td>
              <td data-label="Pret" className="cart-price-cell">${Number(item.price).toFixed(2)}</td>
              <td data-label="Cantitate" className="cart-qty-cell">
                <Form.Control 
                  type="number" 
                  min="1" 
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                  className="cart-qty-input"
                />
              </td>
              <td data-label="Total" className="fw-bold cart-total-cell">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
              <td data-label="Actiune" className="cart-action-cell">
                <Button 
                  variant="outline-light"
                  size="sm"
                  className="cart-remove-btn"
                  onClick={() => removeItem(item.id)}
                >
                  Sterge
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Row className="mt-5">
        <Col md={8}></Col>
        <Col md={4}>
          <div className="p-4 border rounded" style={{ backgroundColor: 'rgba(166, 124, 82, 0.05)', borderColor: 'rgba(166, 124, 82, 0.1)' }}>
            <h4 className="mb-3">Rezumat</h4>
            <h3 className="mb-4" style={{ color: '#a67c52' }}>
              Total: ${total.toFixed(2)}
            </h3>
            <Button 
              variant="primary"
              size="lg"
              className="w-100 mb-2"
              onClick={() => navigate('/checkout')}
            >
              Continua cu Plata
            </Button>
            <Link to="/products">
              <Button variant="secondary" className="w-100">
                Continua Cumparaturile
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
