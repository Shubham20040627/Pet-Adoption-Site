import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'admin') {
      // Central admin can inspect shelter and adopter portals
      return children;
    }
    if (user?.role === 'shelter') return <Navigate to="/shelter-dashboard" replace />;
    return <Navigate to="/adopter-dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
