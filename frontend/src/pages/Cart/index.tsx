import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container, Table, Button, Alert, Row, Col, Form } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { resolveMediaUrl } from '../../utils/media'
import './Cart.css'

interface CartItem {
  id: number | string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
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
    if (quantity <= 0) {
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
  const subtotalNoVat = total / 1.19
  const shipping = 0
  const totalWithVat = total + shipping

  const money = (value: number) =>
   value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
           <th>Pret cu TVA</th>
           <th>Cantitate</th>
           <th>Valoare totala cu TVA</th>
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
                 ×
               </button>
               <div className="cart-product-thumb">
                 {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="cart-thumb-placeholder">✨</div>}
               </div>
               <div className="cart-product-info">
                 <div className="cart-product-name">{item.name}</div>
                 <button type="button" className="cart-favorite-btn">♡ Adauga la Favorite</button>
               </div>
             </td>
             <td data-label="Disponibilitate" className="cart-availability">
               In stoc magazin
             </td>
             <td data-label="Pret cu TVA" className="cart-price-cell">{money(item.price)} Lei</td>
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
             <td data-label="Valoare totala cu TVA" className="cart-total-cell">
               {money(Number(item.price) * Number(item.quantity))} Lei
             </td>
           </tr>
         ))}
       </tbody>
     </Table>

     <Row className="mt-4 mt-md-5">
       <Col lg={6}></Col>
       <Col lg={6}>
         <div className="cart-summary-card">
           <div className="cart-summary-line">
             <span>Total produse fara TVA</span>
             <strong>{money(subtotalNoVat)} Lei</strong>
           </div>
           <div className="cart-summary-line">
             <span>Total produse cu TVA</span>
             <strong>{money(total)} Lei</strong>
           </div>
           <div className="cart-summary-line">
             <span>Cost transport <em>(include TVA)</em></span>
             <strong>{money(shipping)} Lei</strong>
           </div>
           <div className="cart-summary-total">
             <span>TOTAL DE PLATA CU TVA</span>
             <strong>{money(totalWithVat)} Lei</strong>
           </div>
         </div>

         <div className="cart-voucher-card">
           <p>Ai un cod de voucher / card cadou?</p>
           <div className="cart-voucher-row">
             <input type="text" placeholder="Introduceti codul voucherului / cardului cadou" />
             <button type="button">APLICA DISCOUNTUL</button>
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
