import React, { useState } from 'react'
import { Container, Row, Col, Form, Button, Alert, Card, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { authAPI } from '../../services/api'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = isRegister 
        ? await authAPI.register(username, password)
        : await authAPI.login(username, password)

      localStorage.setItem('token', res.data.token)
      localStorage.setItem('username', username)
      
      // Store admin role if returned by backend
      let isAdmin = false
      if (res.data.role) {
        localStorage.setItem('role', res.data.role)
        isAdmin = res.data.role === 'ROLE_ADMIN'
      } else if (username === 'admin') {
        localStorage.setItem('role', 'ROLE_ADMIN')
        isAdmin = true
      } else {
        localStorage.removeItem('role')
      }

      toast.success(isRegister ? 'Cont creat cu succes.' : 'Autentificare reusita.')

      // Redirect to admin dashboard if admin, otherwise home
      setTimeout(() => {
        window.location.href = isAdmin ? '/admin' : '/'
      }, 350)
    } catch(err: any){
      const message = err.response?.data?.error || (isRegister ? 'Registration failed' : 'Login failed')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5 d-flex align-items-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-5">
              <h1 className="text-center mb-4" style={{ color: '#2a2a2a', fontSize: '32px', letterSpacing: '1px' }}>
                ✨ {isRegister ? 'Inregistrare' : 'Autentificare'}
              </h1>
              
              {error && (
                <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nume Utilizator</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Introdu numele de utilizator"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Parola</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Introdu parola"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Se proceseaza...
                    </>
                  ) : (
                    isRegister ? 'Inregistrare' : 'Autentificare'
                  )}
                </Button>
              </Form>

              <div className="text-center mb-4">
                <p className="mb-0">
                  {isRegister ? 'Ai deja cont?' : 'Nu ai cont?'}
                  {' '}
                  <Button 
                    variant="link"
                    onClick={() => setIsRegister(!isRegister)}
                    className="p-0"
                    style={{ color: '#a67c52', textDecoration: 'none' }}
                  >
                    {isRegister ? 'Autentificare' : 'Inregistrare'}
                  </Button>
                </p>
              </div>

              <Card className="border-0 mt-4" style={{ backgroundColor: 'rgba(166, 124, 82, 0.05)' }}>
                <Card.Body>
                  <p className="mb-2" style={{ fontSize: '12px', color: '#666' }}>
                    <strong>Acces Demo:</strong>
                  </p>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>
                    Utilizator: <code>admin</code><br />
                    Parola: <code>admin</code>
                  </p>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
