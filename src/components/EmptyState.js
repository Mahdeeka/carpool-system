import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmptyState.css';

// Reusable empty state component with illustrations and CTAs
const EmptyState = ({
  icon,
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  tips,
  variant = 'default' // 'default', 'compact', 'card'
}) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.to) {
      navigate(action.to);
    } else if (action.href) {
      window.location.href = action.href;
    }
  };

  return (
    <div className={`empty-state-container ${variant}`}>
      <div className="empty-state-visual">
        {illustration ? (
          <div className="empty-state-illustration">{illustration}</div>
        ) : icon ? (
          <div className="empty-state-icon">{icon}</div>
        ) : null}
      </div>

      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        {description && (
          <p className="empty-state-description">{description}</p>
        )}

        {tips && tips.length > 0 && (
          <div className="empty-state-tips">
            {tips.map((tip, index) => (
              <div key={index} className="empty-state-tip">
                <span className="tip-icon">{tip.icon || '💡'}</span>
                <span className="tip-text">{tip.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="empty-state-actions">
        {primaryAction && (
          <button
            className="empty-state-btn primary"
            onClick={() => handleAction(primaryAction)}
          >
            {primaryAction.icon && <span className="btn-icon">{primaryAction.icon}</span>}
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            className="empty-state-btn secondary"
            onClick={() => handleAction(secondaryAction)}
          >
            {secondaryAction.icon && <span className="btn-icon">{secondaryAction.icon}</span>}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
};

// Pre-built empty states for common scenarios

export const NoOffersEmptyState = ({ onRefresh, isAuthenticated }) => (
  <EmptyState
    icon="🚗"
    title="No rides offered yet"
    description="Start sharing rides with others! When you offer a ride, you'll see passenger requests and manage your carpool here."
    tips={[
      { icon: '🌟', text: 'Offering rides helps reduce traffic and save money' },
      { icon: '👥', text: 'Meet great people on your commute' }
    ]}
    primaryAction={{
      icon: '➕',
      label: 'Offer a Ride',
      to: '/'
    }}
    secondaryAction={onRefresh ? {
      icon: '🔄',
      label: 'Refresh',
      onClick: onRefresh
    } : null}
  />
);

export const NoJoinedRidesEmptyState = ({ onRefresh, isAuthenticated }) => (
  <EmptyState
    icon="🙋"
    title="No rides joined yet"
    description="Looking for a ride? Browse available carpools and request to join. Once confirmed, your rides will appear here."
    tips={[
      { icon: '🔍', text: 'Browse events to find available rides' },
      { icon: '⚡', text: 'Drivers usually respond within a few hours' }
    ]}
    primaryAction={{
      icon: '🔍',
      label: 'Find a Ride',
      to: '/'
    }}
    secondaryAction={onRefresh ? {
      icon: '🔄',
      label: 'Refresh',
      onClick: onRefresh
    } : null}
  />
);

export const NoRequestsEmptyState = ({ onRefresh, isAuthenticated }) => (
  <EmptyState
    icon="📋"
    title="No requests sent yet"
    description="When you request to join a ride, it will appear here. You can track request status and communicate with drivers."
    tips={[
      { icon: '✉️', text: 'Add a message when requesting to increase approval chances' },
      { icon: '📍', text: 'Set your pickup location for easy coordination' }
    ]}
    primaryAction={{
      icon: '🔍',
      label: 'Find a Ride',
      to: '/'
    }}
    secondaryAction={onRefresh ? {
      icon: '🔄',
      label: 'Refresh',
      onClick: onRefresh
    } : null}
  />
);

export const NoResultsEmptyState = ({ searchTerm, onClear }) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    description={searchTerm
      ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search.`
      : 'No results match your current filters.'
    }
    tips={[
      { icon: '💡', text: 'Try using fewer filters' },
      { icon: '🔄', text: 'Check spelling or use different keywords' }
    ]}
    primaryAction={onClear ? {
      icon: '✖️',
      label: 'Clear Filters',
      onClick: onClear
    } : null}
  />
);

export const NoEventsEmptyState = ({ onCreateEvent }) => (
  <EmptyState
    icon="📅"
    title="No events yet"
    description="Create your first event to start organizing carpools. Share the event code with participants."
    tips={[
      { icon: '🎉', text: 'Perfect for concerts, conferences, or regular commutes' },
      { icon: '🔗', text: 'Share one link and everyone can coordinate' }
    ]}
    primaryAction={{
      icon: '➕',
      label: 'Create Event',
      onClick: onCreateEvent
    }}
  />
);

export const NoPassengersEmptyState = () => (
  <EmptyState
    variant="compact"
    icon="👥"
    title="No passengers yet"
    description="Share your ride to get passengers. They'll appear here once they request to join."
    primaryAction={{
      icon: '📤',
      label: 'Share Ride Link',
      onClick: () => {
        if (navigator.share) {
          navigator.share({
            title: 'Join my carpool',
            text: 'I\'m offering a ride! Join my carpool.',
            url: window.location.href
          });
        }
      }
    }}
  />
);

export const OfflineEmptyState = ({ onRetry }) => (
  <EmptyState
    icon="📡"
    title="You're offline"
    description="Please check your internet connection and try again."
    primaryAction={{
      icon: '🔄',
      label: 'Try Again',
      onClick: onRetry
    }}
  />
);

export const ErrorEmptyState = ({ error, onRetry }) => (
  <EmptyState
    icon="⚠️"
    title="Something went wrong"
    description={error || 'We encountered an error while loading. Please try again.'}
    primaryAction={{
      icon: '🔄',
      label: 'Try Again',
      onClick: onRetry
    }}
  />
);

export const NotLoggedInEmptyState = ({ feature, onLogin }) => (
  <EmptyState
    icon="🔐"
    title="Login required"
    description={`Please log in to ${feature || 'access this feature'}. It only takes a moment!`}
    tips={[
      { icon: '⚡', text: 'Quick login with phone number' },
      { icon: '🔒', text: 'Your data is secure and private' }
    ]}
    primaryAction={{
      icon: '🔑',
      label: 'Log In',
      onClick: onLogin
    }}
  />
);

export default EmptyState;
