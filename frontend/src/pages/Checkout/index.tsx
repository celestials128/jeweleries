import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { authAPI, netopiaAPI, stripeAPI, orderAPI, settingsAPI } from '../../services/api'
import './Checkout.css'

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
  country: string
  city: string
  address: string
  postalCode: string
}

const EMPTY_BILLING: BillingInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: 'RO',
  city: '',
  address: '',
  postalCode: ''
}

function CheckoutForm({ cartItems, grandTotal, discountApplied, shippingFee }: {
  cartItems: CartItem[];
  grandTotal: number;
  discountApplied: { code: string; discountAmount: number } | null;
  shippingFee: number;
}) {
  const navigate = useNavigate()
  const [billing, setBilling] = useState<BillingInfo>(EMPTY_BILLING)
  const [loading, setLoading] = useState(false)
  const [validated, setValidated] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CARD_STRIPE' | 'CARD_NETOPIA' | 'CASH_ON_DELIVERY'>('CARD_STRIPE')
  const [createAccount, setCreateAccount] = useState(false)
  const [password, setPassword] = useState('')
  const [netopiaConfigured, setNetopiaConfigured] = useState(false)
  const [stripeConfigured, setStripeConfigured] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      stripeAPI.getStatus(),
      netopiaAPI.getStatus()
    ]).then(([stripeResult, netopiaResult]) => {
      const stripeOk = stripeResult.status === 'fulfilled' && Boolean(stripeResult.value.data?.configured)
      const netopiaOk = netopiaResult.status === 'fulfilled' && Boolean(netopiaResult.value.data?.configured)
      setStripeConfigured(stripeOk)
      setNetopiaConfigured(netopiaOk)
      if (stripeOk) {
        setPaymentMethod('CARD_STRIPE')
      } else if (netopiaOk) {
        setPaymentMethod('CARD_NETOPIA')
      } else {
        setPaymentMethod('CASH_ON_DELIVERY')
      }
    })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const storedEmail = localStorage.getItem('email')
    if (storedEmail) {
      setBilling(prev => prev.email ? prev : { ...prev, email: storedEmail })
      return
    }

    authAPI.me()
      .then(res => {
        const email = res.data?.email || res.data?.username || ''
        if (email) {
          setBilling(prev => prev.email ? prev : { ...prev, email })
          if (res.data?.email) localStorage.setItem('email', res.data.email)
          if (res.data?.username) localStorage.setItem('username', res.data.username)
          window.dispatchEvent(new Event('auth:updated'))
        }
      })
      .catch(() => {})
  }, [])

  const handleBillingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setBilling(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setValidated(true)

    if (
      !billing.firstName.trim() ||
      !billing.lastName.trim() ||
      !billing.email.trim() ||
      !billing.country.trim() ||
      !billing.city.trim() ||
      !billing.address.trim()
    ) {
      toast.error('Completeaza campurile obligatorii.')
      return
    }

    if (createAccount && password.trim().length < 6) {
      toast.error('Parola trebuie sa aiba cel putin 6 caractere.')
      return
    }

    setLoading(true)
    try {
      if (createAccount) {
        await authAPI.register(billing.email, billing.email, password)
        const loginRes = await authAPI.login(billing.email, password)
        const token = loginRes.data.token
        const role = loginRes.data.role || 'ROLE_CUSTOMER'
        localStorage.setItem('token', token)
        localStorage.setItem('role', role)
        window.dispatchEvent(new Event('auth:updated'))
      }

      if (paymentMethod === 'CASH_ON_DELIVERY') {
        await orderAPI.create(
          cartItems.map(item => ({ productId: item.id, quantity: item.quantity })),
          paymentMethod,
          discountApplied?.code
        )
        localStorage.removeItem('cart')
        localStorage.removeItem('discount')
        window.dispatchEvent(new Event('cart:updated'))
        toast.success('Comanda a fost plasata. Plata se face la livrare.')
        navigate('/orders')
        return
      }

      if (paymentMethod === 'CARD_STRIPE') {
        const response = await stripeAPI.startCheckout({
          items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity })),
          successUrl: `${window.location.origin}/orders?payment=success`,
          cancelUrl: `${window.location.origin}/checkout?payment=cancelled`,
          discountCode: discountApplied?.code
        })
        localStorage.removeItem('cart')
        localStorage.removeItem('discount')
        localStorage.setItem('lastOrderId', String(response.data.orderId || ''))
        window.dispatchEvent(new Event('cart:updated'))
        toast.info('Redirectam catre plata securizata Stripe...')
        window.location.href = response.data.checkoutUrl
        return
      }

      // CARD_NETOPIA
      const response = await netopiaAPI.startCheckout({
        items: cartItems.map(item => ({ productId: item.id, quantity: item.quantity })),
        billing,
        returnUrl: `${window.location.origin}/orders`,
        discountCode: discountApplied?.code
      })

      const payload = response.data
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payload.startUrl
      form.style.display = 'none'

      const dataInput = document.createElement('input')
      dataInput.type = 'hidden'
      dataInput.name = 'data'
      dataInput.value = payload.data

      const envKeyInput = document.createElement('input')
      envKeyInput.type = 'hidden'
      envKeyInput.name = 'env_key'
      envKeyInput.value = payload.envKey

      form.appendChild(dataInput)
      form.appendChild(envKeyInput)
      document.body.appendChild(form)
      form.submit()
      toast.info('Redirectam catre plata securizata NETOPIA...')
    } catch (error: any) {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Nu am putut pregati plata.'
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <div className="co-section">
        <h5 className="co-section-title">Date de facturare</h5>
        <Row className="g-3">
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Prenume *</Form.Label>
              <Form.Control
                name="firstName"
                value={billing.firstName}
                onChange={handleBillingChange}
                required
                isInvalid={validated && !billing.firstName.trim()}
                placeholder="Ion"
              />
              <Form.Control.Feedback type="invalid">
                Prenumele este obligatoriu.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Nume *</Form.Label>
              <Form.Control
                name="lastName"
                value={billing.lastName}
                onChange={handleBillingChange}
                required
                isInvalid={validated && !billing.lastName.trim()}
                placeholder="Popescu"
              />
              <Form.Control.Feedback type="invalid">
                Numele este obligatoriu.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={billing.email}
                onChange={handleBillingChange}
                required
                isInvalid={validated && (!billing.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email))}
                placeholder="exemplu@email.com"
              />
              <Form.Control.Feedback type="invalid">
                Introdu o adresa de email valida.
              </Form.Control.Feedback>
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
              <Form.Label>Tara *</Form.Label>
              <Form.Control
                name="country"
                value={billing.country}
                onChange={handleBillingChange}
                required
                isInvalid={validated && !billing.country.trim()}
                placeholder="RO"
              />
              <Form.Control.Feedback type="invalid">
                Tara este obligatorie.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group>
              <Form.Label>Oras *</Form.Label>
              <Form.Control
                name="city"
                value={billing.city}
                onChange={handleBillingChange}
                required
                isInvalid={validated && !billing.city.trim()}
                placeholder="Bucuresti"
              />
              <Form.Control.Feedback type="invalid">
                Orasul este obligatoriu.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={8}>
            <Form.Group>
              <Form.Label>Adresa *</Form.Label>
              <Form.Control
                name="address"
                value={billing.address}
                onChange={handleBillingChange}
                required
                isInvalid={validated && !billing.address.trim()}
                placeholder="Strada, Nr."
              />
              <Form.Control.Feedback type="invalid">
                Adresa este obligatorie.
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={4}>
            <Form.Group>
              <Form.Label>Cod postal</Form.Label>
              <Form.Control name="postalCode" value={billing.postalCode} onChange={handleBillingChange} placeholder="010101" />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="co-section">
        <h5 className="co-section-title">Modalitate de plata</h5>
        <div className="co-payment-options">
          <Form.Check
            type="radio"
            id="payment-stripe"
            name="paymentMethod"
            label="Card online (Stripe)"
            checked={paymentMethod === 'CARD_STRIPE'}
            disabled={!stripeConfigured}
            onChange={() => setPaymentMethod('CARD_STRIPE')}
          />
          <Form.Check
            type="radio"
            id="payment-netopia"
            name="paymentMethod"
            label="Card online (NETOPIA)"
            checked={paymentMethod === 'CARD_NETOPIA'}
            disabled={!netopiaConfigured}
            onChange={() => setPaymentMethod('CARD_NETOPIA')}
          />
          <Form.Check
            type="radio"
            id="payment-cod"
            name="paymentMethod"
            label="Cash la livrare"
            checked={paymentMethod === 'CASH_ON_DELIVERY'}
            onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
          />
        </div>
        <div className="co-note mt-3">
          {paymentMethod === 'CARD_STRIPE'
            ? 'Vei fi redirectionat catre plata securizata Stripe.'
            : paymentMethod === 'CARD_NETOPIA'
            ? 'Vei fi redirectionat catre plata securizata NETOPIA.'
            : 'Plasezi comanda acum si platesti curierului la livrare.'
          }
        </div>
      </div>

      <div className="co-section co-account-section">
        <Form.Check
          type="checkbox"
          id="create-account"
          label="Creeaza-mi un cont"
          checked={createAccount}
          onChange={e => setCreateAccount(e.target.checked)}
        />
        {createAccount && (
          <Form.Group className="mt-3">
            <Form.Label>Parola *</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minim 6 caractere"
              isInvalid={validated && password.trim().length < 6}
            />
            <Form.Control.Feedback type="invalid">
              Parola trebuie sa aiba cel putin 6 caractere.
            </Form.Control.Feedback>
          </Form.Group>
        )}
      </div>

      <div className="co-section co-note">
        <strong>Stripe</strong> / <strong>NETOPIA</strong> deschid plata intr-o pagina securizata. Vei reveni automat dupa confirmare.
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-100 co-pay-btn" disabled={loading}>
        {loading
          ? <><Spinner animation="border" size="sm" className="me-2" />Se proceseaza...</>
          : paymentMethod === 'CASH_ON_DELIVERY'
            ? `Plaseaza comanda ${grandTotal.toFixed(2)} RON`
            : `Continua la plata ${grandTotal.toFixed(2)} RON`
        }
      </Button>
    </Form>
  )
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [discountApplied, setDiscountApplied] = useState<{ code: string; discountAmount: number } | null>(null)
  const [shippingFee, setShippingFee] = useState(20)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    const normalized: CartItem[] = (Array.isArray(raw) ? raw : []).map((item: any) => ({
      ...item,
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1)
    }))
    setCartItems(normalized)
    setSubtotal(normalized.reduce((sum, item) => sum + item.price * item.quantity, 0))

    const savedDiscount = localStorage.getItem('discount')
    if (savedDiscount) {
      try { setDiscountApplied(JSON.parse(savedDiscount)) } catch {}
    }

    settingsAPI.getPublic()
      .then(res => setShippingFee(Number(res.data.shippingFee) || 20))
      .catch(() => {})
  }, [])

  const discountAmount = discountApplied?.discountAmount ?? 0
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount)
  const shipping = totalAfterDiscount >= 200 ? 0 : shippingFee
  const grandTotal = totalAfterDiscount + shipping

  const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])

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
      <h1 className="co-title">Finalizare comanda</h1>
      <p className="co-subtitle">{itemCount} produse in cos</p>

      <Row className="g-4 mt-1 align-items-start">
        <Col lg={4}>
          <div className="co-summary">
            <h5 className="co-section-title">Rezumat comanda</h5>
            <div className="co-items">
              {cartItems.map(item => (
                <div key={item.id} className="co-item">
                  <span className="co-item-name">{item.name}</span>
                  <span className="co-item-meta">x{item.quantity} · {(item.price * item.quantity).toFixed(2)} RON</span>
                </div>
              ))}
            </div>
            <div className="co-total">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} RON</span>
              </div>
              {discountApplied && (
                <div className="co-total" style={{ color: '#16a34a' }}>
                  <span>Discount ({discountApplied.code})</span>
                  <span>-{discountAmount.toFixed(2)} RON</span>
                </div>
              )}
              <div className="co-total">
                <span>Transport</span>
                <span style={shipping === 0 ? { color: '#16a34a' } : {}}>
                  {shipping === 0 ? 'Gratuit' : `${shipping.toFixed(2)} RON`}
                </span>
              </div>
              <div className="co-total" style={{ fontWeight: 700, borderTop: '1px solid #eee', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Total</span>
                <span>{grandTotal.toFixed(2)} RON</span>
              </div>
            <div className="co-secure-badge">
              Plata securizata prin Stripe / NETOPIA
            </div>
          </div>
        </Col>

        <Col lg={8}>
          <div className="co-form-card">
            <CheckoutForm cartItems={cartItems} grandTotal={grandTotal} discountApplied={discountApplied} shippingFee={shippingFee} />
          </div>
        </Col>
      </Row>
    </Container>
  )
}
