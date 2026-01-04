import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

// Admin API helper
const adminApi = async (endpoint, options = {}) => {
  const adminToken = localStorage.getItem('adminToken');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
  <div className={`admin-stats-card admin-stats-${color}`}>
    <div className="admin-stats-icon">{icon}</div>
    <div className="admin-stats-content">
      <div className="admin-stats-value">{value}</div>
      <div className="admin-stats-title">{title}</div>
      {subtitle && <div className="admin-stats-subtitle">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`admin-stats-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '+' : ''}{trend}% this week
        </div>
      )}
    </div>
  </div>
);

// Activity Chart Component (simple bar chart)
const ActivityChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.users + d.events + d.offers + d.requests), 1);

  return (
    <div className="admin-chart">
      <h3 className="admin-chart-title">Activity (Last 7 Days)</h3>
      <div className="admin-chart-container">
        {data.map((day, i) => {
          const total = day.users + day.events + day.offers + day.requests;
          const height = (total / maxValue) * 100;
          return (
            <div key={i} className="admin-chart-bar-wrapper">
              <div
                className="admin-chart-bar"
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${day.date}: ${total} activities`}
              >
                <span className="admin-chart-bar-value">{total}</span>
              </div>
              <div className="admin-chart-label">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="admin-chart-legend">
        <span><span className="legend-dot users"></span> Users</span>
        <span><span className="legend-dot events"></span> Events</span>
        <span><span className="legend-dot offers"></span> Offers</span>
        <span><span className="legend-dot requests"></span> Requests</span>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ activities, loading }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered': return '👤';
      case 'event_created': return '📅';
      case 'offer_created': return '🚗';
      case 'request_created': return '🙋';
      case 'ride_confirmed': return '✅';
      case 'join_request': return '📨';
      default: return '📌';
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'user_registered':
        return `${activity.data?.name || 'Someone'} registered`;
      case 'event_created':
        return `Event "${activity.data?.event_name}" created by ${activity.data?.creator_name || 'Unknown'}`;
      case 'offer_created':
        return `${activity.data?.name || 'Driver'} offered ${activity.data?.total_seats || 0} seats for ${activity.data?.event_name || 'an event'}`;
      case 'request_created':
        return `${activity.data?.name || 'Passenger'} requested ride for ${activity.data?.event_name || 'an event'}`;
      case 'ride_confirmed':
        return `${activity.data?.name || 'Passenger'} confirmed ride`;
      case 'join_request':
        return `${activity.data?.name || 'Passenger'} sent join request`;
      default:
        return activity.type;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="admin-activity-panel">
      <h3 className="admin-panel-title">Recent Activity</h3>
      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="admin-empty">No recent activity</div>
      ) : (
        <div className="admin-activity-list">
          {activities.slice(0, 15).map((activity, i) => (
            <div key={i} className="admin-activity-item">
              <span className="admin-activity-icon">{getActivityIcon(activity.type)}</span>
              <div className="admin-activity-content">
                <div className="admin-activity-text">{getActivityText(activity)}</div>
                <div className="admin-activity-time">{formatTime(activity.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Dashboard Tab
const DashboardTab = ({ stats, activities, loading }) => {
  if (loading) {
    return <div className="admin-loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          subtitle={`+${stats?.users?.today || 0} today`}
          icon="👥"
          color="primary"
        />
        <StatsCard
          title="Active Events"
          value={stats?.events?.active || 0}
          subtitle={`${stats?.events?.upcoming || 0} upcoming`}
          icon="📅"
          color="success"
        />
        <StatsCard
          title="Driver Offers"
          value={stats?.rides?.offers?.total || 0}
          subtitle={`${stats?.rides?.offers?.active || 0} active`}
          icon="🚗"
          color="info"
        />
        <StatsCard
          title="Ride Requests"
          value={stats?.rides?.requests?.total || 0}
          subtitle={`${stats?.rides?.requests?.active || 0} active`}
          icon="🙋"
          color="warning"
        />
        <StatsCard
          title="Total Seats"
          value={stats?.rides?.totalSeats || 0}
          subtitle="Offered"
          icon="💺"
          color="secondary"
        />
        <StatsCard
          title="Confirmed Rides"
          value={stats?.joins?.confirmed || 0}
          subtitle={`of ${stats?.joins?.total || 0} requests`}
          icon="✅"
          color="success"
        />
      </div>

      {/* Charts and Activity */}
      <div className="admin-dashboard-panels">
        <ActivityChart data={stats?.activityByDay} />
        <RecentActivity activities={activities} loading={loading} />
      </div>
    </div>
  );
};

// Users Tab
const UsersTab = ({ onViewUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi(`/admin/users?page=${page}&limit=20&search=${search}`);
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleForceLogout = async (userId) => {
    if (!window.confirm('Force logout this user?')) return;
    try {
      await adminApi(`/admin/users/${userId}/sessions`, { method: 'DELETE' });
      alert('User logged out');
    } catch (error) {
      alert('Failed to logout user');
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="text"
            placeholder="Search users by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <button onClick={() => fetchUsers(1)} className="btn btn-primary">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-container"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Activity</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.account_id}>
                    <td><strong>{user.name || '-'}</strong></td>
                    <td>{user.phone || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.gender || '-'}</td>
                    <td>
                      <div className="admin-activity-badges">
                        {user.activity?.offersCount > 0 && (
                          <span className="badge badge-info">{user.activity.offersCount} offers</span>
                        )}
                        {user.activity?.requestsCount > 0 && (
                          <span className="badge badge-warning">{user.activity.requestsCount} requests</span>
                        )}
                        {user.activity?.eventsCreated > 0 && (
                          <span className="badge badge-success">{user.activity.eventsCreated} events</span>
                        )}
                      </div>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-actions">
                        <button onClick={() => onViewUser(user)} className="btn btn-sm btn-secondary">View</button>
                        <button onClick={() => handleForceLogout(user.account_id)} className="btn btn-sm btn-danger">Logout</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Events Tab
const EventsTab = ({ onViewEvent }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchEvents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi(`/admin/events?page=${page}&limit=20&search=${search}&status=${status}`);
      setEvents(data.events || []);
      setPagination(data.pagination || { page: 1, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await adminApi(`/admin/events/${eventId}`, { method: 'DELETE' });
      fetchEvents(pagination.page);
    } catch (error) {
      alert('Failed to delete event');
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="deleted">Deleted</option>
          </select>
          <button onClick={() => fetchEvents(1)} className="btn btn-primary">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-container"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Code</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Creator</th>
                  <th>Stats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.event_id}>
                    <td><strong>{event.event_name}</strong></td>
                    <td><code>{event.event_code}</code></td>
                    <td>{event.event_date} {event.event_time}</td>
                    <td className="admin-cell-truncate">{event.event_location}</td>
                    <td>{event.creator_name}</td>
                    <td>
                      <div className="admin-event-stats">
                        <span title="Offers">{event.stats?.activeOffers || 0} offers</span>
                        <span title="Requests">{event.stats?.activeRequests || 0} requests</span>
                        <span title="Seats">{event.stats?.totalSeats || 0} seats</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${event.status === 'active' ? 'success' : 'secondary'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button onClick={() => onViewEvent(event)} className="btn btn-sm btn-secondary">View</button>
                        <button onClick={() => window.open(`/event/${event.event_code}`, '_blank')} className="btn btn-sm btn-info">Open</button>
                        {event.status !== 'deleted' && (
                          <button onClick={() => handleDeleteEvent(event.event_id)} className="btn btn-sm btn-danger">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => fetchEvents(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => fetchEvents(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Rides Tab (Offers + Requests + Matches)
const RidesTab = () => {
  const [subTab, setSubTab] = useState('offers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const endpoint = subTab === 'matches'
        ? `/admin/matches?page=${page}&limit=20&status=${status}`
        : `/admin/${subTab}?page=${page}&limit=20&search=${search}&status=${status}`;
      const result = await adminApi(endpoint);
      setData(result[subTab] || result.matches || []);
      setPagination(result.pagination || { page: 1, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [subTab, search, status]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  return (
    <div className="admin-tab-content">
      <div className="admin-sub-tabs">
        <button
          className={`admin-sub-tab ${subTab === 'offers' ? 'active' : ''}`}
          onClick={() => setSubTab('offers')}
        >
          Offers
        </button>
        <button
          className={`admin-sub-tab ${subTab === 'requests' ? 'active' : ''}`}
          onClick={() => setSubTab('requests')}
        >
          Requests
        </button>
        <button
          className={`admin-sub-tab ${subTab === 'matches' ? 'active' : ''}`}
          onClick={() => setSubTab('matches')}
        >
          Matches
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          {subTab !== 'matches' && (
            <input
              type="text"
              placeholder={`Search ${subTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          )}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => fetchData(1)} className="btn btn-primary">Search</button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-container"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="admin-table-container">
            {subTab === 'offers' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Phone</th>
                    <th>Event</th>
                    <th>Seats</th>
                    <th>Trip</th>
                    <th>Passengers</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((offer) => (
                    <tr key={offer.offer_id}>
                      <td><strong>{offer.name || offer.owner_name || '-'}</strong></td>
                      <td>{offer.phone || offer.owner_phone || '-'}</td>
                      <td>
                        <a href={`/event/${offer.event_code}`} target="_blank" rel="noreferrer">
                          {offer.event_name}
                        </a>
                      </td>
                      <td>{offer.available_seats}/{offer.total_seats}</td>
                      <td>{offer.trip_type}</td>
                      <td>
                        <span className="badge badge-success">{offer.confirmedPassengers || 0} confirmed</span>
                        {offer.pendingRequests > 0 && (
                          <span className="badge badge-warning">{offer.pendingRequests} pending</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${offer.status === 'active' ? 'success' : 'secondary'}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td>{new Date(offer.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {subTab === 'requests' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Passenger</th>
                    <th>Phone</th>
                    <th>Event</th>
                    <th>Passengers</th>
                    <th>Trip</th>
                    <th>Preference</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((request) => (
                    <tr key={request.request_id}>
                      <td><strong>{request.name || request.owner_name || '-'}</strong></td>
                      <td>{request.phone || request.owner_phone || '-'}</td>
                      <td>
                        <a href={`/event/${request.event_code}`} target="_blank" rel="noreferrer">
                          {request.event_name}
                        </a>
                      </td>
                      <td>{request.passenger_count || 1}</td>
                      <td>{request.trip_type}</td>
                      <td>{request.preference || 'Any'}</td>
                      <td>
                        <span className={`badge badge-${request.status === 'active' ? 'success' : 'secondary'}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {subTab === 'matches' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Driver</th>
                    <th>Passenger</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((match, i) => (
                    <tr key={match.id || match.match_id || i}>
                      <td>
                        <a href={`/event/${match.event_code}`} target="_blank" rel="noreferrer">
                          {match.event_name || '-'}
                        </a>
                      </td>
                      <td>{match.driver_name || '-'}</td>
                      <td>{match.passenger_name || match.name || '-'}</td>
                      <td>{match.type}</td>
                      <td>
                        <span className={`badge badge-${match.status === 'confirmed' ? 'success' : match.status === 'pending' ? 'warning' : 'secondary'}`}>
                          {match.status}
                        </span>
                      </td>
                      <td>{new Date(match.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => fetchData(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => fetchData(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Analytics Tab
const AnalyticsTab = ({ stats }) => {
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async (type) => {
    setExportLoading(true);
    try {
      const data = await adminApi(`/admin/export?type=${type}`);
      // Download as JSON
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trempi-export-${type}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-analytics">
        <div className="admin-analytics-section">
          <h3>Overview Statistics</h3>
          <div className="admin-analytics-grid">
            <div className="admin-analytics-card">
              <div className="analytics-label">Total Users</div>
              <div className="analytics-value">{stats?.users?.total || 0}</div>
              <div className="analytics-detail">
                <span>Today: {stats?.users?.today || 0}</span>
                <span>This Week: {stats?.users?.thisWeek || 0}</span>
                <span>This Month: {stats?.users?.thisMonth || 0}</span>
              </div>
            </div>
            <div className="admin-analytics-card">
              <div className="analytics-label">Events</div>
              <div className="analytics-value">{stats?.events?.total || 0}</div>
              <div className="analytics-detail">
                <span>Active: {stats?.events?.active || 0}</span>
                <span>Upcoming: {stats?.events?.upcoming || 0}</span>
              </div>
            </div>
            <div className="admin-analytics-card">
              <div className="analytics-label">Ride Capacity</div>
              <div className="analytics-value">{stats?.rides?.totalSeats || 0} seats</div>
              <div className="analytics-detail">
                <span>Offers: {stats?.rides?.offers?.total || 0}</span>
                <span>Passengers: {stats?.rides?.totalPassengers || 0}</span>
              </div>
            </div>
            <div className="admin-analytics-card">
              <div className="analytics-label">Match Rate</div>
              <div className="analytics-value">
                {stats?.joins?.total > 0
                  ? Math.round((stats?.joins?.confirmed / stats?.joins?.total) * 100)
                  : 0}%
              </div>
              <div className="analytics-detail">
                <span>Confirmed: {stats?.joins?.confirmed || 0}</span>
                <span>Total Requests: {stats?.joins?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-analytics-section">
          <h3>Export Data</h3>
          <div className="admin-export-buttons">
            <button onClick={() => handleExport('all')} disabled={exportLoading} className="btn btn-primary">
              {exportLoading ? 'Exporting...' : 'Export All Data'}
            </button>
            <button onClick={() => handleExport('users')} disabled={exportLoading} className="btn btn-secondary">
              Export Users
            </button>
            <button onClick={() => handleExport('events')} disabled={exportLoading} className="btn btn-secondary">
              Export Events
            </button>
            <button onClick={() => handleExport('offers')} disabled={exportLoading} className="btn btn-secondary">
              Export Offers
            </button>
            <button onClick={() => handleExport('requests')} disabled={exportLoading} className="btn btn-secondary">
              Export Requests
            </button>
          </div>
        </div>

        <div className="admin-analytics-section">
          <h3>Activity Chart</h3>
          <ActivityChart data={stats?.activityByDay} />
        </div>
      </div>
    </div>
  );
};

// User Detail Modal
const UserDetailModal = ({ user, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await adminApi(`/admin/users/${user.account_id}`);
        setDetails(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [user.account_id]);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>User Details</h2>
          <button onClick={onClose} className="admin-modal-close">&times;</button>
        </div>
        <div className="admin-modal-body">
          {loading ? (
            <div className="admin-loading-container"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="admin-user-info">
                <div className="admin-info-row">
                  <label>Name:</label>
                  <span>{details?.user?.name || '-'}</span>
                </div>
                <div className="admin-info-row">
                  <label>Phone:</label>
                  <span>{details?.user?.phone || '-'}</span>
                </div>
                <div className="admin-info-row">
                  <label>Email:</label>
                  <span>{details?.user?.email || '-'}</span>
                </div>
                <div className="admin-info-row">
                  <label>Gender:</label>
                  <span>{details?.user?.gender || '-'}</span>
                </div>
                <div className="admin-info-row">
                  <label>Registered:</label>
                  <span>{new Date(details?.user?.created_at).toLocaleString()}</span>
                </div>
                <div className="admin-info-row">
                  <label>Active Sessions:</label>
                  <span>{details?.activity?.activeSessions || 0}</span>
                </div>
              </div>

              <h4>Activity Summary</h4>
              <div className="admin-activity-summary">
                <div className="activity-stat">
                  <span className="activity-stat-value">{details?.activity?.offers?.length || 0}</span>
                  <span className="activity-stat-label">Offers Created</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-value">{details?.activity?.requests?.length || 0}</span>
                  <span className="activity-stat-label">Requests Made</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-value">{details?.activity?.eventsCreated?.length || 0}</span>
                  <span className="activity-stat-label">Events Created</span>
                </div>
                <div className="activity-stat">
                  <span className="activity-stat-value">{details?.activity?.joins?.length || 0}</span>
                  <span className="activity-stat-label">Rides Joined</span>
                </div>
              </div>

              {details?.activity?.eventsCreated?.length > 0 && (
                <>
                  <h4>Events Created</h4>
                  <ul className="admin-detail-list">
                    {details.activity.eventsCreated.map((event) => (
                      <li key={event.event_id}>
                        <a href={`/event/${event.event_code}`} target="_blank" rel="noreferrer">
                          {event.event_name}
                        </a>
                        <span className={`badge badge-${event.status === 'active' ? 'success' : 'secondary'}`}>
                          {event.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Event Detail Modal
const EventDetailModal = ({ event, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await adminApi(`/admin/events/${event.event_id}`);
        setDetails(data);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [event.event_id]);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Event Details</h2>
          <button onClick={onClose} className="admin-modal-close">&times;</button>
        </div>
        <div className="admin-modal-body">
          {loading ? (
            <div className="admin-loading-container"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="admin-event-header">
                <h3>{details?.event?.event_name}</h3>
                <code>{details?.event?.event_code}</code>
              </div>

              <div className="admin-info-grid">
                <div className="admin-info-row">
                  <label>Date/Time:</label>
                  <span>{details?.event?.event_date} {details?.event?.event_time}</span>
                </div>
                <div className="admin-info-row">
                  <label>Location:</label>
                  <span>{details?.event?.event_location}</span>
                </div>
                <div className="admin-info-row">
                  <label>Creator:</label>
                  <span>{details?.event?.creator_name} ({details?.event?.creator_phone})</span>
                </div>
                <div className="admin-info-row">
                  <label>Status:</label>
                  <span className={`badge badge-${details?.event?.status === 'active' ? 'success' : 'secondary'}`}>
                    {details?.event?.status}
                  </span>
                </div>
                <div className="admin-info-row">
                  <label>Private:</label>
                  <span>{details?.event?.is_private ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <h4>Statistics</h4>
              <div className="admin-stats-mini-grid">
                <div className="admin-stat-mini">
                  <span className="stat-value">{details?.stats?.activeOffers || 0}</span>
                  <span className="stat-label">Active Offers</span>
                </div>
                <div className="admin-stat-mini">
                  <span className="stat-value">{details?.stats?.activeRequests || 0}</span>
                  <span className="stat-label">Active Requests</span>
                </div>
                <div className="admin-stat-mini">
                  <span className="stat-value">{details?.stats?.totalSeats || 0}</span>
                  <span className="stat-label">Total Seats</span>
                </div>
                <div className="admin-stat-mini">
                  <span className="stat-value">{details?.stats?.totalPassengers || 0}</span>
                  <span className="stat-label">Passengers</span>
                </div>
              </div>

              {details?.offers?.length > 0 && (
                <>
                  <h4>Offers ({details.offers.length})</h4>
                  <div className="admin-mini-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Driver</th>
                          <th>Seats</th>
                          <th>Passengers</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.offers.slice(0, 10).map((offer) => (
                          <tr key={offer.offer_id}>
                            <td>{offer.name || offer.owner_name}</td>
                            <td>{offer.available_seats}/{offer.total_seats}</td>
                            <td>{offer.join_requests?.filter(j => j.status === 'confirmed').length || 0}</td>
                            <td>{offer.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {details?.requests?.length > 0 && (
                <>
                  <h4>Requests ({details.requests.length})</h4>
                  <div className="admin-mini-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Passenger</th>
                          <th>Count</th>
                          <th>Trip</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.requests.slice(0, 10).map((request) => (
                          <tr key={request.request_id}>
                            <td>{request.name || request.owner_name}</td>
                            <td>{request.passenger_count || 1}</td>
                            <td>{request.trip_type}</td>
                            <td>{request.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Admin Panel Component
function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Check authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAuthenticated(true);
      // Load initial data
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  // Parse tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        adminApi('/admin/dashboard/stats'),
        adminApi('/admin/activity?limit=20')
      ]);
      setStats(statsData.stats);
      setActivities(activityData.activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.message.includes('Unauthorized')) {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        fetchDashboardData();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setStats(null);
    setActivities([]);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin?tab=${tab}`);
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-logo">TREMPI</div>
          <h1>Admin Panel</h1>
          <p>Enter admin password to access the dashboard</p>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">TREMPI</div>
          <div className="admin-logo-sub">Admin Panel</div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <span className="nav-icon">👥</span>
            Users
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => handleTabChange('events')}
          >
            <span className="nav-icon">📅</span>
            Events
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'rides' ? 'active' : ''}`}
            onClick={() => handleTabChange('rides')}
          >
            <span className="nav-icon">🚗</span>
            Rides
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            <span className="nav-icon">📈</span>
            Analytics
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" className="admin-nav-item">
            <span className="nav-icon">🏠</span>
            Back to Site
          </a>
          <button onClick={handleLogout} className="admin-nav-item admin-logout">
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'events' && 'Event Management'}
            {activeTab === 'rides' && 'Ride Management'}
            {activeTab === 'analytics' && 'Analytics & Reports'}
          </h1>
          <div className="admin-header-actions">
            <button onClick={fetchDashboardData} className="btn btn-secondary">
              Refresh
            </button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <DashboardTab stats={stats} activities={activities} loading={loading} />
          )}
          {activeTab === 'users' && (
            <UsersTab onViewUser={(user) => setSelectedUser(user)} />
          )}
          {activeTab === 'events' && (
            <EventsTab onViewEvent={(event) => setSelectedEvent(event)} />
          )}
          {activeTab === 'rides' && (
            <RidesTab />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab stats={stats} />
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

// Login Form Component
function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await onLogin(password);
    if (!success) {
      setError('Invalid password');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-login-form">
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
      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default AdminPanel;
