import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL as API_URL } from '../services/api';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use server-side authentication instead of client-side password check
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminAuth', data.token || 'true');
        showToast('Login successful!', 'success');
        navigate('/admin/create-event');
      } else {
        setError(data.message || 'Invalid password');
      }
    } catch {
      // Fallback to environment variable check if API is not available
      const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD;
      if (adminPassword && password === adminPassword) {
        localStorage.setItem('adminAuth', 'true');
        showToast('Login successful!', 'success');
        navigate('/admin/create-event');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-code-page">
      <div className="event-code-card">
        <div className="event-code-logo">🔐</div>
        <h1 className="event-code-title">Admin Login</h1>
        <p className="event-code-subtitle">Enter admin password to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {error && <div className="form-error">{error}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Event Code
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
