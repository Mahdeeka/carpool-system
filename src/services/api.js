// API Base URL - Change this to your backend URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authAccount');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// =======================
// AUTH APIs
// =======================

// Request OTP
export const requestOTP = async (phone) => {
  return apiCall('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

// Verify OTP (login or register)
export const verifyOTP = async (phone, otp, name = null, email = null, gender = null) => {
  const body = { phone, otp };
  if (name) body.name = name;
  if (email) body.email = email;
  if (gender) body.gender = gender;
  
  return apiCall('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

// Get current user
export const getCurrentUser = async () => {
  return apiCall('/auth/me');
};

// Update account
export const updateAccount = async (data) => {
  return apiCall('/auth/account', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Logout
export const logout = async () => {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authAccount');
  }
};

// Get my offers
export const getMyOffers = async () => {
  return apiCall('/auth/my-offers');
};

// Get my requests
export const getMyRequests = async () => {
  return apiCall('/auth/my-requests');
};

// Get my joined rides (as passenger)
export const getMyJoinedRides = async () => {
  return apiCall('/auth/my-joined-rides');
};

// Event APIs
export const validateEventCode = async (eventCode) => {
  return apiCall('/validate-event-code', {
    method: 'POST',
    body: JSON.stringify({ event_code: eventCode }),
  });
};

export const createEvent = async (eventData) => {
  return apiCall('/admin/event', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const getEventStats = async (eventId) => {
  return apiCall(`/admin/event/${eventId}/stats`);
};

// Driver APIs
export const createCarpoolOffer = async (offerData) => {
  return apiCall('/carpool/offer', {
    method: 'POST',
    body: JSON.stringify(offerData),
  });
};

export const getCarpoolOffer = async (offerId) => {
  return apiCall(`/carpool/offer/${offerId}`);
};

export const updateCarpoolOffer = async (offerId, updates) => {
  return apiCall(`/carpool/offer/${offerId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteCarpoolOffer = async (offerId) => {
  return apiCall(`/carpool/offer/${offerId}`, {
    method: 'DELETE',
  });
};

export const getOfferRequests = async (offerId) => {
  return apiCall(`/carpool/offer/${offerId}/requests`);
};

export const acceptRequest = async (offerId, requestId) => {
  return apiCall(`/carpool/offer/${offerId}/accept-request`, {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId }),
  });
};

export const rejectRequest = async (offerId, requestId) => {
  return apiCall(`/carpool/offer/${offerId}/reject-request`, {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId }),
  });
};

export const getPassengers = async (eventId, filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  return apiCall(`/carpool/passengers?event_id=${eventId}&${query}`);
};

export const sendInvitation = async (offerId, requestId) => {
  return apiCall(`/carpool/offer/${offerId}/send-invitation`, {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId }),
  });
};

// Passenger APIs
export const createCarpoolRequest = async (requestData) => {
  return apiCall('/carpool/request', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

export const getCarpoolRequest = async (requestId) => {
  return apiCall(`/carpool/request/${requestId}`);
};

export const updateCarpoolRequest = async (requestId, updates) => {
  return apiCall(`/carpool/request/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteCarpoolRequest = async (requestId) => {
  return apiCall(`/carpool/request/${requestId}`, {
    method: 'DELETE',
  });
};

export const getPublicOffers = async (eventId, filters = {}) => {
  const query = new URLSearchParams({ event_id: eventId, ...filters }).toString();
  return apiCall(`/carpool/offers?${query}`);
};

export const sendJoinRequest = async (requestId, offerId) => {
  return apiCall(`/carpool/request/${requestId}/join-request`, {
    method: 'POST',
    body: JSON.stringify({ offer_id: offerId }),
  });
};

export const getInvitations = async (requestId) => {
  return apiCall(`/carpool/request/${requestId}/invitations`);
};

export const acceptInvitation = async (requestId, matchId) => {
  return apiCall(`/carpool/request/${requestId}/accept-invitation`, {
    method: 'POST',
    body: JSON.stringify({ match_id: matchId }),
  });
};

export const rejectInvitation = async (requestId, matchId) => {
  return apiCall(`/carpool/request/${requestId}/reject-invitation`, {
    method: 'POST',
    body: JSON.stringify({ match_id: matchId }),
  });
};

// Match APIs
export const getMatch = async (matchId) => {
  return apiCall(`/carpool/match/${matchId}`);
};

export const deleteMatch = async (matchId) => {
  return apiCall(`/carpool/match/${matchId}`, {
    method: 'DELETE',
  });
};

// Admin APIs
export const getDrivers = async (eventId, filters = {}, page = 1) => {
  const query = new URLSearchParams({ ...filters, page }).toString();
  return apiCall(`/admin/event/${eventId}/drivers?${query}`);
};

export const getPassengersAdmin = async (eventId, filters = {}, page = 1) => {
  const query = new URLSearchParams({ ...filters, page }).toString();
  return apiCall(`/admin/event/${eventId}/passengers?${query}`);
};

export const getMatches = async (eventId) => {
  return apiCall(`/admin/event/${eventId}/matches`);
};

export const suggestMatch = async (eventId, driverId, passengerId, message) => {
  return apiCall(`/admin/event/${eventId}/suggest-match`, {
    method: 'POST',
    body: JSON.stringify({ driver_id: driverId, passenger_id: passengerId, message }),
  });
};

export const exportData = async (eventId, type, format) => {
  const query = new URLSearchParams({ type, format }).toString();
  return apiCall(`/admin/event/${eventId}/export?${query}`);
};

export const broadcastMessage = async (eventId, recipientType, subject, message) => {
  return apiCall(`/admin/event/${eventId}/broadcast`, {
    method: 'POST',
    body: JSON.stringify({ recipient_type: recipientType, subject, message }),
  });
};

export const sendReminders = async (eventId) => {
  return apiCall(`/admin/event/${eventId}/send-reminders`, {
    method: 'POST',
  });
};

// Notification APIs
export const getNotifications = async (userId) => {
  return apiCall(`/notifications/${userId}`);
};

export const markNotificationRead = async (notificationId) => {
  return apiCall(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
};

export default {
  // Auth
  requestOTP,
  verifyOTP,
  getCurrentUser,
  updateAccount,
  logout,
  getMyOffers,
  getMyRequests,
  // Event
  validateEventCode,
  createEvent,
  getEventStats,
  // Driver
  createCarpoolOffer,
  getCarpoolOffer,
  updateCarpoolOffer,
  deleteCarpoolOffer,
  getOfferRequests,
  acceptRequest,
  rejectRequest,
  getPassengers,
  sendInvitation,
  // Passenger
  createCarpoolRequest,
  getCarpoolRequest,
  updateCarpoolRequest,
  deleteCarpoolRequest,
  getPublicOffers,
  sendJoinRequest,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
  // Match
  getMatch,
  deleteMatch,
  // Admin
  getDrivers,
  getPassengersAdmin,
  getMatches,
  suggestMatch,
  exportData,
  broadcastMessage,
  sendReminders,
  // Notifications
  getNotifications,
  markNotificationRead,
};
