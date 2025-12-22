import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

function RoleSelection() {
  const navigate = useNavigate();
  const { eventData } = useApp();

  useEffect(() => {
    if (!eventData) {
      navigate('/');
    }
  }, [eventData, navigate]);

  const handleRoleSelect = (role) => {
    if (role === 'driver') {
      navigate('/offer-carpool');
    } else {
      navigate('/need-carpool');
    }
  };

  if (!eventData) return null;

  return (
    <div className="role-selection-page">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px', color: 'white' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>
            {eventData.eventName}
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>
            Choose your role to get started
          </p>
        </div>

        <div className="role-cards">
          <div className="role-card" onClick={() => handleRoleSelect('driver')}>
            <div className="role-icon">🚗</div>
            <h2 className="role-title">Offer Carpool</h2>
            <p className="role-description">
              I have a car and can give others a ride to the event
            </p>
          </div>

          <div className="role-card" onClick={() => handleRoleSelect('passenger')}>
            <div className="role-icon">👥</div>
            <h2 className="role-title">Need Carpool</h2>
            <p className="role-description">
              I need a ride to the event and looking for a carpool
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-outline"
            style={{ backgroundColor: 'white', borderColor: 'white' }}
          >
            ← Back to Event Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;
