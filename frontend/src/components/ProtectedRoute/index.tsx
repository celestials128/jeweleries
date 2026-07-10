import React from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  isAdmin: boolean
}

export default function ProtectedRoute({ children, isAdmin }: ProtectedRouteProps) {
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}
