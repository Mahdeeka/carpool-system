import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getEventStats, getDrivers, getPassengersAdmin, getMatches, sendReminders, exportData } from '../services/api';

function AdminDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = localStorage.getItem('adminAuth');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [eventId, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, driversRes, passengersRes, matchesRes] = await Promise.all([
        getEventStats(eventId),
        getDrivers(eventId),
        getPassengersAdmin(eventId),
        getMatches(eventId)
      ]);
      setStats(statsRes);
      setDrivers(driversRes.drivers || []);
      setPassengers(passengersRes.passengers || []);
      setMatches(matchesRes.matches || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      await sendReminders(eventId);
      showToast('Reminders sent successfully!', 'success');
    } catch (error) {
      showToast('Failed to send reminders', 'error');
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await exportData(eventId, type, 'csv');
      showToast(`Export initiated: ${response.download_url}`, 'success');
      window.open(response.download_url, '_blank');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <div className="header-title">Admin Dashboard</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-warning" onClick={handleSendReminders}>
              Send Reminders
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/create-event')}>
              New Event
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {stats && (
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Total Drivers</div>
              <div className="stat-value">{stats.total_drivers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Passengers</div>
              <div className="stat-value">{stats.total_passengers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Available Seats</div>
              <div className="stat-value">{stats.available_seats}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Confirmed Matches</div>
              <div className="stat-value">{stats.confirmed_matches}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Unmatched Passengers</div>
              <div className="stat-value">{stats.unmatched_passengers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Requests</div>
              <div className="stat-value">{stats.pending_requests}</div>
            </div>
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('drivers')}>Drivers ({drivers.length})</button>
          <button className={`tab ${activeTab === 'passengers' ? 'active' : ''}`}
            onClick={() => setActiveTab('passengers')}>Passengers ({passengers.length})</button>
          <button className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}>Matches ({matches.length})</button>
        </div>

        {activeTab === 'overview' && stats && (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Event Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Match Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {stats.total_passengers > 0 
                    ? Math.round((stats.confirmed_matches / stats.total_passengers) * 100) 
                    : 0}%
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Capacity Utilization</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {stats.total_seats > 0
                    ? Math.round(((stats.total_seats - stats.available_seats) / stats.total_seats) * 100)
                    : 0}%
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => handleExport('all')}>
                📥 Export All Data
              </button>
              <button className="btn btn-secondary" onClick={() => handleExport('drivers')}>
                Export Drivers
              </button>
              <button className="btn btn-secondary" onClick={() => handleExport('passengers')}>
                Export Passengers
              </button>
              <button className="btn btn-secondary" onClick={() => handleExport('matches')}>
                Export Matches
              </button>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Seats</th>
                  <th>Privacy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.offer_id}>
                    <td>{driver.name}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.email}</td>
                    <td>{driver.available_seats}/{driver.total_seats}</td>
                    <td><span className="badge badge-info">{driver.privacy}</span></td>
                    <td><span className={`badge badge-${driver.status === 'active' ? 'success' : 'secondary'}`}>
                      {driver.status}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'passengers' && (
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Trip Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map(passenger => (
                  <tr key={passenger.request_id}>
                    <td>{passenger.name}</td>
                    <td>{passenger.phone}</td>
                    <td>{passenger.email}</td>
                    <td>{passenger.trip_type}</td>
                    <td><span className={`badge badge-${passenger.matched ? 'success' : 'warning'}`}>
                      {passenger.matched ? 'Matched' : 'Unmatched'}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            {matches.map(match => (
              <div key={match.match_id} className="list-item">
                <div className="list-item-header">
                  <div>
                    <div className="list-item-title">🚗 {match.driver_name} → 👤 {match.passenger_name}</div>
                  </div>
                  <span className={`badge badge-${match.status === 'confirmed' ? 'success' : 'warning'}`}>
                    {match.status}
                  </span>
                </div>
                <div className="list-item-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <strong>Driver:</strong> {match.driver_phone}
                    </div>
                    <div>
                      <strong>Passenger:</strong> {match.passenger_phone}
                    </div>
                    <div>
                      <strong>Pickup:</strong> {match.pickup_location}
                    </div>
                    <div>
                      <strong>Time:</strong> {match.pickup_time || 'Flexible'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
