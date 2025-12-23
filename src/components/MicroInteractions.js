import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MicroInteractions.css';

// Haptic feedback utility (for mobile)
export const haptic = {
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  },
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  },
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 25, 50]);
    }
  },
  notification: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 100, 10, 100, 10]);
    }
  }
};

// Animated Success Checkmark
export const SuccessAnimation = ({ show, message, onComplete }) => {
  useEffect(() => {
    if (show) {
      haptic.success();
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="success-animation-overlay">
      <div className="success-animation">
        <div className="success-circle">
          <svg className="success-checkmark" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
};

// Animated Error/Failure
export const ErrorAnimation = ({ show, message, onComplete }) => {
  useEffect(() => {
    if (show) {
      haptic.error();
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="error-animation-overlay">
      <div className="error-animation">
        <div className="error-circle">
          <svg className="error-x" viewBox="0 0 52 52">
            <circle className="x-circle" cx="26" cy="26" r="25" fill="none" />
            <path className="x-line" fill="none" d="M16 16 36 36" />
            <path className="x-line" fill="none" d="M36 16 16 36" />
          </svg>
        </div>
        {message && <p className="error-message">{message}</p>}
      </div>
    </div>
  );
};

// Confetti burst for celebrations
export const ConfettiBurst = ({ show, count = 50 }) => {
  if (!show) return null;

  const confettiPieces = Array.from({ length: count }).map((_, i) => {
    const colors = ['#0EA5E9', '#0B2A4A', '#22C55E', '#F59E0B', '#EC4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const rotation = Math.random() * 360;
    const size = 6 + Math.random() * 8;

    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          '--confetti-color': color,
          '--confetti-left': `${left}%`,
          '--confetti-delay': `${delay}s`,
          '--confetti-rotation': `${rotation}deg`,
          '--confetti-size': `${size}px`
        }}
      />
    );
  });

  return <div className="confetti-container">{confettiPieces}</div>;
};

// Pull to Refresh Component
export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  resistance = 2.5
}) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);

  const handleTouchStart = (e) => {
    if (containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling || refreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = (currentY - startY.current) / resistance;

    if (diff > 0) {
      setPullDistance(Math.min(diff, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      haptic.medium();

      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    setPulling(false);
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`pull-indicator ${refreshing ? 'refreshing' : ''}`}
        style={{
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: progress
        }}
      >
        <div
          className="pull-spinner"
          style={{
            transform: `rotate(${progress * 360}deg)`
          }}
        >
          {refreshing ? (
            <div className="spinner-loading" />
          ) : (
            <span className="pull-arrow">↓</span>
          )}
        </div>
        <span className="pull-text">
          {refreshing
            ? 'Refreshing...'
            : progress >= 1
            ? 'Release to refresh'
            : 'Pull to refresh'}
        </span>
      </div>

      <div
        className="pull-content"
        style={{
          transform: pulling ? `translateY(${pullDistance}px)` : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Swipeable Card (for swipe actions)
export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80
}) => {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setOffset(diff);
  };

  const handleTouchEnd = () => {
    if (offset > threshold && onSwipeRight) {
      haptic.medium();
      onSwipeRight();
    } else if (offset < -threshold && onSwipeLeft) {
      haptic.medium();
      onSwipeLeft();
    }

    setSwiping(false);
    setOffset(0);
  };

  const showLeftAction = offset < -20;
  const showRightAction = offset > 20;

  return (
    <div className="swipeable-card-container">
      {/* Left action (appears when swiping right) */}
      {rightAction && (
        <div
          className={`swipe-action right ${showRightAction ? 'visible' : ''}`}
          style={{
            opacity: Math.min(Math.abs(offset) / threshold, 1)
          }}
        >
          {rightAction}
        </div>
      )}

      {/* Right action (appears when swiping left) */}
      {leftAction && (
        <div
          className={`swipe-action left ${showLeftAction ? 'visible' : ''}`}
          style={{
            opacity: Math.min(Math.abs(offset) / threshold, 1)
          }}
        >
          {leftAction}
        </div>
      )}

      {/* Main card */}
      <div
        ref={cardRef}
        className={`swipeable-card ${swiping ? 'swiping' : ''}`}
        style={{
          transform: `translateX(${offset}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

// Ripple effect hook
export const useRipple = () => {
  const [ripples, setRipples] = useState([]);

  const addRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples((prev) => [...prev, newRipple]);
    haptic.light();

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const RippleContainer = () => (
    <span className="ripple-container">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
    </span>
  );

  return { addRipple, RippleContainer };
};

// Animated counter (counts up/down to a number)
export const AnimatedCounter = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className="animated-counter">
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// Pulse button for CTAs
export const PulseButton = ({ children, onClick, variant = 'primary', ...props }) => {
  const { addRipple, RippleContainer } = useRipple();

  const handleClick = (e) => {
    addRipple(e);
    onClick?.(e);
  };

  return (
    <button
      className={`pulse-button ${variant}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      <RippleContainer />
    </button>
  );
};

// Shake animation for errors
export const useShake = () => {
  const [shaking, setShaking] = useState(false);

  const shake = useCallback(() => {
    setShaking(true);
    haptic.error();
    setTimeout(() => setShaking(false), 500);
  }, []);

  return { shaking, shake, shakeClass: shaking ? 'shake-animation' : '' };
};

// Loading dots animation
export const LoadingDots = ({ text = 'Loading' }) => {
  return (
    <span className="loading-dots">
      {text}
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </span>
  );
};

// Floating action button with animation
export const FloatingActionButton = ({
  icon,
  onClick,
  label,
  expanded = false,
  position = 'bottom-right'
}) => {
  const { addRipple, RippleContainer } = useRipple();

  return (
    <button
      className={`fab ${position} ${expanded ? 'expanded' : ''}`}
      onClick={(e) => {
        addRipple(e);
        onClick?.(e);
      }}
      aria-label={label}
    >
      <span className="fab-icon">{icon}</span>
      {expanded && <span className="fab-label">{label}</span>}
      <RippleContainer />
    </button>
  );
};

export default {
  haptic,
  SuccessAnimation,
  ErrorAnimation,
  ConfettiBurst,
  PullToRefresh,
  SwipeableCard,
  useRipple,
  AnimatedCounter,
  PulseButton,
  useShake,
  LoadingDots,
  FloatingActionButton
};
