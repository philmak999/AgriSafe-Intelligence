import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

export default function NotFound() {
  return (
    <div className="card" style={{ maxWidth: 480, margin: '48px auto' }}>
      <div className="card-title">Page not found</div>
      <p style={{ fontSize: '13.5px', color: 'var(--gray-dark)', lineHeight: 1.5 }}>
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to={ROUTES.dashboard} className="btn btn-primary" style={{ marginTop: 12, display: 'inline-block' }}>
        Back to dashboard
      </Link>
    </div>
  );
}
