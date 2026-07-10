import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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

  return (
    <BrowserRouter>
      <AppContent
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogout={() => {
          localStorage.clear()
          setIsLoggedIn(false)
          setIsAdmin(false)
        }}
      />
    </BrowserRouter>
  )
}
