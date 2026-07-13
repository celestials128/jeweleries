import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import { ToastContainer, Slide } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar/index'
import ProtectedRoute from './components/ProtectedRoute/index'
import Home from './pages/Home/index'
import Products from './pages/Products/index'
import Cart from './pages/Cart/index'
import Checkout from './pages/Checkout/index'
import OrderHistory from './pages/OrderHistory/index'
import AdminDashboard from './pages/AdminDashboard/index'
import Login from './pages/Login/index'
import AdminBlog from './pages/AdminBlog/index'
import BlogDetail from './pages/BlogDetail/index'
import ProductDetail from './pages/ProductDetail/index'
import ForgotPassword from './pages/ForgotPassword/index'
import ResetPassword from './pages/ResetPassword/index'
import { authAPI } from './services/api'
import './App.css'

function AppContent({
  isLoggedIn,
  isAdmin,
  onLogout
}: {
  isLoggedIn: boolean
  isAdmin: boolean
  onLogout: () => void
}) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Admin users are restricted to /admin and /admin/* only
  if (isAdmin) {
    return (
      <>
        <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
        <ToastContainer
          position="top-right"
          autoClose={1000}
          newestOnTop={false}
          pauseOnFocusLoss={false}
          pauseOnHover
          closeOnClick={false}
          draggable={false}
          transition={Slide}
          theme="colored"
        />
        <main key={location.pathname} className="page-content">
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={onLogout} />
      <ToastContainer
        position="top-right"
        autoClose={1000}
        newestOnTop={false}
        pauseOnFocusLoss={false}
        pauseOnHover
        closeOnClick={false}
        draggable={false}
        transition={Slide}
        theme="colored"
      />
      <main key={location.pathname} className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute isAdmin={isAdmin}>
                <AdminBlog />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  )
}

export default function App(){
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('role') === 'ROLE_ADMIN')

  // On mount: verify role from server so stale sessions are always correct
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    authAPI.me()
      .then(res => {
        const role = res.data?.role || ''
        localStorage.setItem('role', role)
        setIsLoggedIn(true)
        setIsAdmin(role === 'ROLE_ADMIN')
      })
      .catch(() => {
        // Token invalid or expired — clear session
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('username')
        setIsLoggedIn(false)
        setIsAdmin(false)
      })
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setIsAdmin(false)
  }

  return (
    <BrowserRouter>
      <AppContent
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  )
}
