import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { orderAPI, stripeAPI } from '../../services/api'
import './Checkout.css'

declare global {
  interface Window {
    Stripe: any
  }
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(cart)
    const sum = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
    setTotal(sum)
  }, [])

  const handleCheckout = async () => {
    if(!localStorage.getItem('token')){
      toast.info('Te rugam sa te autentifici pentru a finaliza comanda.')
      navigate('/login')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create order
      const orderRes = await orderAPI.create(cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })))

      const orderId = orderRes.data.id

      // Create Stripe payment intent
      const intentRes = await stripeAPI.createPaymentIntent(Math.round(total * 100))
      const clientSecret = intentRes.data.clientSecret

      // Load Stripe
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.onload = () => {
        const stripe = window.Stripe('pk_test_4eC39HqLyjWDarhtT657B3h5')
        const elements = stripe.elements()
        const cardElement = elements.create('card')
        const cardContainer = document.getElementById('card-element')
        if(cardContainer) cardElement.mount(cardContainer)

        const submitButton = document.getElementById('submit-btn') as HTMLButtonElement
        if(submitButton){
          submitButton.addEventListener('click', async () => {
            const { paymentIntent, error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
              payment_method: {
                card: cardElement,
                billing_details: { name: 'Customer' }
              }
            })

            if(paymentError){
              setError(paymentError.message)
              toast.error(paymentError.message)
            } else if(paymentIntent && paymentIntent.status === 'succeeded'){
              // Update order to PAID
              await orderAPI.updateStatus(orderId, 'PAID')
              localStorage.removeItem('cart')
              window.dispatchEvent(new Event('cart:updated'))
              toast.success('Plata a fost procesata cu succes!')
              navigate('/orders')
            }
          })
        }
      }
      document.head.appendChild(script)
    } catch(err: any){
      const message = err.response?.data?.error || 'Checkout failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <h1 className="mb-5" style={{ color: '#2a2a2a', fontSize: '36px', letterSpacing: '2px' }}>
        💳 Finalizare Comanda
      </h1>
      
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      
      <Row>
        <Col lg={5}>
          <div className="p-4 border rounded" style={{ backgroundColor: 'rgba(166, 124, 82, 0.05)', borderColor: 'rgba(166, 124, 82, 0.1)' }}>
            <h4 className="mb-4">Rezumat Comanda</h4>
            {cartItems.map(item => (
              <Row key={item.id} className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(166, 124, 82, 0.1)' }}>
                <Col xs={8}>
                  <p className="mb-0 fw-600">{item.name}</p>
                  <small className="text-muted">Cantitate: {item.quantity}</small>
                </Col>
                <Col xs={4} className="text-end">
                  <p className="mb-0" style={{ color: '#a67c52', fontWeight: '700' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </Col>
              </Row>
            ))}
            <div className="mt-4 pt-3" style={{ borderTop: '2px solid #a67c52' }}>
              <Row>
                <Col xs={8}>
                  <h5 className="mb-0">Total:</h5>
                </Col>
                <Col xs={4} className="text-end">
                  <h4 style={{ color: '#a67c52', margin: '0' }}>
                    ${total.toFixed(2)}
                  </h4>
                </Col>
              </Row>
            </div>
          </div>
        </Col>

        <Col lg={7} className="ps-lg-5 mt-4 mt-lg-0">
          <div className="p-4 border rounded bg-white">
            <h4 className="mb-4">Detalii Plata</h4>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Informații Card</Form.Label>
                <div id="card-element" className="form-control" style={{ padding: '12px', minHeight: '40px' }}></div>
              </Form.Group>
              
              <Button 
                id="submit-btn"
                variant="primary"
                size="lg"
                className="w-100 mb-3"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Se proceseaza...
                  </>
                ) : (
                  '✓ Plateste Acum'
                )}
              </Button>
              
              <small className="text-muted d-block text-center">
                <strong>Card test:</strong> 4242 4242 4242 4242 | Orice data viitoare | Orice CVC
              </small>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
