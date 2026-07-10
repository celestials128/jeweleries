import React, { useEffect, useState } from 'react'
import { orderAPI } from '../../services/api'
import './OrderHistory.css'

interface Order {
  id: number
  total: number
  status: string
  createdAt: string
  items: any[]
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orderAPI.getAll()
      .then(res => setOrders(res.data))
      .catch(err => console.error('Failed to fetch orders', err))
      .finally(() => setLoading(false))
  }, [])

  if(loading) return <div className="container"><p>Loading orders...</p></div>

  if(orders.length === 0){
    return <div className="container"><h2>No orders yet</h2></div>
  }

  return (
    <div className="container orders-container">
      <h1>Order History</h1>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>Order #{order.id}</h3>
              <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
            </div>
            <div className="order-date">
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
            <div className="order-items">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="order-item">
                  <span>{item.product?.name || 'Product'} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: ${order.total.toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
