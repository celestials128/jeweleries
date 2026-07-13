import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Button, Spinner } from 'react-bootstrap'
import { orderAPI } from '../../services/api'
import './OrderHistory.css'

interface OrderItem {
  quantity: number
  price: number
  product?: { name: string }
  productName?: string
}

interface Order {
  id: number
  total: number
  status: string
  paymentMethod?: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  CREATED:   { label: 'In asteptare', cls: 'status-created' },
  AWAITING_CASH_ON_DELIVERY: { label: 'Cash la livrare', cls: 'status-created' },
  PENDING_PAYMENT: { label: 'In asteptare plata', cls: 'status-created' },
  PAID:      { label: 'Platita',      cls: 'status-paid' },
  SHIPPED:   { label: 'Expediata',    cls: 'status-shipped' },
  DELIVERED: { label: 'Livrata',      cls: 'status-delivered' },
  CANCELLED: { label: 'Anulata',      cls: 'status-cancelled' }
}

const PAYMENT_LABELS: Record<string, string> = {
  CARD_ONLINE: 'Card online',
  CASH_ON_DELIVERY: 'Cash la livrare'
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const isLoggedIn = !!localStorage.getItem('token')

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    orderAPI.getAll()
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <Container className="py-5 text-center">
        <div className="oh-empty-state">
          <div className="oh-empty-icon">📦</div>
          <h2>Autentifica-te pentru a vedea comenzile</h2>
          <p className="text-muted mb-4">Comenzile sunt salvate in contul tau.</p>
          <Link to="/login">
            <Button variant="primary" size="lg">Conecteaza-te</Button>
          </Link>
        </div>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" style={{ color: '#1e3a8a' }} />
      </Container>
    )
  }

  if (orders.length === 0) {
    return (
      <Container className="py-5 text-center">
        <div className="oh-empty-state">
          <div className="oh-empty-icon">🛍️</div>
          <h2>Nu ai comenzi inca</h2>
          <p className="text-muted mb-4">Descopera colectia noastra de bijuterii.</p>
          <Link to="/products">
            <Button variant="primary" size="lg">Descopera produse</Button>
          </Link>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-5 oh-container">
      <h1 className="oh-title">Comenzile Mele</h1>
      <p className="oh-subtitle">{orders.length} {orders.length === 1 ? 'comanda' : 'comenzi'}</p>

      <div className="oh-list">
        {orders.map(order => {
          const statusInfo = STATUS_LABELS[order.status] || { label: order.status, cls: 'status-created' }
          return (
            <div key={order.id} className="oh-card">
              <div className="oh-card-header">
                <div>
                  <span className="oh-order-num">Comanda #{order.id}</span>
                  <span className="oh-date">
                    {new Date(order.createdAt).toLocaleDateString('ro-RO', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="d-flex flex-column align-items-end gap-2">
                  <span className={`oh-status ${statusInfo.cls}`}>{statusInfo.label}</span>
                  <span className="oh-payment-method">{PAYMENT_LABELS[order.paymentMethod || ''] || 'Nespecificat'}</span>
                </div>
              </div>

              <div className="oh-items">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="oh-item">
                    <span className="oh-item-name">
                      {item.product?.name || item.productName || 'Produs'}
                    </span>
                    <span className="oh-item-qty">x{item.quantity}</span>
                    <span className="oh-item-price">
                      ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="oh-card-footer">
                <span className="oh-total">Total: ${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}
