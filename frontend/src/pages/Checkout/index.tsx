import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap'
import {
  Elements,
  CardNumberElement, CardExpiryElement, CardCvcElement,
  useStripe, useElements
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { toast } from 'react-toastify'
import { orderAPI, stripeAPI, authAPI } from '../../services/api'
import './Checkout.css'

const stripePromise = loadStripe(
  (import.meta as any).env?.VITE_STRIPE_PK || 'pk_test_4eC39HqLyjWDarhtT657B3h5'
)

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface BillingInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
}

const EMPTY_BILLING: BillingInfo = {
  firstName: '', lastName: '', email: '', phone: '', address: '', city: ''
}

const stripeStyle = {
  base: {
    fontSize: '16px',
    color: '#1a2332',
    fontFamily: '"Lato", sans-serif',
    fontSmoothing: 'antialiased',
    '::placeholder': { color: '#94a3b8' }
  },
  invalid: { color: '#dc2626' }
}

/* ── Inner form (needs stripe/elements context) ── */
function CheckoutForm({ cartItems, total }: { cartItems: CartItem[]; total: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [billing, setBilling] = useState<BillingInfo>(EMPTY_BILLING)
  const [createAccount, setCreateAccount] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBilling(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    const cardElement = elements.getElement(CardNumberElement)
    if (!cardElement) return

    // Validate password upfront if account creation requested
    if (createAccount && (!password || password.length < 6)) {
      toast.error('Parola trebuie sa aiba cel putin 6 caractere.')
      return
    }

    setLoading(true)

    try {
      // 1. Create Stripe payment intent
      const intentRes = await stripeAPI.createPaymentIntent(Math.round(total * 100))
      const clientSecret = intentRes.data.clientSecret

      // 2. Confirm card payment
      const { paymentIntent, error: stripeErr } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${billing.firstName} ${billing.lastName}`.trim(),
            email: billing.email,
            phone: billing.phone || undefined,
            address: {
              line1: billing.address,
              city: billing.city
            }
          }
        }
      })

      if (stripeErr) {
        toast.error(stripeErr.message || 'Eroare la procesarea platii.')
        setLoading(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. Payment succeeded — now optionally create account
        if (createAccount) {
          try {
            await authAPI.register(billing.email, password)
            const loginRes = await authAPI.login(billing.email, password)
            const { token, role } = loginRes.data
            localStorage.setItem('token', token)
            localStorage.setItem('role', role || '')
            window.dispatchEvent(new Event('auth:updated'))
            toast.success('Cont creat cu succes!')
          } catch (regErr: any) {
            // Account creation failed after payment — warn but don't block
            const msg = regErr.response?.data?.message || regErr.response?.data?.error || 'Contul nu a putut fi creat, dar plata a fost procesata.'
            toast.warn(msg)
          }
        }

        // 4. Create order record if authenticated
        if (localStorage.getItem('token')) {
          try {
            const orderRes = await orderAPI.create(
              cartItems.map(item => ({ productId: item.id, quantity: item.quantity }))
            )
            if (orderRes.data?.id) {
              await orderAPI.updateStatus(orderRes.data.id, 'PAID')
            }
          } catch {
            // Payment succeeded but order record failed — not blocking
          }
        }

        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('cart:updated'))
        toast.success('Plata efectuata cu succes! Multumim!')
        navigate(localStorage.getItem('token') ? '/orders' : '/')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'A aparut o eroare.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {/* Billing */}
      <div className="co-section">
        <h5 className="co-section-title">📋 Informatii Facturare</h5>
        <Row className="g-3">
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Prenume *</Form.Label>
              <Form.Control name="firstName" value={billing.firstName} onChange={handleBillingChange} required placeholder="Ion" />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Nume *</Form.Label>
              <Form.Control name="lastName" value={billing.lastName} onChange={handleBillingChange} required placeholder="Popescu" />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Email *</Form.Label>
              <Form.Control type="email" name="email" value={billing.email} onChange={handleBillingChange} required placeholder="exemplu@email.com" />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Telefon</Form.Label>
              <Form.Control name="phone" value={billing.phone} onChange={handleBillingChange} placeholder="+40 700 000 000" />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Adresa *</Form.Label>
              <Form.Control name="address" value={billing.address} onChange={handleBillingChange} required placeholder="Strada, Nr." />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Oras *</Form.Label>
              <Form.Control name="city" value={billing.city} onChange={handleBillingChange} required placeholder="Bucuresti" />
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Optional account creation */}
      <div className="co-section co-account-section">
        <Form.Check
          type="checkbox"
          id="create-account"
          label="Doresc sa-mi creez un cont Celestials"
          checked={createAccount}
          onChange={e => setCreateAccount(e.target.checked)}
          className="co-account-check"
        />
        {createAccount && (
          <Form.Group className="mt-3">
            <Form.Label>Parola *</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minim 6 caractere"
              minLength={6}
            />
            <Form.Text className="text-muted">
              Contul va fi creat cu adresa de email de mai sus.
            </Form.Text>
          </Form.Group>
        )}
      </div>

      {/* Card payment */}
      <div className="co-section">
        <h5 className="co-section-title">💳 Detalii Card</h5>

        {/* Split Stripe inputs */}
        <div className="co-card-fields">
          <Form.Group>
            <Form.Label>Numar card</Form.Label>
            <div className="co-stripe-field">
              <CardNumberElement
                options={{
                  showIcon: false,
                  style: stripeStyle
                }}
              />
            </div>
          </Form.Group>

          <Row className="g-3 mt-0">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Data expirare</Form.Label>
                <div className="co-stripe-field">
                  <CardExpiryElement options={{ style: stripeStyle }} />
                </div>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label>CVC</Form.Label>
                <div className="co-stripe-field co-cvc-field">
                  <CardCvcElement options={{ style: stripeStyle }} />
                  <span className="co-cvc-icon">🔒</span>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="co-test-card">
          <strong>Card test:</strong> 4242 4242 4242 4242 &nbsp;·&nbsp; 12/34 &nbsp;·&nbsp; 123
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-100 co-pay-btn"
        disabled={loading || !stripe}
      >
        {loading
          ? <><Spinner animation="border" size="sm" className="me-2" />Se proceseaza...</>
          : `🔒 Plateste $${total.toFixed(2)}`
        }
      </Button>
    </Form>
  )
}

/* ── Page wrapper ── */
export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    const normalized: CartItem[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
      ...item,
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1)
    }))
    setCartItems(normalized)
    setTotal(normalized.reduce((sum, item) => sum + item.price * item.quantity, 0))
  }, [])

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h2 style={{ color: '#1a2332' }}>Cosul tau este gol</h2>
        <p className="text-muted mb-4">Adauga produse din colectia noastra.</p>
        <Button variant="primary" onClick={() => navigate('/products')}>
          Descopera produsele
        </Button>
      </Container>
    )
  }

  return (
    <Container className="py-5 co-container">
      <h1 className="co-title">Finalizare Comanda</h1>

      <Row className="g-4 mt-1 align-items-start">
        {/* Summary sidebar */}
        <Col lg={4}>
          <div className="co-summary">
            <h5 className="co-section-title">🛒 Rezumat</h5>
            <div className="co-items">
              {cartItems.map(item => (
                <div key={item.id} className="co-item">
                  <span className="co-item-name">{item.name}</span>
                  <span className="co-item-meta">x{item.quantity} · ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="co-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="co-secure-badge">
              🔒 Plata securizata prin Stripe
            </div>
          </div>
        </Col>

        {/* Form */}
        <Col lg={8}>
          <div className="co-form-card">
            <Elements stripe={stripePromise}>
              <CheckoutForm cartItems={cartItems} total={total} />
            </Elements>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
