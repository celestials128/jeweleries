import React, { useState } from 'react'
import { Container } from 'react-bootstrap'
import { Spinner } from 'react-bootstrap'
import { authAPI } from '../../services/api'

export default function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!usernameOrEmail.trim()) {
      setError('Introdu adresa de email sau numele de utilizator.')
      return
    }
    setLoading(true)
    try {
      await authAPI.forgotPassword(usernameOrEmail.trim())
      setSubmitted(true)
    } catch {
      // Always show success to avoid enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5" style={{ maxWidth: 480 }}>
      <div className="auth-card" style={{ padding: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#1a2332', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Ai uitat parola?</h2>

        {submitted ? (
          <div>
            <p style={{ color: '#28a745', fontWeight: 500 }}>✓ Daca adresa exista in sistem, vei primi un email cu instructiuni de resetare.</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>Verifica si folderul Spam daca nu gasesti emailul.</p>
            <a href="/login" style={{ color: '#1a2332', fontWeight: 500, textDecoration: 'none', display: 'inline-block', marginTop: '1.5rem' }}>
              ← Inapoi la autentificare
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Introdu adresa de email sau numele de utilizator asociat contului tau. Iti vom trimite un link de resetare a parolei.
            </p>

            {error && (
              <div style={{ background: '#fff3cd', color: '#856404', padding: '0.75rem 1rem', borderRadius: 4, marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="forgot-input" style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', color: '#1a2332' }}>
                Email sau utilizator
              </label>
              <input
                id="forgot-input"
                type="text"
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                placeholder="exemplu@email.com"
                required
                autoFocus
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
              ) : 'Trimite link de resetare'}
            </button>

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
