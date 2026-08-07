import React, { useEffect, useState } from 'react';
import { herds } from '../data/mockData';
import { API_BASE } from '../apiBase';

const EMPTY = { username: '', password: '', name: '', email: '', farmName: '', farmId: '' };

export default function FarmerRegisterForm() {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [claimed, setClaimed] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/farmers/claimed`)
      .then((r) => r.json())
      .then((rows) => {
        const map = {};
        rows.forEach((r) => { map[r.farmName] = r.claimed; });
        setClaimed(map);
      })
      .catch(() => {});
  }, [success]);

  const selectedHerd = herds.find((h) => h.farm === form.farmName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('Please attach a document confirming farm ownership.');
      setSubmitting(false);
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append('document', file);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        body,
      });

      let responseBody;
      try {
        responseBody = await res.json();
      } catch {
        throw new Error('The server sent back an unreadable response. Try again in a moment.');
      }
      if (!res.ok) throw new Error(responseBody.error || 'Registration failed');

      setSuccess(
        responseBody.emailSent
          ? 'Registration received. Check your email — an AgriSafe staff member will review your documentation, and you\'ll be notified once approved.'
          : 'Registration received and pending staff review. (Confirmation email could not be sent — ask an admin to check the SMTP configuration.)'
      );
      setForm(EMPTY);
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <div className="card-title">Register Your Farm</div>
      <p style={{ fontSize: '12.5px', color: 'var(--gray-dark)', lineHeight: 1.5, marginBottom: 14 }}>
        Create your account, then confirm ownership two ways: the <strong>Herd ID</strong> on your
        inspection paperwork (also shown on the Herd Records page) must match the farm you select,
        and you'll need to attach a document proving ownership — a deed, lease, government Premises
        ID letter, or a recent inspection report with your name and the farm's address. An AgriSafe
        staff member reviews every submission before your account is activated.
      </p>

      <form onSubmit={handleSubmit} className="register-form">
        <label className="register-field">
          <span>Username</span>
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="jreyes"
          />
        </label>

        <label className="register-field">
          <span>Password</span>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </label>

        <label className="register-field">
          <span>Your name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jordan Reyes"
          />
        </label>

        <label className="register-field">
          <span>Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@farm.com"
          />
        </label>

        <label className="register-field">
          <span>Farm</span>
          <select
            required
            value={form.farmName}
            onChange={(e) => setForm({ ...form, farmName: e.target.value })}
          >
            <option value="" disabled>Select your farm…</option>
            {herds.map((h) => (
              <option key={h.id} value={h.farm} disabled={claimed[h.farm]}>
                {h.farm}{claimed[h.farm] ? ' (already registered)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="register-field">
          <span>Herd ID</span>
          <input
            required
            value={form.farmId}
            onChange={(e) => setForm({ ...form, farmId: e.target.value.toUpperCase() })}
            placeholder={selectedHerd ? `e.g. ${selectedHerd.id}` : 'e.g. ON-0142'}
          />
        </label>

        <label className="register-field">
          <span>Ownership document (PDF, PNG, JPG, or WEBP)</span>
          <input
            required
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        {error && <div className="investigate-error">{error}</div>}
        {success && <div className="register-success">{success}</div>}

        <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
          {submitting ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
    </div>
  );
}
