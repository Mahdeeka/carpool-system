import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useApp();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple password check - replace with real authentication
    if (password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      showToast('Login successful!', 'success');
      navigate('/admin/create-event');
    } else {
      setError('Invalid password');
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
            />
            {error && <div className="form-error">{error}</div>}
          </div>
          
          <button type="submit" className="btn btn-primary btn-block btn-lg">
            Login
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
