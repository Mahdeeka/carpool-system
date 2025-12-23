import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { requestOTP, verifyOTP, API_BASE_URL as API_URL } from '../services/api';
import './EventDashboard.css';

// Lazy load heavy components for faster initial render
const MapLocationPicker = lazy(() => import('../components/MapLocationPicker'));
const RouteMap = lazy(() => import('../components/RouteMap'));
const RoutePicker = lazy(() => import('../components/RoutePicker'));
const RouteWithDetour = lazy(() => import('../components/RouteWithDetour'));

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
);

// localStorage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'carpool_user_profile',
  MY_OFFERS: 'carpool_my_offers',
  MY_REQUESTS: 'carpool_my_requests',
};

function EventDashboard() {
  const { eventCode } = useParams();
  const navigate = useNavigate();
  const { showToast, authData, isAuthenticated } = useApp();
  
  const [event, setEvent] = useState(null);
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offers');
  const [showModal, setShowModal] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [rememberMe, setRememberMe] = useState(true);
  const [joinPickupLocation, setJoinPickupLocation] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [showPassengersModal, setShowPassengersModal] = useState(null);
  const [cancelMessage, setCancelMessage] = useState('');

  // Auth state for non-logged in users
  const [authStep, setAuthStep] = useState('form'); // 'form', 'otp'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Track user's own posts
  const [myOfferIds, setMyOfferIds] = useState([]);
  const [myRequestIds, setMyRequestIds] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    seats: '3',
    description: '',
    tripType: 'both',
    pickupLocation: '',
    pickupLat: null,
    pickupLng: null,
    sameReturnLocation: true,
    returnLocation: '',
    returnLat: null,
    returnLng: null,
    preference: 'any', // 'any', 'male', 'female'
    gender: '', // 'male', 'female' - user's own gender
    hideName: false, // Hide name from other users
    hidePhone: false, // Hide phone from other users
    hideEmail: false, // Hide email from other users
    paymentRequired: 'not_required', // 'obligatory', 'optional', 'not_required'
    paymentAmount: '', // Price in currency
    paymentMethod: '', // 'bit', 'paybox', 'cash'
    passengerCount: 1, // Number of passengers requesting to join
  });
  
  // Route info for calculating payment
  const [routeDistance, setRouteDistance] = useState(null);
  const [maxPayment, setMaxPayment] = useState(0);
  
  // Pending publish data for after OTP verification
  const [pendingPublishType, setPendingPublishType] = useState(null);

  // Load user profile from authData (logged in user) or localStorage
  useEffect(() => {
    // Priority: authData (logged in) > localStorage
    if (isAuthenticated && authData) {
      setFormData(prev => ({
        ...prev,
        name: authData.name || prev.name,
        phone: authData.phone || prev.phone,
        email: authData.email || prev.email,
        gender: authData.gender || prev.gender,
      }));
    }

    const savedOffers = localStorage.getItem(STORAGE_KEYS.MY_OFFERS);
    if (savedOffers) {
      setMyOfferIds(JSON.parse(savedOffers));
    }

    const savedRequests = localStorage.getItem(STORAGE_KEYS.MY_REQUESTS);
    if (savedRequests) {
      setMyRequestIds(JSON.parse(savedRequests));
    }
  }, [isAuthenticated, authData]);

  // Save user profile to localStorage
  const saveUserProfile = (data) => {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({
        name: data.name,
        phone: data.phone,
        email: data.email,
      }));
    }
  };

  // Track my offer
  const addMyOffer = (offerId) => {
    const updated = [...myOfferIds, offerId];
    setMyOfferIds(updated);
    localStorage.setItem(STORAGE_KEYS.MY_OFFERS, JSON.stringify(updated));
  };

  // Track my request
  const addMyRequest = (requestId) => {
    const updated = [...myRequestIds, requestId];
    setMyRequestIds(updated);
    localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(updated));
  };

  // Remove my offer
  const removeMyOffer = (offerId) => {
    const updated = myOfferIds.filter(id => id !== offerId);
    setMyOfferIds(updated);
    localStorage.setItem(STORAGE_KEYS.MY_OFFERS, JSON.stringify(updated));
  };

  // Remove my request
  const removeMyRequest = (requestId) => {
    const updated = myRequestIds.filter(id => id !== requestId);
    setMyRequestIds(updated);
    localStorage.setItem(STORAGE_KEYS.MY_REQUESTS, JSON.stringify(updated));
  };

  const fetchEvent = useCallback(async (code = null) => {
    try {
      const url = code 
        ? `${API_URL}/event/${eventCode}?access_code=${encodeURIComponent(code)}`
        : `${API_URL}/event/${eventCode}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setError('Event not found');
        setLoading(false);
        return null;
      }
      
      if (data.needs_code) {
        setNeedsCode(true);
        setEvent({ event_name: data.event_name, event_id: data.event_id });
        setLoading(false);
        return null;
      }
      
      setEvent(data);
      setNeedsCode(false);
      return data;
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event');
      setLoading(false);
      return null;
    }
  }, [eventCode]);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/event/${eventCode}/offers`);
      const data = await response.json();
      setOffers(data.offers || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  }, [eventCode]);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/event/${eventCode}/requests`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  }, [eventCode]);

  // Fetch rides where user is a passenger (confirmed join requests for this event)
  const fetchMyJoinedRides = useCallback(async () => {
    if (!isAuthenticated || !event?.event_id) {
      setMyJoinedRides([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMyJoinedRides([]);
        return;
      }
      
      const response = await fetch(`${API_URL}/auth/my-joined-rides`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter to only show confirmed rides for this event
        const eventRides = (data.rides || []).filter(ride => 
          ride.event_id === event.event_id && ride.status === 'confirmed'
        );
        console.log('My confirmed joined rides for this event:', eventRides);
        setMyJoinedRides(eventRides);
      } else {
        setMyJoinedRides([]);
      }
    } catch (err) {
      console.error('Error fetching my joined rides:', err);
      setMyJoinedRides([]);
    }
  }, [isAuthenticated, event?.event_id]);

  const fetchJoinRequests = async (offerId) => {
    try {
      const response = await fetch(`${API_URL}/carpool/offer/${offerId}/join-requests`);
      const data = await response.json();
      console.log('Join requests data received:', data.requests);
      console.log('First request details:', data.requests?.[0]);
      if (data.requests && data.requests.length > 0) {
        data.requests.forEach((req, index) => {
          console.log(`Request ${index}:`, {
            name: req.name,
            pickup_location: req.pickup_location,
            pickup_lat: req.pickup_lat,
            pickup_lng: req.pickup_lng,
            hasPickupLocation: !!(req.pickup_location && req.pickup_lat && req.pickup_lng)
          });
        });
      }
      setJoinRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setJoinRequests([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const eventData = await fetchEvent();
      if (eventData) {
        await Promise.all([fetchOffers(), fetchRequests()]);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchEvent, fetchOffers, fetchRequests]);

  // Fetch my joined rides when event and auth status are available
  useEffect(() => {
    if (event?.event_id && isAuthenticated !== undefined) {
      fetchMyJoinedRides();
    }
  }, [event?.event_id, isAuthenticated, fetchMyJoinedRides]);

  // Auto-register user as event participant when they access an event
  useEffect(() => {
    const registerEventParticipation = async () => {
      if (!isAuthenticated || !event?.event_id) return;
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        await fetch(`${API_URL}/event/${event.event_id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('User registered as event participant');
      } catch (err) {
        console.error('Failed to register event participation:', err);
      }
    };
    
    registerEventParticipation();
  }, [isAuthenticated, event?.event_id]);

  // Auto-copy pickup to return
  useEffect(() => {
    if (formData.sameReturnLocation) {
      setFormData(prev => ({ 
        ...prev, 
        returnLocation: prev.pickupLocation,
        returnLat: prev.pickupLat,
        returnLng: prev.pickupLng
      }));
    }
  }, [formData.pickupLocation, formData.pickupLat, formData.pickupLng, formData.sameReturnLocation]);

  // Clean up pac-containers when modal closes
  useEffect(() => {
    if (!showModal) {
      // Hide any open Google Places dropdowns
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        try {
          container.style.display = 'none';
        } catch (e) {}
      });
    }
  }, [showModal]);

  const handleAccessCodeSubmit = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter the access code');
      return;
    }
    setLoading(true);
    setError('');
    const eventData = await fetchEvent(accessCode.trim());
    if (eventData) {
      await Promise.all([fetchOffers(), fetchRequests()]);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle route calculation result
  const handleRouteCalculated = useCallback((routeInfo) => {
    if (routeInfo && routeInfo.distance) {
      // Extract numeric value from distance string (e.g., "15.2 ק"מ" -> 15.2)
      const distanceMatch = routeInfo.distance.match(/[\d.]+/);
      if (distanceMatch) {
        const distanceKm = parseFloat(distanceMatch[0]);
        setRouteDistance(distanceKm);
        const calculatedMax = Math.round(0.5 * distanceKm * 100) / 100;
        setMaxPayment(calculatedMax);
        
        // Auto-fill payment amount if payment is required
        setFormData(prev => {
          if (prev.paymentRequired !== 'not_required' && (!prev.paymentAmount || prev.paymentAmount === '')) {
            return { ...prev, paymentAmount: calculatedMax.toFixed(2) };
          }
          return prev;
        });
      }
    }
  }, []);

  const resetForm = () => {
    // Use authData for logged-in users, empty for non-logged in
    const userData = isAuthenticated && authData ? authData : {};
    
    setFormData({
      name: userData.name || '',
      phone: userData.phone || '',
      email: userData.email || '',
      seats: '3',
      description: '',
      tripType: 'both',
      pickupLocation: '',
      pickupLat: null,
      pickupLng: null,
      sameReturnLocation: true,
      returnLocation: '',
      returnLat: null,
      returnLng: null,
      preference: 'any',
      gender: userData.gender || '',
      hideName: false,
      hidePhone: false,
      hideEmail: false,
      paymentRequired: 'not_required',
      paymentAmount: '',
      paymentMethod: '',
      passengerCount: 1,
    });
    setEditingItem(null);
    setAuthStep('form');
    setOtp(['', '', '', '', '', '']);
    setPendingPublishType(null);
    setRouteDistance(null);
    setMaxPayment(0);
    
    // Clean up Google Places autocomplete dropdowns
    setTimeout(() => {
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        try {
          container.style.display = 'none';
        } catch (e) {}
      });
    }, 100);
  };

  // Validate form data before publishing
  const validateForm = (type) => {
    if (!formData.name || !formData.phone || !formData.email || !formData.pickupLocation) {
      showToast('Please fill in all required fields', 'error');
      return false;
    }

    if (!formData.gender) {
      showToast('Please select your gender', 'error');
      return false;
    }

    // Validate payment amount and method if payment is required
    if (type === 'offer' && (formData.paymentRequired === 'optional' || formData.paymentRequired === 'obligatory')) {
      if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
        showToast('Please enter a valid payment amount', 'error');
        return false;
      }
      
      if (!formData.paymentMethod) {
        showToast('Please select a payment method', 'error');
        return false;
      }
      
      // Validate max payment using stored maxPayment or calculate
      const currentMax = maxPayment > 0 ? maxPayment : (() => {
        if (formData.pickupLat && formData.pickupLng && event?.event_lat && event?.event_lng) {
          const R = 6371;
          const dLat = (event.event_lat - formData.pickupLat) * Math.PI / 180;
          const dLon = (event.event_lng - formData.pickupLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(formData.pickupLat * Math.PI / 180) * Math.cos(event.event_lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return 0.5 * R * c;
        }
        return 0;
      })();
      
      if (currentMax > 0 && parseFloat(formData.paymentAmount) > currentMax) {
        showToast(`Payment amount cannot exceed ₪${currentMax.toFixed(2)}`, 'error');
        return false;
      }
    }
    return true;
  };

  // Execute the actual publish after validation/auth
  const executePublish = async (type, authToken = null) => {
    setSubmitting(true);
    saveUserProfile(formData);

    const locations = [];
    const returnLoc = formData.sameReturnLocation ? formData.pickupLocation : formData.returnLocation;
    
    if (formData.tripType === 'going' || formData.tripType === 'both') {
      locations.push({
        location_address: formData.pickupLocation,
        lat: formData.pickupLat,
        lng: formData.pickupLng,
        trip_direction: 'going',
        time_type: 'flexible',
        specific_time: null,
      });
    }
    
    if (formData.tripType === 'return' || formData.tripType === 'both') {
      locations.push({
        location_address: returnLoc,
        lat: formData.sameReturnLocation ? formData.pickupLat : formData.returnLat,
        lng: formData.sameReturnLocation ? formData.pickupLng : formData.returnLng,
        trip_direction: 'return',
        time_type: 'flexible',
        specific_time: null,
      });
    }

    try {
      const isEditing = editingItem !== null;
      const endpoint = type === 'offer' 
        ? (isEditing ? `${API_URL}/carpool/offer/${editingItem.offer_id}` : `${API_URL}/carpool/offer`)
        : (isEditing ? `${API_URL}/carpool/request/${editingItem.request_id}` : `${API_URL}/carpool/request`);
      
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const body = type === 'offer' ? {
        event_id: event.event_id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        hide_name: formData.hideName,
        hide_phone: formData.hidePhone,
        hide_email: formData.hideEmail,
        total_seats: parseInt(formData.seats),
        description: formData.description,
        trip_type: formData.tripType,
        privacy: 'public',
        preference: formData.preference,
        payment_required: formData.paymentRequired,
        payment_amount: formData.paymentRequired !== 'not_required' ? parseFloat(formData.paymentAmount) : null,
        payment_method: formData.paymentRequired !== 'not_required' ? formData.paymentMethod : null,
        locations,
      } : {
        event_id: event.event_id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        hide_name: formData.hideName,
        hide_phone: formData.hidePhone,
        hide_email: formData.hideEmail,
        trip_type: formData.tripType,
        preference: formData.preference,
        passenger_count: formData.passengerCount || 1,
        locations,
      };

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (response.ok) {
        if (!isEditing) {
          if (type === 'offer') {
            addMyOffer(responseData.offer_id);
          } else {
            addMyRequest(responseData.request_id);
          }
        }
        showToast(isEditing ? 'Updated successfully!' : (type === 'offer' ? 'Ride offer published!' : 'Ride request published!'), 'success');
        setShowModal(null);
        resetForm();
        await Promise.all([fetchOffers(), fetchRequests()]);
      } else {
        showToast(responseData.message || 'Failed to publish', 'error');
      }
    } catch (err) {
      console.error('Error publishing:', err);
      const errorMessage = err.message?.includes('timed out')
        ? 'Request timed out. Please check your connection and try again.'
        : 'Error publishing. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle OTP verification for non-logged-in users
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyOTP(formData.phone, otpCode, formData.name, formData.email);
      if (result.success) {
        showToast('Account created successfully!', 'success');
        // Now publish with the new auth token
        await executePublish(pendingPublishType, result.token);
      } else {
        showToast(result.message || 'Invalid code. Please try again.', 'error');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMessage = err.message?.includes('timed out')
        ? 'Request timed out. Please check your connection and try again.'
        : 'Verification failed. Please try again.';
      showToast(errorMessage, 'error');
      setSubmitting(false);
    }
    // Note: setSubmitting(false) is called in executePublish's finally block on success
  };

  // Resend OTP code
  const handleResendOTP = async () => {
    try {
      const result = await requestOTP(formData.phone);
      if (result.success) {
        showToast('New code sent!', 'success');
        setOtpCountdown(60);
      } else {
        showToast(result.message || 'Failed to send code', 'error');
      }
    } catch (err) {
      const errorMessage = err.message?.includes('timed out')
        ? 'Request timed out. Please try again.'
        : 'Failed to send code. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      // Focus last filled or next empty
      const nextIndex = Math.min(index + digits.length, 5);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handlePublish = async (type) => {
    if (!validateForm(type)) return;

    // If user is authenticated, publish directly
    if (isAuthenticated) {
      const token = localStorage.getItem('authToken');
      await executePublish(type, token);
      return;
    }

    // For non-authenticated users, start OTP flow
    setSubmitting(true);
    setPendingPublishType(type);

    try {
      const result = await requestOTP(formData.phone);
      if (result.success) {
        setAuthStep('otp');
        setOtpCountdown(60);
        showToast('Verification code sent to your phone!', 'success');
      } else {
        showToast(result.message || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      console.error('Error requesting OTP:', err);
      const errorMessage = err.message?.includes('timed out')
        ? 'Request timed out. Please check your connection and try again.'
        : 'Failed to send verification code. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type, item) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      const endpoint = type === 'offer' 
        ? `${API_URL}/carpool/offer/${item.offer_id}`
        : `${API_URL}/carpool/request/${item.request_id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        if (type === 'offer') {
          removeMyOffer(item.offer_id);
        } else {
          removeMyRequest(item.request_id);
        }
        showToast('Deleted successfully!', 'success');
        await Promise.all([fetchOffers(), fetchRequests()]);
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      showToast('Error deleting. Please try again.', 'error');
    }
  };

  const handleEdit = (type, item) => {
    const location = item.locations?.[0];
    
    setFormData({
      name: item.name || item.driver_name || authData?.name || '',
      phone: item.phone || item.driver_phone || authData?.phone || '',
      email: item.email || item.driver_email || authData?.email || '',
      seats: String(item.total_seats || 3),
      description: item.description || '',
      tripType: item.trip_type || 'both',
      pickupLocation: location?.location_address || '',
      pickupLat: location?.lat || null,
      pickupLng: location?.lng || null,
      sameReturnLocation: true,
      returnLocation: '',
      returnLat: null,
      returnLng: null,
      preference: item.preference || 'any',
      gender: item.gender || authData?.gender || '',
      hideName: item.hide_name || false,
      hidePhone: item.hide_phone || false,
      hideEmail: item.hide_email || false,
      paymentRequired: item.payment_required || 'not_required',
      paymentAmount: item.payment_amount ? String(item.payment_amount) : '',
      paymentMethod: item.payment_method || '',
      passengerCount: item.passenger_count || 1,
    });
    setEditingItem(item);
    setAuthStep('form');
    setShowModal(type === 'offer' ? 'edit-offer' : 'edit-request');
  };

  // Open join modal for a specific offer
  const handleOpenJoinModal = (offer) => {
    setSelectedOffer(offer);
    setJoinPickupLocation(null); // Reset pickup location
    // Pre-fill with authData for logged-in users
    if (isAuthenticated && authData) {
      setFormData(prev => ({
        ...prev,
        name: authData.name || '',
        phone: authData.phone || '',
        email: authData.email || '',
        gender: authData.gender || prev.gender,
      }));
    }
    setShowModal('join-ride');
  };

  // Submit join request
  const handleSubmitJoinRequest = async () => {
    console.log('=== SUBMIT JOIN REQUEST START ===');
    console.log('formData:', formData);
    console.log('joinPickupLocation:', joinPickupLocation);
    
    if (!formData.name || !formData.phone || !formData.email) {
      showToast('Please fill in your contact details', 'error');
      return;
    }

    // More detailed validation with logging
    if (!joinPickupLocation) {
      console.error('joinPickupLocation is null or undefined');
      showToast('Please select a pickup location on the route', 'error');
      return;
    }
    
    if (joinPickupLocation.lat == null || joinPickupLocation.lng == null) {
      console.error('joinPickupLocation coordinates are null:', {
        lat: joinPickupLocation.lat,
        lng: joinPickupLocation.lng
      });
      showToast('Please select a valid pickup location with coordinates', 'error');
      return;
    }

    setSubmitting(true);
    saveUserProfile(formData);

    try {
      const requestBody = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        pickup_location: joinPickupLocation.address || '',
        pickup_lat: Number(joinPickupLocation.lat),
        pickup_lng: Number(joinPickupLocation.lng),
        message: joinMessage || '',
      };
      
      console.log('=== REQUEST BODY ===');
      console.log('pickup_location:', requestBody.pickup_location);
      console.log('pickup_lat:', requestBody.pickup_lat, '(type:', typeof requestBody.pickup_lat, ')');
      console.log('pickup_lng:', requestBody.pickup_lng, '(type:', typeof requestBody.pickup_lng, ')');
      console.log('message:', requestBody.message);
      console.log('Full requestBody:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_URL}/carpool/offer/${selectedOffer.offer_id}/request-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (response.ok) {
        showToast('Request sent! The driver will be notified.', 'success');
        setShowModal(null);
        setJoinPickupLocation(null);
        setJoinMessage('');
        await fetchOffers();
        // Refresh my joined rides after sending request
        if (isAuthenticated) {
          await fetchMyJoinedRides();
        }
      } else {
        showToast(responseData.message || 'Failed to send request', 'error');
      }
    } catch (err) {
      console.error('Error requesting to join:', err);
      const errorMessage = err.message?.includes('timed out')
        ? 'Request timed out. Please check your connection and try again.'
        : 'Error sending request. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewJoinRequests = async (offer) => {
    setSelectedOffer(offer);
    await fetchJoinRequests(offer.offer_id);
    setShowModal('join-requests');
  };

  const handleAcceptJoinRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/carpool/offer/${selectedOffer.offer_id}/accept-join/${requestId}`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Passenger confirmed!', 'success');
        await fetchJoinRequests(selectedOffer.offer_id);
        await fetchOffers();
        // Refresh my joined rides in case this was my request
        if (isAuthenticated) {
          await fetchMyJoinedRides();
        }
      } else {
        showToast('Failed to accept request', 'error');
      }
    } catch (err) {
      console.error('Error accepting:', err);
      showToast('Error accepting request', 'error');
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/carpool/offer/${selectedOffer.offer_id}/reject-join/${requestId}`, {
        method: 'POST',
      });

      if (response.ok) {
        showToast('Request declined', 'success');
        await fetchJoinRequests(selectedOffer.offer_id);
      } else {
        showToast('Failed to decline request', 'error');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      showToast('Error declining request', 'error');
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const isMyOffer = (offer) => myOfferIds.includes(offer.offer_id);
  const isMyRequest = (request) => myRequestIds.includes(request.request_id);

  const getSeatsDisplay = (offer) => {
    const total = offer.total_seats || 0;
    const confirmed = offer.confirmed_passengers?.length || 0;
    const available = total - confirmed;
    return { total, confirmed, available };
  };

  const getPreferenceLabel = (pref) => {
    switch (pref) {
      case 'male': return { icon: '♂️', text: 'Males preferred' };
      case 'female': return { icon: '♀️', text: 'Females preferred' };
      default: return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-loading-overlay">
        <div className="simple-car-loader">
          <div className="simple-car">
            <div className="simple-car-body"></div>
            <div className="simple-car-top"></div>
            <div className="simple-car-window"></div>
            <div className="simple-car-light-front"></div>
            <div className="simple-car-light-back"></div>
            <div className="simple-car-wheel simple-car-wheel-front"></div>
            <div className="simple-car-wheel simple-car-wheel-back"></div>
            <div className="speed-lines">
              <div className="speed-line"></div>
              <div className="speed-line"></div>
              <div className="speed-line"></div>
            </div>
            <div className="exhaust">
              <div className="exhaust-puff"></div>
              <div className="exhaust-puff"></div>
              <div className="exhaust-puff"></div>
            </div>
          </div>
          <div className="simple-road"></div>
        </div>
        <p className="loading-text">Loading event...</p>
      </div>
    );
  }

  // Error state
  if (error && !needsCode && !event) {
    return (
      <div className="event-dashboard-page">
        <div className="error-container">
          <div className="error-icon">😕</div>
          <h2>Event Not Found</h2>
          <p>This event doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Private event needs code
  if (needsCode) {
    return (
      <div className="event-code-page">
        <div className="event-code-card">
          <div className="event-code-logo">🔒</div>
          <h1 className="event-code-title">Private Event</h1>
          <p className="event-code-subtitle">
            <strong>{event?.event_name}</strong><br />
            Enter the access code to view this event
          </p>
          <form onSubmit={handleAccessCodeSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                autoFocus
              />
              {error && <div className="form-error">{error}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Checking...' : 'Unlock Event'}
            </button>
          </form>
          <div className="back-link">
            <a href="/">← Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="event-dashboard">
      {/* Top Navigation Bar - Legendary Style */}
      <nav className="legendary-top-nav">
        <button onClick={() => navigate('/')} className="nav-back-btn">
          ← Home
        </button>

        <div className="nav-actions">
          <button onClick={() => navigate('/my-rides')} className="nav-btn-rides">
            🚗 My Rides
          </button>

          {isAuthenticated ? (
            <button onClick={() => navigate('/my-account')} className="nav-btn-account">
              <span className="nav-avatar">
                {authData?.name?.charAt(0)?.toUpperCase()}
              </span>
              {authData?.name?.split(' ')[0]}
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="nav-btn-login">
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Legendary Header */}
      <header className="legendary-header">
        <div className="header-content">
          <div className="event-info">
            <h1>{event?.event_name}</h1>
            <div className="event-meta">
              {event?.event_date && (
                <span>📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}</span>
              )}
              {event?.event_time && <span>🕐 {event.event_time}</span>}
              {event?.event_location && <span>📍 {event.event_location}</span>}
              {event?.participant_count > 0 && (
                <span className="participant-badge">
                  👥 {event.participant_count} joined
                </span>
              )}
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate(`/event/${eventCode}/publish?mode=offer`)} className="legendary-btn legendary-btn-primary">
              🚗 Offer a Ride
            </button>
            <button onClick={() => navigate(`/event/${eventCode}/publish?mode=request`)} className="legendary-btn legendary-btn-outline">
              🙋 Need a Ride
            </button>
          </div>
        </div>
      </header>

      {/* Legendary Tabs */}
      <div className="legendary-tabs">
        <button
          className={`legendary-tab ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          🚗 Rides Available <span className="tab-count">{offers.length}</span>
        </button>
        <button
          className={`legendary-tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          🙋 Rides Needed <span className="tab-count">{requests.length}</span>
        </button>
      </div>

      {/* My Confirmed Rides Section - Legendary */}
      {myJoinedRides.length > 0 && (
        <section className="confirmed-rides-section">
          <h2 className="confirmed-rides-title">
            ✅ My Confirmed Rides ({myJoinedRides.length})
          </h2>
          <div>
            {myJoinedRides.map((ride, idx) => (
              <div key={ride.join_request_id || idx} className="confirmed-ride-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
                      🚗 Riding with <strong>{ride.driverName}</strong>
                    </h3>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      <p style={{ margin: '4px 0' }}>📱 {ride.driverPhone}</p>
                      {ride.pickupLocation && (
                        <p style={{ margin: '4px 0' }}>📍 Pickup: {ride.pickupLocation}</p>
                      )}
                      {ride.eventLocation && (
                        <p style={{ margin: '4px 0' }}>🎯 Destination: {ride.eventLocation}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`tel:${ride.driverPhone}`} className="legendary-action-btn success" style={{ padding: '10px 16px' }}>
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${ride.driverPhone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="legendary-action-btn whatsapp"
                      style={{ padding: '10px 16px' }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                {ride.offerLocations?.[0]?.location_address && ride.eventLocation && ride.pickupLocation && ride.pickupLat && ride.pickupLng && (
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <div style={{ marginTop: '12px' }}>
                      <RouteWithDetour
                        origin={ride.offerLocations[0].location_address}
                        destination={ride.eventLocation}
                        pickupLocation={{
                          address: ride.pickupLocation,
                          lat: ride.pickupLat,
                          lng: ride.pickupLng
                        }}
                        height="200px"
                        showDetourInfo={true}
                      />
                    </div>
                  </Suspense>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Legendary Content */}
      <div className="legendary-content">
        {activeTab === 'offers' && (
          <div className="legendary-cards-grid">
            {offers.length === 0 ? (
              <div className="legendary-empty-state">
                <span className="legendary-empty-icon">🚗</span>
                <h3>No rides offered yet</h3>
                <p>Be the first to offer a ride to this event!</p>
                <button onClick={() => navigate(`/event/${eventCode}/publish?mode=offer`)} className="legendary-btn legendary-btn-primary">
                  Offer a Ride
                </button>
              </div>
            ) : (
              offers.map((offer, index) => {
                const seats = getSeatsDisplay(offer);
                const isMine = isMyOffer(offer);
                const isFull = seats.available <= 0;
                const pref = getPreferenceLabel(offer.preference);

                return (
                  <div key={offer.offer_id || index} className={`legendary-card offer-card ${isMine ? 'my-card' : ''} ${isFull ? 'full-card' : ''}`}>
                    {isMine && <div className="legendary-badge my-badge">My Offer</div>}
                    {isFull && !isMine && <div className="legendary-badge full-badge">Full</div>}

                    <div className="legendary-card-header">
                      <div className="legendary-driver-info">
                        <div className="legendary-avatar driver">🚗</div>
                        <div className="legendary-driver-details">
                          <h3>{offer.driver_name || offer.name || 'Driver'}</h3>
                          <div className="legendary-meta-badges">
                            <span className={`legendary-seats-badge ${isFull ? 'full' : ''}`}>
                              {seats.confirmed}/{seats.total} seats
                            </span>
                            {pref && (
                              <span className={`legendary-pref-badge ${offer.preference}`}>
                                {pref.icon} {pref.text}
                              </span>
                            )}
                            {(offer.hide_name || offer.hide_phone) && (
                              <span className="legendary-privacy-badge">
                                🔒 {offer.hide_name && offer.hide_phone ? 'Private' : offer.hide_name ? 'Name hidden' : 'Phone hidden'}
                              </span>
                            )}
                            {offer.payment_required === 'obligatory' && offer.payment_amount && (
                              <span className="legendary-payment-badge obligatory">
                                💰 ₪{offer.payment_amount} Required
                              </span>
                            )}
                            {offer.payment_required === 'optional' && offer.payment_amount && (
                              <span className="legendary-payment-badge optional">
                                💰 ₪{offer.payment_amount} Optional
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {offer.locations && offer.locations.length > 0 && (
                      <div className="legendary-locations">
                        {offer.locations.map((loc, i) => (
                          <div key={i} className="legendary-location-item">
                            <span className={`legendary-direction-badge ${loc.trip_direction}`}>
                              {loc.trip_direction === 'going' ? '→ Going' : '← Return'}
                            </span>
                            <span>{loc.location_address}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {offer.description && (
                      <p className="legendary-description">{offer.description}</p>
                    )}

                    {offer.confirmed_passengers && offer.confirmed_passengers.length > 0 && (
                      <div className="legendary-passengers">
                        <div className="legendary-passengers-header">
                          <span className="legendary-passengers-label">✅ Confirmed ({offer.confirmed_passengers.length})</span>
                          {isMine && (
                            <button onClick={() => setShowPassengersModal(offer)} className="legendary-manage-btn">
                              ⚙️ Manage
                            </button>
                          )}
                        </div>
                        {offer.confirmed_passengers.map((p, i) => (
                          <div key={i} className="legendary-passenger-item">
                            👤 {p.name} {isMine && <span className="legendary-passenger-phone">({p.phone})</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="legendary-actions">
                      {isMine ? (
                        <>
                          <button onClick={() => handleViewJoinRequests(offer)} className="legendary-action-btn primary">
                            📋 Requests {offer.pending_requests > 0 && <span className="request-count">{offer.pending_requests}</span>}
                          </button>
                          <button onClick={() => handleEdit('offer', offer)} className="legendary-action-btn secondary">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete('offer', offer)} className="legendary-action-btn ghost">
                            🗑️
                          </button>
                        </>
                      ) : (
                        <>
                          {!isFull && (
                            <button onClick={() => handleOpenJoinModal(offer)} className="legendary-action-btn success">
                              🙋 Request to Join
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${formatPhone(offer.driver_phone || offer.phone)}?text=Hi! I saw your carpool offer for ${event?.event_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legendary-action-btn whatsapp"
                          >
                            💬 WhatsApp
                          </a>
                          <a href={`tel:${offer.driver_phone || offer.phone}`} className="legendary-action-btn secondary">
                            📞
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="legendary-cards-grid">
            {requests.length === 0 ? (
              <div className="legendary-empty-state">
                <span className="legendary-empty-icon">🙋</span>
                <h3>No ride requests yet</h3>
                <p>Looking for a ride? Post a request!</p>
                <button onClick={() => navigate(`/event/${eventCode}/publish?mode=request`)} className="legendary-btn legendary-btn-primary">
                  Request a Ride
                </button>
              </div>
            ) : (
              requests.map((request, index) => {
                const isMine = isMyRequest(request);
                const hasMatch = request.matched_offer;
                const pref = getPreferenceLabel(request.preference);

                return (
                  <div key={request.request_id || index} className={`legendary-card request-card ${isMine ? 'my-card' : ''} ${hasMatch ? 'matched-card' : ''}`}>
                    {isMine && <div className="legendary-badge my-badge">My Request</div>}
                    {hasMatch && <div className="legendary-badge matched-badge">✅ Matched</div>}

                    <div className="legendary-card-header">
                      <div className="legendary-driver-info">
                        <div className="legendary-avatar passenger">🙋</div>
                        <div className="legendary-driver-details">
                          <h3>{request.name || 'Passenger'}</h3>
                          <div className="legendary-meta-badges">
                            <span className="legendary-seats-badge">
                              {request.trip_type === 'both' ? '🔄 Round trip' : request.trip_type === 'going' ? '→ Going' : '← Return'}
                            </span>
                            {pref && (
                              <span className={`legendary-pref-badge ${request.preference}`}>
                                {pref.icon} {pref.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.locations && request.locations.length > 0 && (
                      <div className="legendary-locations">
                        {request.locations.map((loc, i) => (
                          <div key={i} className="legendary-location-item">
                            <span className={`legendary-direction-badge ${loc.trip_direction}`}>
                              {loc.trip_direction === 'going' ? '→ Going' : '← Return'}
                            </span>
                            <span>{loc.location_address}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {hasMatch && (
                      <div className="legendary-match-info">
                        <div className="legendary-match-label">🚗 Riding with</div>
                        <div className="legendary-match-driver">{request.matched_offer.driver_name}</div>
                        {isMine && (
                          <a
                            href={`https://wa.me/${formatPhone(request.matched_offer.driver_phone)}?text=Hi! I'm confirmed for your carpool to ${event?.event_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legendary-action-btn whatsapp"
                            style={{ marginTop: '12px', display: 'inline-flex' }}
                          >
                            💬 Contact Driver
                          </a>
                        )}
                      </div>
                    )}

                    <div className="legendary-actions">
                      {isMine ? (
                        <>
                          <button onClick={() => handleEdit('request', request)} className="legendary-action-btn secondary">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete('request', request)} className="legendary-action-btn ghost">
                            🗑️
                          </button>
                        </>
                      ) : (
                        <>
                          <a
                            href={`https://wa.me/${formatPhone(request.phone)}?text=Hi! I can give you a ride to ${event?.event_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legendary-action-btn whatsapp"
                          >
                            💬 WhatsApp
                          </a>
                          <a href={`tel:${request.phone}`} className="legendary-action-btn secondary">
                            📞
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Publish/Edit Modal - Legendary */}
      {(showModal === 'offer' || showModal === 'request' || showModal === 'edit-offer' || showModal === 'edit-request') && (
        <div className="legendary-modal-overlay" onClick={() => !submitting && setShowModal(null)}>
          <div className="legendary-modal" onClick={e => e.stopPropagation()}>
            <div className="legendary-modal-handle" />
            <div className="legendary-modal-header">
              <h2>
                {showModal === 'edit-offer' ? '✏️ Edit Ride Offer' :
                 showModal === 'edit-request' ? '✏️ Edit Ride Request' :
                 showModal === 'offer' ? '🚗 Offer a Ride' : '🙋 Need a Ride'}
              </h2>
              <button className="legendary-modal-close" onClick={() => !submitting && setShowModal(null)}>×</button>
            </div>
            
            <div className="legendary-modal-body">
              {/* OTP Verification Step */}
              {authStep === 'otp' ? (
                <div className="otp-container">
                  <div className="otp-header">
                    <div className="otp-header-icon">📱</div>
                    <h3>Verify Your Phone</h3>
                    <p>We sent a 6-digit code to <strong>{formData.phone}</strong></p>
                  </div>

                  <div className="otp-inputs">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`otp-digit ${digit ? 'filled' : ''}`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="otp-resend">
                    {otpCountdown > 0 ? (
                      <span>Resend code in {otpCountdown}s</span>
                    ) : (
                      <button className="otp-resend-btn" onClick={handleResendOTP}>
                        Resend Code
                      </button>
                    )}
                  </div>

                  <div className="otp-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => { setAuthStep('form'); setOtp(['', '', '', '', '', '']); }}
                      disabled={submitting}
                    >
                      ← Back
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleVerifyOTP}
                      disabled={submitting || otp.join('').length !== 6}
                    >
                      {submitting ? 'Verifying...' : 'Verify & Publish'}
                    </button>
                  </div>

                  <p className="otp-note">An account will be created for you automatically</p>
                </div>
              ) : (
                <>
                  {/* Logged in notice */}
                  {isAuthenticated && (
                    <div className="info-banner success">
                      <span className="info-banner-icon">✅</span>
                      <span>Logged in - Your info is pre-filled</span>
                    </div>
                  )}

                  {/* SECTION 1: Personal Info - Compact */}
<div className="form-section">
  <div className="form-section-header">
    <span className="form-section-icon">👤</span>
    <h4 className="form-section-title">Your Details</h4>
  </div>

  <div className="form-group">
    <div className="form-field-header">
      <label className="form-label">Name</label>
      <label className="inline-toggle">
        <input type="checkbox" name="hideName" checked={formData.hideName} onChange={handleInputChange} />
        <span>Hide</span>
      </label>
    </div>
    <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} placeholder="Your name" />
  </div>

  <div className="form-row">
    <div className="form-group">
      <div className="form-field-header">
        <label className="form-label">Phone</label>
        <label className="inline-toggle">
          <input type="checkbox" name="hidePhone" checked={formData.hidePhone} onChange={handleInputChange} />
          <span>Hide</span>
        </label>
      </div>
      <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} placeholder="+972..." />
    </div>
    <div className="form-group">
      <div className="form-field-header">
        <label className="form-label">Email</label>
        <label className="inline-toggle">
          <input type="checkbox" name="hideEmail" checked={formData.hideEmail} onChange={handleInputChange} />
          <span>Hide</span>
        </label>
      </div>
      <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} placeholder="email@..." />
    </div>
  </div>

  {/* Compact Gender Pills */}
  <div className="form-group">
    <label className="form-label">Gender</label>
    <div className="pill-toggle-group">
      <label className={`pill-toggle gender-male ${formData.gender === 'male' ? 'selected' : ''}`}>
        <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} />
        <span className="pill-icon">♂️</span>
        <span>Male</span>
      </label>
      <label className={`pill-toggle gender-female ${formData.gender === 'female' ? 'selected' : ''}`}>
        <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} />
        <span className="pill-icon">♀️</span>
        <span>Female</span>
      </label>
    </div>
  </div>

  {(formData.hideName || formData.hidePhone || formData.hideEmail) && (
    <div className="info-banner warning">
      <span className="info-banner-icon">🔒</span>
      <span>Hidden info shared after confirmation</span>
    </div>
  )}
</div>

{/* SECTION 3: Location - Compact */}
<div className="form-section">
  <div className="form-section-header">
    <span className="form-section-icon">📍</span>
    <h4 className="form-section-title">Pickup Location</h4>
  </div>

  <div className="form-group">
    <Suspense fallback={<input type="text" className="form-input" placeholder="Loading..." />}>
      <MapLocationPicker
        value={formData.pickupLocation}
        onChange={(value) => setFormData(prev => ({ ...prev, pickupLocation: value }))}
        onLocationSelect={(loc) => setFormData(prev => ({ ...prev, pickupLocation: loc.address, pickupLat: loc.lat, pickupLng: loc.lng }))}
        placeholder="Search location..."
      />
    </Suspense>
  </div>

  {formData.pickupLat && formData.pickupLng && event?.event_location && (
    <Suspense fallback={<LoadingPlaceholder />}>
      <div className="map-preview-compact">
        <RouteMap
          origin={{ address: formData.pickupLocation, lat: formData.pickupLat, lng: formData.pickupLng }}
          destination={event.event_location}
          height="150px"
          showDirections={true}
          onRouteCalculated={handleRouteCalculated}
        />
      </div>
      {routeDistance && (
        <div className="info-banner info">
          <span className="info-banner-icon">📏</span>
          <span>{routeDistance.toFixed(1)} km • Max ₪{maxPayment.toFixed(0)}</span>
        </div>
      )}
    </Suspense>
  )}

  {/* Return location toggle */}
  {(formData.tripType === 'both' || formData.tripType === 'return') && (
    <>
      <label className="inline-toggle" style={{ marginTop: '10px', padding: '8px 0' }}>
        <input type="checkbox" name="sameReturnLocation" checked={formData.sameReturnLocation} onChange={handleInputChange} />
        <span>Same location for return</span>
      </label>

      {!formData.sameReturnLocation && (
        <div className="form-group" style={{ marginTop: '10px' }}>
          <Suspense fallback={<input type="text" className="form-input" placeholder="Loading..." />}>
            <MapLocationPicker
              value={formData.returnLocation}
              onChange={(value) => setFormData(prev => ({ ...prev, returnLocation: value }))}
              onLocationSelect={(loc) => setFormData(prev => ({ ...prev, returnLocation: loc.address, returnLat: loc.lat, returnLng: loc.lng }))}
              placeholder="Return pickup..."
            />
          </Suspense>
        </div>
      )}
    </>
  )}
</div>

  {/* SECTION 4: Preferences - Compact */}
<div className="form-section">
  <div className="form-section-header">
    <span className="form-section-icon">⚙️</span>
    <h4 className="form-section-title">Preferences</h4>
  </div>

  {/* Car notes - only for offers */}
  {(showModal === 'offer' || showModal === 'edit-offer') && (
    <div className="form-group">
      <label className="form-label">Notes</label>
      <input type="text" name="description" className="form-input" value={formData.description} onChange={handleInputChange} placeholder="Blue Toyota, no smoking..." />
    </div>
  )}

  {/* Who can join - Compact Pills */}
  <div className="form-group">
    <label className="form-label">Who can join?</label>
    <div className="pill-toggle-group">
      <label className={`pill-toggle ${formData.preference === 'any' ? 'selected' : ''}`}>
        <input type="radio" name="preference" value="any" checked={formData.preference === 'any'} onChange={handleInputChange} />
        <span className="pill-icon">👥</span>
        <span>Anyone</span>
      </label>
      <label className={`pill-toggle gender-male ${formData.preference === 'male' ? 'selected' : ''}`}>
        <input type="radio" name="preference" value="male" checked={formData.preference === 'male'} onChange={handleInputChange} />
        <span className="pill-icon">♂️</span>
        <span>Males</span>
      </label>
      <label className={`pill-toggle gender-female ${formData.preference === 'female' ? 'selected' : ''}`}>
        <input type="radio" name="preference" value="female" checked={formData.preference === 'female'} onChange={handleInputChange} />
        <span className="pill-icon">♀️</span>
        <span>Females</span>
      </label>
    </div>
  </div>
</div>
                  {/* SECTION 5: Payment - Only for offers */}
                  {(showModal === 'offer' || showModal === 'edit-offer') && (
                    <div className="form-section" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', borderColor: '#e9d5ff' }}>
                      <div className="form-section-header">
                        <span className="form-section-icon">💰</span>
                        <h4 className="form-section-title" style={{ color: '#7c3aed' }}>Payment</h4>
                      </div>

                      {/* Payment type cards */}
                      <div className="form-group">
                        <div className="option-cards">
                          <label className={`option-card ${formData.paymentRequired === 'not_required' ? 'selected' : ''}`} onClick={() => { setFormData(prev => ({ ...prev, paymentRequired: 'not_required', paymentMethod: '' })); }}>
                            <input type="radio" name="paymentRequired" value="not_required" checked={formData.paymentRequired === 'not_required'} onChange={() => {}} />
                            <div className="option-card-icon">🆓</div>
                            <div className="option-card-label">Free</div>
                          </label>
                          <label className={`option-card ${formData.paymentRequired === 'optional' ? 'selected' : ''}`} onClick={() => { setFormData(prev => ({ ...prev, paymentRequired: 'optional', paymentAmount: maxPayment > 0 ? maxPayment.toFixed(0) : '' })); }}>
                            <input type="radio" name="paymentRequired" value="optional" checked={formData.paymentRequired === 'optional'} onChange={() => {}} />
                            <div className="option-card-icon">🙏</div>
                            <div className="option-card-label">Optional</div>
                          </label>
                          <label className={`option-card ${formData.paymentRequired === 'obligatory' ? 'selected' : ''}`} onClick={() => { setFormData(prev => ({ ...prev, paymentRequired: 'obligatory', paymentAmount: maxPayment > 0 ? maxPayment.toFixed(0) : '' })); }}>
                            <input type="radio" name="paymentRequired" value="obligatory" checked={formData.paymentRequired === 'obligatory'} onChange={() => {}} />
                            <div className="option-card-icon">💳</div>
                            <div className="option-card-label">Required</div>
                          </label>
                        </div>
                      </div>

                      {formData.paymentRequired !== 'not_required' && (
                        <>
                          {/* Amount input */}
                          <div className="form-group">
                            <label className="form-label" style={{ color: '#7c3aed' }}>Price per passenger</label>
                            <div className="payment-amount-input">
                              <span className="currency">₪</span>
                              <input
                                type="number"
                                name="paymentAmount"
                                className="form-input"
                                value={formData.paymentAmount}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (maxPayment > 0 && val > maxPayment) {
                                    setFormData(prev => ({ ...prev, paymentAmount: maxPayment.toFixed(0) }));
                                  } else {
                                    handleInputChange(e);
                                  }
                                }}
                                placeholder={maxPayment > 0 ? maxPayment.toFixed(0) : "0"}
                                min="0"
                                max={maxPayment > 0 ? maxPayment : undefined}
                                step="1"
                              />
                            </div>
                            <p className="payment-max-hint">
                              {routeDistance ? `Max: ₪${maxPayment.toFixed(0)} (${routeDistance.toFixed(1)}km)` : 'Select location to see max'}
                            </p>
                          </div>

                          {/* Payment method */}
                          <div className="form-group">
                            <label className="form-label" style={{ color: '#7c3aed' }}>Payment Method</label>
                            <div className="option-cards">
                              <label className={`option-card ${formData.paymentMethod === 'bit' ? 'selected' : ''}`}>
                                <input type="radio" name="paymentMethod" value="bit" checked={formData.paymentMethod === 'bit'} onChange={handleInputChange} />
                                <div className="option-card-icon">📱</div>
                                <div className="option-card-label">Bit</div>
                              </label>
                              <label className={`option-card ${formData.paymentMethod === 'paybox' ? 'selected' : ''}`}>
                                <input type="radio" name="paymentMethod" value="paybox" checked={formData.paymentMethod === 'paybox'} onChange={handleInputChange} />
                                <div className="option-card-icon">📦</div>
                                <div className="option-card-label">PayBox</div>
                              </label>
                              <label className={`option-card ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}>
                                <input type="radio" name="paymentMethod" value="cash" checked={formData.paymentMethod === 'cash'} onChange={handleInputChange} />
                                <div className="option-card-icon">💵</div>
                                <div className="option-card-label">Cash</div>
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Remember me */}
                  {!editingItem && !isAuthenticated && (
                    <label className="inline-toggle" style={{ padding: '12px 0' }}>
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      <span>💾 Remember my details</span>
                    </label>
                  )}
                </>
              )}
            </div>
            
            {authStep !== 'otp' && (
              <div className="legendary-modal-footer">
                <button
                  className="legendary-action-btn secondary"
                  onClick={() => { setShowModal(null); resetForm(); }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="legendary-action-btn primary"
                  onClick={() => handlePublish(showModal.includes('offer') ? 'offer' : 'request')}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="btn-car-loading">
                      <span className="mini-car">🚗</span>
                      {isAuthenticated ? 'Saving...' : 'Sending code...'}
                    </span>
                  ) : (editingItem ? 'Save Changes' : (showModal === 'offer' ? '🚀 Publish Offer' : '🚀 Publish Request'))}
                </button>
              </div>
            )}
            
            {/* Full screen car animation while submitting */}
            {submitting && (
              <div className="page-loading-overlay">
                <div className="simple-car-loader">
                  <div className="simple-car">
                    <div className="simple-car-body"></div>
                    <div className="simple-car-top"></div>
                    <div className="simple-car-window"></div>
                    <div className="simple-car-light-front"></div>
                    <div className="simple-car-light-back"></div>
                    <div className="simple-car-wheel simple-car-wheel-front"></div>
                    <div className="simple-car-wheel simple-car-wheel-back"></div>
                    <div className="speed-lines">
                      <div className="speed-line"></div>
                      <div className="speed-line"></div>
                      <div className="speed-line"></div>
                    </div>
                    <div className="exhaust">
                      <div className="exhaust-puff"></div>
                      <div className="exhaust-puff"></div>
                      <div className="exhaust-puff"></div>
                    </div>
                  </div>
                  <div className="simple-road"></div>
                </div>
                <p className="loading-text">{showModal.includes('offer') ? 'Creating your ride offer...' : 'Sending your request...'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Ride Modal - Legendary */}
      {showModal === 'join-ride' && selectedOffer && (
        <div className="legendary-modal-overlay" onClick={() => { if (!submitting) { setShowModal(null); setJoinPickupLocation(null); } }}>
          <div className="legendary-modal" onClick={e => e.stopPropagation()}>
            <div className="legendary-modal-handle" />
            <div className="legendary-modal-header">
              <h2>🙋 Request to Join Ride</h2>
              <button className="legendary-modal-close" onClick={() => { if (!submitting) { setShowModal(null); setJoinPickupLocation(null); } }}>×</button>
            </div>

            <div className="legendary-modal-body">
              <div className="driver-preview">
                <h3>🚗 {selectedOffer.driver_name || selectedOffer.name}</h3>
                <p>{selectedOffer.locations?.[0]?.location_address}</p>
                {selectedOffer.preference && selectedOffer.preference !== 'any' && (
                  <span className={`preference-badge ${selectedOffer.preference}`} style={{ marginTop: '8px', display: 'inline-block' }}>
                    {selectedOffer.preference === 'male' ? '♂️ Males preferred' : '♀️ Females preferred'}
                  </span>
                )}
              </div>
              
              {/* Show driver's route and allow picking pickup location */}
              {selectedOffer.locations?.[0]?.location_address && event?.event_location && (
                <div className="route-picker-section">
                  <h4>🗺️ בחר מיקום איסוף על המסלול</h4>
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <RoutePicker
                      origin={selectedOffer.locations[0].location_address}
                      destination={event.event_location}
                      selectedPickup={joinPickupLocation}
                      onPickupSelect={(location) => {
                        console.log('RoutePicker selected location:', location);
                        setJoinPickupLocation(location);
                      }}
                      height="350px"
                      showInstructions={true}
                    />
                  </Suspense>
                  
                  <div className="manual-address-box">
                    <p>או הזן כתובת ידנית:</p>
                    <Suspense fallback={
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Loading..."
                      />
                    }>
                      <MapLocationPicker
                        value={joinPickupLocation?.address || ''}
                        onChange={() => {}}
                        onLocationSelect={(location) => {
                          console.log('MapLocationPicker selected location:', location);
                          setJoinPickupLocation(location);
                        }}
                        placeholder="הזן כתובת איסוף..."
                        compact={true}
                      />
                    </Suspense>
                  </div>
                </div>
              )}

              {/* Show selected pickup location confirmation */}
              {joinPickupLocation && joinPickupLocation.lat != null && joinPickupLocation.lng != null ? (
                <div className="pickup-confirmed">
                  <p className="title">✅ מיקום איסוף נבחר:</p>
                  <p className="address">{joinPickupLocation.address}</p>
                  <p className="coords">({joinPickupLocation.lat.toFixed(5)}, {joinPickupLocation.lng.toFixed(5)})</p>
                </div>
              ) : (
                <div className="pickup-warning">
                  <p>⚠️ לא נבחר מיקום איסוף. לחץ על המסלול הכחול למעלה או הזן כתובת.</p>
                </div>
              )}
              
              {isAuthenticated ? (
                <div className="logged-in-notice">
                  <span className="icon">✅</span>
                  <span>Logged in - Your info is pre-filled below</span>
                </div>
              ) : (
                <p className="text-center text-muted mb-2">
                  Enter your details to request a spot
                </p>
              )}

              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                />
              </div>

              {/* Number of Passengers */}
              <div className="form-group passenger-count-section">
                <label className="form-label">Number of Passengers (Including You) *</label>
                <select
                  name="passengerCount"
                  className="form-select"
                  value={formData.passengerCount || 1}
                  onChange={handleInputChange}
                >
                  {[...Array(Math.min(selectedOffer?.available_seats || 1, 10))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'passenger (just you)' : 'passengers'}
                    </option>
                  ))}
                </select>
                <p className="passenger-count-hint">
                  💡 Available seats: {selectedOffer?.available_seats || 0}
                </p>
              </div>

              {/* Message/Note field */}
              <div className="form-group message-to-driver">
                <label className="form-label">הודעה לנהג (אופציונלי)</label>
                <textarea
                  className="form-input"
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="הערות מיוחדות, זמני גמישות, או כל מידע חשוב לנהג..."
                  rows={3}
                />
              </div>

              {/* Gender Selection */}
              <div className="form-group gender-selector">
                <label className="form-label">Your Gender *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleInputChange}
                    />
                    <span>♂️ Male</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleInputChange}
                    />
                    <span>♀️ Female</span>
                  </label>
                </div>
              </div>

              {/* Anonymous Option */}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleInputChange}
                />
                <span>🔒 Stay Anonymous (Hide my name and phone from other users)</span>
              </label>

              {/* Payment Options - Only for offers */}
              {(showModal === 'offer' || showModal === 'edit-offer') && (
                <>
                  <div className="form-group">
                    <label className="form-label">Payment</label>
                    <select 
                      name="paymentRequired" 
                      className="form-select" 
                      value={formData.paymentRequired} 
                      onChange={handleInputChange}
                    >
                      <option value="not_required">Not Required (Free Ride)</option>
                      <option value="optional">Optional (Passenger can choose to pay)</option>
                      <option value="obligatory">Obligatory (Payment required)</option>
                    </select>
                  </div>

                  {(formData.paymentRequired === 'optional' || formData.paymentRequired === 'obligatory') && (
                    <div className="form-group">
                      <label className="form-label">Price per Passenger</label>
                      <input
                        type="number"
                        name="paymentAmount"
                        className="form-input"
                        value={formData.paymentAmount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <small className="form-hint">
                        Maximum allowed: 0.5 × distance (km)
                      </small>
                    </div>
                  )}
                </>
              )}

              <label className="checkbox-label remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember my details</span>
              </label>
            </div>

            <div className="legendary-modal-footer">
              <button
                className="legendary-action-btn secondary"
                onClick={() => { setShowModal(null); setJoinPickupLocation(null); setJoinMessage(''); }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="legendary-action-btn success"
                onClick={handleSubmitJoinRequest}
                disabled={submitting}
              >
                {submitting ? '🚗 Sending...' : '🚀 Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal - Legendary */}
      {showModal === 'join-requests' && selectedOffer && (
        <div className="legendary-modal-overlay" onClick={() => setShowModal(null)}>
          <div className="legendary-modal" onClick={e => e.stopPropagation()}>
            <div className="legendary-modal-handle" />
            <div className="legendary-modal-header">
              <h2>📋 Join Requests</h2>
              <button className="legendary-modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>

            <div className="legendary-modal-body">
              {joinRequests.length === 0 ? (
                <div className="legendary-empty-state" style={{ padding: '40px 20px' }}>
                  <span className="legendary-empty-icon">📭</span>
                  <h3>No requests yet</h3>
                  <p>When someone asks to join your ride, they'll appear here.</p>
                </div>
              ) : (
                <div className="join-requests-list">
                  {joinRequests.map((req, i) => (
                    <div key={i} className={`join-request-item ${req.status}`}>
                      <div className="request-info">
                        <h4>👤 {req.name}</h4>
                        <p>{req.phone} • {req.email}</p>
                        {req.pickup_location && (
                          <p className="request-pickup-location">
                            <span>📍</span>
                            <span>מיקום איסוף: {req.pickup_location}</span>
                          </p>
                        )}
                        {req.message && (
                          <div className="passenger-message-box">
                            <p className="label">💬 הודעה מהנוסע:</p>
                            <p className="message">{req.message}</p>
                          </div>
                        )}
                        <span className={`status-badge status-${req.status}`}>
                          {req.status === 'pending' ? '⏳ Pending' : req.status === 'confirmed' ? '✅ Confirmed' : '❌ Declined'}
                        </span>
                      </div>
                      
                      {/* Show route with detour if pickup location is available */}
                      {(() => {
                        // More lenient check - check if any pickup data exists
                        const hasPickupLocation = req.pickup_location || (req.pickup_lat != null && req.pickup_lng != null);
                        const hasPickupCoords = req.pickup_lat != null && req.pickup_lng != null;
                        const hasOrigin = selectedOffer.locations?.[0]?.location_address;
                        const hasDestination = event?.event_location;
                        
                        console.log('RouteWithDetour conditions for request:', req.name, {
                          hasPickupLocation,
                          hasPickupCoords,
                          hasOrigin,
                          hasDestination,
                          pickupLocation: req.pickup_location,
                          pickupLat: req.pickup_lat,
                          pickupLng: req.pickup_lng,
                          pickupLatType: typeof req.pickup_lat,
                          pickupLngType: typeof req.pickup_lng,
                          origin: selectedOffer.locations?.[0]?.location_address,
                          destination: event?.event_location,
                          fullRequest: req
                        });
                        
                        if (hasPickupCoords && hasOrigin && hasDestination) {
                          return (
                            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                              <RouteWithDetour
                                origin={selectedOffer.locations[0].location_address}
                                destination={event.event_location}
                                pickupLocation={{
                                  address: req.pickup_location || 'מיקום איסוף',
                                  lat: typeof req.pickup_lat === 'number' ? req.pickup_lat : parseFloat(req.pickup_lat),
                                  lng: typeof req.pickup_lng === 'number' ? req.pickup_lng : parseFloat(req.pickup_lng)
                                }}
                                height="300px"
                              />
                            </div>
                          );
                        } else if (hasPickupLocation) {
                          return (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px', direction: 'rtl' }}>
                              <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                                📍 מיקום איסוף: {req.pickup_location || 'נבחר'}
                                {!hasPickupCoords && ' (חסרות קואורדינטות)'}
                                {(!hasOrigin || !hasDestination) && ' (חסר מידע על מסלול הנהג)'}
                              </p>
                              {hasOrigin && hasDestination && hasPickupCoords && (
                                <div style={{ marginTop: '12px' }}>
                                  <RouteWithDetour
                                    origin={selectedOffer.locations[0].location_address}
                                    destination={event.event_location}
                                    pickupLocation={{
                                      address: req.pickup_location || 'מיקום איסוף',
                                      lat: typeof req.pickup_lat === 'number' ? req.pickup_lat : parseFloat(req.pickup_lat),
                                      lng: typeof req.pickup_lng === 'number' ? req.pickup_lng : parseFloat(req.pickup_lng)
                                    }}
                                    height="250px"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', borderRadius: '8px', direction: 'rtl' }}>
                            <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
                              ⚠️ לא נבחר מיקום איסוף בבקשה זו
                            </p>
                            <p style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px', marginBottom: 0 }}>
                              Debug: pickup_location={req.pickup_location ? 'exists' : 'null'}, 
                              pickup_lat={req.pickup_lat != null ? req.pickup_lat : 'null'}, 
                              pickup_lng={req.pickup_lng != null ? req.pickup_lng : 'null'}
                            </p>
                          </div>
                        );
                      })()}
                      
                      {req.status === 'pending' && (
                        <div className="request-actions">
                          <button onClick={() => handleAcceptJoinRequest(req.id)} className="btn btn-success btn-sm">
                            ✅ Accept
                          </button>
                          <button onClick={() => handleRejectJoinRequest(req.id)} className="btn btn-ghost btn-sm">
                            ❌
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="legendary-modal-footer">
              <button className="legendary-action-btn secondary" onClick={() => setShowModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Passengers Modal - Legendary */}
      {showPassengersModal && (
        <div className="legendary-modal-overlay" onClick={() => { setShowPassengersModal(null); setCancelMessage(''); }}>
          <div className="legendary-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="legendary-modal-handle" />
            <div className="legendary-modal-header">
              <h2>👥 Manage Passengers</h2>
              <button className="legendary-modal-close" onClick={() => { setShowPassengersModal(null); setCancelMessage(''); }}>×</button>
            </div>

            <div className="legendary-modal-body">
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', direction: 'rtl' }}>
                כאן תוכל לנהל את הנוסעים המאושרים לנסיעה שלך. אם תרצה לבטל נוסע, תוכל לשלוח לו הודעה עם הסיבה.
              </p>
              
              {showPassengersModal.confirmed_passengers?.length > 0 ? (
                <div className="passengers-list">
                  {showPassengersModal.confirmed_passengers.map((passenger, i) => (
                    <div key={i} className="passenger-manage-item" style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>👤 {passenger.name}</h4>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{passenger.phone}</p>
                          {passenger.email && (
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>{passenger.email}</p>
                          )}
                          {passenger.pickup_location && (
                            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#0369a1' }}>
                              📍 {passenger.pickup_location}
                            </p>
                          )}
                          {passenger.message && (
                            <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '6px' }}>
                              <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', direction: 'rtl' }}>
                                💬 {passenger.message}
                              </p>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a 
                            href={`https://wa.me/${passenger.phone?.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-success btn-sm"
                            style={{ textDecoration: 'none' }}
                          >
                            💬 WhatsApp
                          </a>
                          <a 
                            href={`tel:${passenger.phone}`} 
                            className="btn btn-secondary btn-sm"
                            style={{ textDecoration: 'none' }}
                          >
                            📞
                          </a>
                        </div>
                      </div>
                      
                      {/* Cancel section */}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
                            ❌ Cancel this passenger
                          </summary>
                          <div style={{ marginTop: '12px' }}>
                            <textarea
                              placeholder="הודעה לנוסע (למה הביטול)..."
                              style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #fca5a5',
                                fontSize: '13px',
                                direction: 'rtl',
                                resize: 'vertical',
                                minHeight: '60px'
                              }}
                              value={cancelMessage}
                              onChange={(e) => setCancelMessage(e.target.value)}
                            />
                            <button 
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to cancel ${passenger.name}?`)) {
                                  try {
                                    const response = await fetch(`${API_URL}/carpool/offer/${showPassengersModal.offer_id}/cancel-passenger`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ 
                                        passenger_id: passenger.id,
                                        message: cancelMessage 
                                      }),
                                    });
                                    if (response.ok) {
                                      showToast('Passenger cancelled successfully', 'success');
                                      setShowPassengersModal(null);
                                      setCancelMessage('');
                                      await fetchOffers();
                                    } else {
                                      const data = await response.json();
                                      showToast(data.message || 'Failed to cancel passenger', 'error');
                                    }
                                  } catch (error) {
                                    showToast('Error cancelling passenger', 'error');
                                  }
                                }
                              }}
                              className="btn btn-danger btn-sm"
                              style={{ marginTop: '8px' }}
                            >
                              Confirm Cancel
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="legendary-empty-state" style={{ padding: '40px 20px' }}>
                  <span className="legendary-empty-icon">👥</span>
                  <h3>No confirmed passengers yet</h3>
                  <p>When you accept passengers, they'll appear here.</p>
                </div>
              )}
            </div>

            <div className="legendary-modal-footer">
              <button className="legendary-action-btn secondary" onClick={() => { setShowPassengersModal(null); setCancelMessage(''); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDashboard;
