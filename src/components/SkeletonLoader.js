import React from 'react';
import './SkeletonLoader.css';

// Base skeleton element with shimmer animation
export const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  style = {},
  className = ''
}) => (
  <div
    className={`skeleton-base ${className}`}
    style={{
      width,
      height,
      borderRadius,
      ...style
    }}
  />
);

// Skeleton for text lines
export const SkeletonText = ({ lines = 3, lastLineWidth = '60%' }) => (
  <div className="skeleton-text">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        height="14px"
        style={{ marginBottom: index < lines - 1 ? '8px' : 0 }}
      />
    ))}
  </div>
);

// Skeleton for avatar/circle
export const SkeletonAvatar = ({ size = 40 }) => (
  <Skeleton
    width={`${size}px`}
    height={`${size}px`}
    borderRadius="50%"
    className="skeleton-avatar"
  />
);

// Skeleton for ride/offer card
export const SkeletonRideCard = () => (
  <div className="skeleton-ride-card">
    <div className="skeleton-ride-header">
      <SkeletonAvatar size={48} />
      <div className="skeleton-ride-info">
        <Skeleton width="120px" height="18px" />
        <Skeleton width="80px" height="14px" style={{ marginTop: '6px' }} />
      </div>
      <Skeleton width="70px" height="28px" borderRadius="14px" />
    </div>
    <div className="skeleton-ride-route">
      <div className="skeleton-route-point">
        <Skeleton width="12px" height="12px" borderRadius="50%" />
        <Skeleton width="70%" height="14px" />
      </div>
      <div className="skeleton-route-line"></div>
      <div className="skeleton-route-point">
        <Skeleton width="12px" height="12px" borderRadius="50%" />
        <Skeleton width="60%" height="14px" />
      </div>
    </div>
    <div className="skeleton-ride-footer">
      <Skeleton width="60px" height="14px" />
      <Skeleton width="80px" height="14px" />
      <Skeleton width="50px" height="14px" />
    </div>
  </div>
);

// Skeleton for request card
export const SkeletonRequestCard = () => (
  <div className="skeleton-request-card">
    <div className="skeleton-request-header">
      <SkeletonAvatar size={44} />
      <div className="skeleton-request-info">
        <Skeleton width="100px" height="16px" />
        <Skeleton width="140px" height="13px" style={{ marginTop: '6px' }} />
      </div>
    </div>
    <div className="skeleton-request-body">
      <Skeleton width="90%" height="14px" />
      <Skeleton width="70%" height="14px" style={{ marginTop: '8px' }} />
    </div>
    <div className="skeleton-request-actions">
      <Skeleton width="80px" height="36px" borderRadius="8px" />
      <Skeleton width="80px" height="36px" borderRadius="8px" />
    </div>
  </div>
);

// Skeleton for event header
export const SkeletonEventHeader = () => (
  <div className="skeleton-event-header">
    <Skeleton width="60%" height="28px" />
    <div className="skeleton-event-meta">
      <Skeleton width="120px" height="16px" />
      <Skeleton width="100px" height="16px" />
      <Skeleton width="140px" height="16px" />
    </div>
  </div>
);

// Skeleton for tab buttons
export const SkeletonTabs = ({ count = 3 }) => (
  <div className="skeleton-tabs">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton
        key={index}
        width={`${100 / count - 2}%`}
        height="44px"
        borderRadius="8px"
      />
    ))}
  </div>
);

// Skeleton for stats row
export const SkeletonStats = () => (
  <div className="skeleton-stats">
    <div className="skeleton-stat-item">
      <Skeleton width="40px" height="32px" />
      <Skeleton width="60px" height="12px" style={{ marginTop: '4px' }} />
    </div>
    <div className="skeleton-stat-item">
      <Skeleton width="40px" height="32px" />
      <Skeleton width="60px" height="12px" style={{ marginTop: '4px' }} />
    </div>
    <div className="skeleton-stat-item">
      <Skeleton width="40px" height="32px" />
      <Skeleton width="60px" height="12px" style={{ marginTop: '4px' }} />
    </div>
  </div>
);

// Full page skeleton for My Rides
export const SkeletonMyRidesPage = () => (
  <div className="skeleton-page">
    <div className="skeleton-page-header">
      <Skeleton width="40px" height="40px" borderRadius="8px" />
      <Skeleton width="150px" height="28px" />
      <Skeleton width="100px" height="36px" borderRadius="18px" />
    </div>
    <SkeletonTabs count={3} />
    <div className="skeleton-cards-list">
      <SkeletonRideCard />
      <SkeletonRideCard />
      <SkeletonRideCard />
    </div>
  </div>
);

// Full page skeleton for Event Dashboard
export const SkeletonEventDashboard = () => (
  <div className="skeleton-page">
    <SkeletonEventHeader />
    <SkeletonStats />
    <SkeletonTabs count={2} />
    <div className="skeleton-cards-list">
      <SkeletonRideCard />
      <SkeletonRideCard />
    </div>
  </div>
);

// Skeleton for profile section
export const SkeletonProfile = () => (
  <div className="skeleton-profile">
    <SkeletonAvatar size={80} />
    <Skeleton width="140px" height="24px" style={{ marginTop: '16px' }} />
    <Skeleton width="180px" height="16px" style={{ marginTop: '8px' }} />
    <div className="skeleton-profile-stats">
      <SkeletonStats />
    </div>
  </div>
);

// Skeleton for form inputs
export const SkeletonForm = ({ fields = 4 }) => (
  <div className="skeleton-form">
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="skeleton-form-field">
        <Skeleton width="80px" height="14px" />
        <Skeleton width="100%" height="44px" borderRadius="8px" style={{ marginTop: '6px' }} />
      </div>
    ))}
    <Skeleton width="100%" height="48px" borderRadius="10px" style={{ marginTop: '16px' }} />
  </div>
);

// Skeleton for map placeholder
export const SkeletonMap = ({ height = '200px' }) => (
  <div className="skeleton-map" style={{ height }}>
    <div className="skeleton-map-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21s-8-6.5-8-11a8 8 0 1 1 16 0c0 4.5-8 11-8 11z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </div>
  </div>
);

// Skeleton for notification/message item
export const SkeletonNotification = () => (
  <div className="skeleton-notification">
    <SkeletonAvatar size={36} />
    <div className="skeleton-notification-content">
      <Skeleton width="85%" height="14px" />
      <Skeleton width="60%" height="12px" style={{ marginTop: '6px' }} />
    </div>
    <Skeleton width="50px" height="12px" />
  </div>
);

// Inline skeleton loader for buttons
export const SkeletonButton = ({ width = '100px', height = '40px' }) => (
  <Skeleton width={width} height={height} borderRadius="8px" />
);

// Skeleton list with custom item component
export const SkeletonList = ({ count = 3, ItemComponent = SkeletonRideCard }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <ItemComponent key={index} />
    ))}
  </div>
);

export default {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonRideCard,
  SkeletonRequestCard,
  SkeletonEventHeader,
  SkeletonTabs,
  SkeletonStats,
  SkeletonMyRidesPage,
  SkeletonEventDashboard,
  SkeletonProfile,
  SkeletonForm,
  SkeletonMap,
  SkeletonNotification,
  SkeletonButton,
  SkeletonList,
};
