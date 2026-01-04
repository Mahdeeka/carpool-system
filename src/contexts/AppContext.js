import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, logout as apiLogout } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [eventData, setEventData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authData, setAuthData] = useState(null); // Authenticated user account
  const [authLoading, setAuthLoading] = useState(true); // Loading auth state
  const [toast, setToast] = useState(null);

  // Load data from localStorage on mount - FAST: trust cached data immediately
  useEffect(() => {
    const savedEventData = localStorage.getItem('eventData');
    const savedUserData = localStorage.getItem('userData');
    const savedAuthAccount = localStorage.getItem('authAccount');
    const savedAuthToken = localStorage.getItem('authToken');
    
    if (savedEventData) {
      setEventData(JSON.parse(savedEventData));
    }
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
    }
    
    // Trust cached auth data immediately for fast navigation
    if (savedAuthToken && savedAuthAccount) {
      try {
        setAuthData(JSON.parse(savedAuthAccount));
      } catch (e) {
        // Invalid cached data
      }
      // Verify in background (don't block navigation)
      const verifyInBackground = async () => {
        try {
          const response = await getCurrentUser();
          setAuthData(response.account);
          localStorage.setItem('authAccount', JSON.stringify(response.account));
        } catch (error) {
          // Token invalid or expired - clear auth state
          localStorage.removeItem('authToken');
          localStorage.removeItem('authAccount');
          setAuthData(null);
        }
      };
      verifyInBackground();
    }
    
    // Always set loading to false immediately
    setAuthLoading(false);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (eventData) {
      localStorage.setItem('eventData', JSON.stringify(eventData));
    }
  }, [eventData]);

  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }, [userData]);
  
  useEffect(() => {
    if (authData) {
      localStorage.setItem('authAccount', JSON.stringify(authData));
    }
  }, [authData]);

  // Toast notification handler
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const clearData = () => {
    setEventData(null);
    setUserData(null);
    localStorage.removeItem('eventData');
    localStorage.removeItem('userData');
  };
  
  // Logout function
  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // Ignore errors, clear local state anyway
    }
    setAuthData(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authAccount');
    showToast('Logged out successfully', 'success');
  };
  
  // Check if user is authenticated
  const isAuthenticated = !!authData;

  const value = {
    eventData,
    setEventData,
    userData,
    setUserData,
    authData,
    setAuthData,
    authLoading,
    isAuthenticated,
    logout,
    showToast,
    clearData,
    toast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <div>{toast.message}</div>
        </div>
      )}
    </AppContext.Provider>
  );
};
