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

  // Load data from localStorage on mount
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
    
    // Verify auth token on mount
    if (savedAuthToken && savedAuthAccount) {
      verifyAuth();
    } else {
      setAuthLoading(false);
    }
  }, []);
  
  // Verify authentication on mount
  const verifyAuth = async () => {
    try {
      const response = await getCurrentUser();
      setAuthData(response.account);
      localStorage.setItem('authAccount', JSON.stringify(response.account));
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('authToken');
      localStorage.removeItem('authAccount');
      setAuthData(null);
    } finally {
      setAuthLoading(false);
    }
  };

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
