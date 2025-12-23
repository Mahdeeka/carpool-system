import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import './PWAEnhancements.css';

// PWA Context for global state
const PWAContext = createContext(null);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

// PWA Provider Component
export const PWAProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if already installed
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone
      || document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for app installed
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Service worker registration and update detection
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  // Trigger install prompt
  const promptInstall = async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }
    return false;
  };

  // Reload for update
  const reloadForUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const value = {
    isOnline,
    isInstalled,
    canInstall: !!installPrompt && !isInstalled,
    promptInstall,
    hasUpdate,
    reloadForUpdate,
    registration
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
};

// Offline Indicator Component
export const OfflineIndicator = () => {
  const { isOnline } = usePWA();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <span className="offline-icon">
        {isOnline ? '✓' : '○'}
      </span>
      <span className="offline-text">
        {isOnline ? 'Back online' : 'You are offline'}
      </span>
    </div>
  );
};

// Update Available Banner
export const UpdateBanner = ({ onDismiss }) => {
  const { hasUpdate, reloadForUpdate } = usePWA();

  if (!hasUpdate) return null;

  return (
    <div className="update-banner">
      <div className="update-content">
        <span className="update-icon">🔄</span>
        <div className="update-text">
          <strong>Update Available</strong>
          <p>A new version is ready. Refresh to update.</p>
        </div>
      </div>
      <div className="update-actions">
        <button className="update-btn secondary" onClick={onDismiss}>
          Later
        </button>
        <button className="update-btn primary" onClick={reloadForUpdate}>
          Refresh Now
        </button>
      </div>
    </div>
  );
};

// Install Prompt Banner
export const InstallBanner = ({ onDismiss }) => {
  const { canInstall, promptInstall, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('installBannerDismissed');
    if (isDismissed) {
      const dismissedDate = new Date(isDismissed);
      const now = new Date();
      // Show again after 7 days
      if (now - dismissedDate < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('installBannerDismissed', new Date().toISOString());
    setDismissed(true);
    onDismiss?.();
  };

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      handleDismiss();
    }
  };

  if (!canInstall || dismissed || isInstalled) return null;

  return (
    <div className="install-banner">
      <div className="install-content">
        <span className="install-icon">📱</span>
        <div className="install-text">
          <strong>Add to Home Screen</strong>
          <p>Install Trempi for quick access and offline use</p>
        </div>
      </div>
      <div className="install-actions">
        <button className="install-btn secondary" onClick={handleDismiss}>
          Not Now
        </button>
        <button className="install-btn primary" onClick={handleInstall}>
          Install
        </button>
      </div>
    </div>
  );
};

// Floating Install Button (less intrusive option)
export const InstallButton = ({ position = 'bottom-right' }) => {
  const { canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('installButtonDismissed');
    setDismissed(!!isDismissed);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('installButtonDismissed', 'true');
    setDismissed(true);
  };

  if (!canInstall || dismissed) return null;

  return (
    <div className={`install-floating ${position}`}>
      <button className="install-floating-btn" onClick={promptInstall}>
        <span className="btn-icon">📲</span>
        <span className="btn-text">Install App</span>
      </button>
      <button className="install-dismiss" onClick={handleDismiss}>
        ×
      </button>
    </div>
  );
};

// Network Status Hook
export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    online: navigator.onLine,
    effectiveType: null,
    downlink: null,
    rtt: null
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null
      });
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection?.addEventListener('change', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      connection?.removeEventListener('change', updateNetworkStatus);
    };
  }, []);

  return status;
};

// Share API wrapper
export const useShare = () => {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);

  const share = useCallback(async ({ title, text, url }) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
        return false;
      }
    }
    return false;
  }, []);

  const shareRide = useCallback((ride) => {
    const text = `Join my carpool! ${ride.eventName ? `Going to ${ride.eventName}` : 'Find a ride with me'}`;
    return share({
      title: 'Trempi - Share a Ride',
      text,
      url: window.location.href
    });
  }, [share]);

  const shareEvent = useCallback((event) => {
    return share({
      title: event.event_name || 'Carpool Event',
      text: `Join the carpool for ${event.event_name}. Share rides and save money!`,
      url: window.location.href
    });
  }, [share]);

  return { canShare, share, shareRide, shareEvent };
};

// Background Sync Queue
export const useBackgroundSync = (syncName) => {
  const [pendingActions, setPendingActions] = useState([]);

  const queueAction = useCallback((action) => {
    const actionWithId = {
      ...action,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    // Store in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem(`sync_${syncName}`) || '[]');
    stored.push(actionWithId);
    localStorage.setItem(`sync_${syncName}`, JSON.stringify(stored));

    setPendingActions(prev => [...prev, actionWithId]);

    // Register for background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.sync.register(syncName);
      });
    }
  }, [syncName]);

  const clearAction = useCallback((actionId) => {
    const stored = JSON.parse(localStorage.getItem(`sync_${syncName}`) || '[]');
    const filtered = stored.filter(a => a.id !== actionId);
    localStorage.setItem(`sync_${syncName}`, JSON.stringify(filtered));
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
  }, [syncName]);

  // Load pending actions on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`sync_${syncName}`) || '[]');
    setPendingActions(stored);
  }, [syncName]);

  return {
    pendingActions,
    queueAction,
    clearAction,
    hasPendingActions: pendingActions.length > 0
  };
};

// Notifications permission and sending
export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('Notification' in window);
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [supported]);

  const notify = useCallback(async (title, options = {}) => {
    if (!supported || permission !== 'granted') {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      return reg.showNotification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
    } catch (err) {
      // Fallback to regular notification
      return new Notification(title, options);
    }
  }, [supported, permission]);

  return {
    supported,
    permission,
    requestPermission,
    notify,
    canNotify: supported && permission === 'granted'
  };
};

export default {
  PWAProvider,
  usePWA,
  OfflineIndicator,
  UpdateBanner,
  InstallBanner,
  InstallButton,
  useNetworkStatus,
  useShare,
  useBackgroundSync,
  useNotifications
};
