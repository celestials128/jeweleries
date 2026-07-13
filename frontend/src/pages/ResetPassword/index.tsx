import React, { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'
import { Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) {
      setError('Link invalid sau expirat. Solicita un nou link de resetare.')
    } else {
      setToken(t)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Parola trebuie sa aiba cel putin 6 caractere.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Parolele nu coincid.')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      const message = err.response?.data?.error || 'Nu am putut reseta parola. Link-ul poate fi expirat.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5" style={{ maxWidth: 480 }}>
      <div style={{ padding: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#1a2332', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Resetare parola</h2>

        {success ? (
          <div>
            <p style={{ color: '#28a745', fontWeight: 500 }}>✓ Parola a fost resetata cu succes!</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>Vei fi redirectionat la pagina de autentificare...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem 1rem', borderRadius: 4, marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
                {!token && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href="/forgot-password" style={{ color: '#721c24', fontWeight: 500 }}>
                      Solicita un nou link →
                    </a>
                  </div>
                )}
              </div>
            )}

            {token && (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="new-password" style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', color: '#1a2332' }}>
                    Parola noua
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minim 6 caractere"
                    required
                    minLength={6}
                    autoFocus
                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '1rem' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="confirm-password" style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', color: '#1a2332' }}>
                    Confirma parola noua
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Reintrodu parola"
                    required
                    style={{ width: '100%', padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '1rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#1a2332',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: '1rem',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <><Spinner animation="border" size="sm" /> Se proceseaza...</>
                  ) : 'Reseteaza parola'}
                </button>
              </>
            )}

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
              <a href="/login" style={{ color: '#1a2332', fontWeight: 500, textDecoration: 'none' }}>
                ← Inapoi la autentificare
              </a>
            </p>
          </form>
        )}
      </div>
    </Container>
  )
}
