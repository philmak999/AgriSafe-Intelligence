import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ROUTES } from '../routes';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate(ROUTES.dashboard);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ width: 440, maxWidth: '100%' }}>
      <div className="card-title">Sign In</div>
      <form onSubmit={handleSubmit} className="register-form">
        <label className="register-field">
          <span>Username</span>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </label>
        <label className="register-field">
          <span>Password</span>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <div className="investigate-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ fontSize: '12.5px', color: 'var(--gray)', marginTop: 16 }}>
        New farmer? <Link to={ROUTES.farmerRegister} style={{ color: 'var(--teal-dark)' }}>Register your farm</Link>
      </p>
    </div>
  );
}
