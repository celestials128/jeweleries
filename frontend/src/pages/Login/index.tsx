import React, { useState, useEffect } from 'react'
import { Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { authAPI } from '../../services/api'
import './Login.css'

type Mode = 'login' | 'register'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'register') {
      setMode('register')
    }
  }, [])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Parola trebuie sa aiba cel putin 6 caractere.')
        return
      }
      if (password !== confirmPassword) {
        setError('Parolele nu coincid.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await authAPI.register(username, password)
        toast.success('Cont creat cu succes! Te autentificam...')
        // Auto-login after registration
        const loginRes = await authAPI.login(username, password)
        localStorage.setItem('token', loginRes.data.token)
        localStorage.setItem('username', username)
        if (loginRes.data.role) {
          localStorage.setItem('role', loginRes.data.role)
        } else {
          localStorage.removeItem('role')
        }
        setTimeout(() => { window.location.href = '/' }, 400)
      } else {
        const res = await authAPI.login(username, password)
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('username', username)
        let isAdmin = false
        if (res.data.role) {
          localStorage.setItem('role', res.data.role)
          isAdmin = res.data.role === 'ROLE_ADMIN'
        } else {
          localStorage.removeItem('role')
        }
        toast.success('Autentificare reusita.')
        setTimeout(() => { window.location.href = isAdmin ? '/admin' : '/' }, 350)
      }
    } catch (err: any) {
      const message = err.response?.data?.error || (mode === 'register' ? 'Inregistrarea a esuat.' : 'Autentificarea a esuat.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✨ ASTERIA</div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Autentificare
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Cont Nou
          </button>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="auth-username">Nume utilizator</label>
            <input
              id="auth-username"
              type="text"
              placeholder="ex: maria_ioana"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Parola</label>
            <input
              id="auth-password"
              type="password"
              placeholder={mode === 'register' ? 'Minim 6 caractere' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 6 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm">Confirma parola</label>
              <input
                id="auth-confirm"
                type="password"
                placeholder="Reintrodu parola"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><Spinner animation="border" size="sm" className="me-2" />Se proceseaza...</>
            ) : mode === 'login' ? 'Autentificare' : 'Creeaza cont'}
          </button>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <a href="/forgot-password" style={{ fontSize: '0.875rem', color: '#666', textDecoration: 'none' }}>
                Ai uitat parola?
              </a>
            </div>
          )}
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'Nu ai cont?' : 'Ai deja cont?'}
          {' '}
          <button type="button" className="auth-switch-btn" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Inregistreaza-te' : 'Autentifica-te'}
          </button>
        </p>
      </div>
    </div>
  )
}
