import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ROUTES } from '../routes';

export default function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to={ROUTES.login} replace />;

  if (role && user.role !== role) {
    return (
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-title">Access restricted</div>
        <p style={{ fontSize: '13.5px', color: 'var(--gray-dark)', lineHeight: 1.5 }}>
          This page is only available to AgriSafe Intelligence staff.
        </p>
      </div>
    );
  }

  return children;
}
