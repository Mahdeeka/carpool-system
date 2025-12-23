import React, { useState, useEffect } from 'react';
import './Onboarding.css';

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Trempi',
    description: 'The easiest way to share rides with people going your way.',
    icon: '🚗',
    illustration: 'welcome',
    tips: [
      'Share costs with fellow travelers',
      'Reduce traffic and emissions',
      'Make new connections'
    ]
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    description: 'Join events, find rides, and travel together.',
    icon: '🎯',
    illustration: 'how-it-works',
    tips: [
      'Join an event with a code',
      'Browse available rides',
      'Request to join or offer a ride'
    ]
  },
  {
    id: 'offer-ride',
    title: 'Offer a Ride',
    description: 'Have extra seats? Share your ride and help others.',
    icon: '👋',
    illustration: 'offer',
    tips: [
      'Set your departure location',
      'Choose available seats',
      'Approve passenger requests'
    ]
  },
  {
    id: 'find-ride',
    title: 'Find a Ride',
    description: 'Need a ride? Browse offers and request to join.',
    icon: '🔍',
    illustration: 'find',
    tips: [
      'View available carpools',
      'See driver details and route',
      'Send a join request'
    ]
  },
  {
    id: 'safety',
    title: 'Your Safety Matters',
    description: 'We verify users and provide tools for safe travel.',
    icon: '🛡️',
    illustration: 'safety',
    tips: [
      'Phone verification required',
      'Rate and review after rides',
      'Share your trip with friends'
    ]
  }
];

// Main Onboarding Component
const Onboarding = ({
  onComplete,
  onSkip,
  showSkip = true,
  startStep = 0
}) => {
  const [currentStep, setCurrentStep] = useState(startStep);
  const [animating, setAnimating] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const goToNext = () => {
    if (isLastStep) {
      onComplete?.();
      return;
    }

    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setAnimating(false);
    }, 300);
  };

  const goToPrev = () => {
    if (currentStep > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimating(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <div className="onboarding-container">
      {/* Progress Bar */}
      <div className="onboarding-progress">
        <div
          className="onboarding-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip Button */}
      {showSkip && !isLastStep && (
        <button className="onboarding-skip" onClick={handleSkip}>
          Skip
        </button>
      )}

      {/* Step Content */}
      <div className={`onboarding-content ${animating ? 'animating' : ''}`}>
        <div className="onboarding-illustration">
          <div className="illustration-icon">{step.icon}</div>
        </div>

        <h2 className="onboarding-title">{step.title}</h2>
        <p className="onboarding-description">{step.description}</p>

        <div className="onboarding-tips">
          {step.tips.map((tip, index) => (
            <div key={index} className="onboarding-tip">
              <span className="tip-number">{index + 1}</span>
              <span className="tip-text">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="onboarding-dots">
        {ONBOARDING_STEPS.map((_, index) => (
          <button
            key={index}
            className={`onboarding-dot ${index === currentStep ? 'active' : ''}`}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="onboarding-actions">
        {currentStep > 0 && (
          <button className="onboarding-btn secondary" onClick={goToPrev}>
            Back
          </button>
        )}
        <button className="onboarding-btn primary" onClick={goToNext}>
          {isLastStep ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};

// Profile Completion Progress Component
export const ProfileProgress = ({
  steps = [],
  completedSteps = [],
  onStepClick
}) => {
  const completionPercent = (completedSteps.length / steps.length) * 100;

  return (
    <div className="profile-progress">
      <div className="progress-header">
        <h4>Complete Your Profile</h4>
        <span className="progress-percent">{Math.round(completionPercent)}%</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="progress-steps">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);

          return (
            <button
              key={step.id}
              className={`progress-step ${isCompleted ? 'completed' : ''}`}
              onClick={() => onStepClick?.(step)}
            >
              <span className="step-icon">
                {isCompleted ? '✓' : step.icon}
              </span>
              <span className="step-label">{step.label}</span>
              {!isCompleted && (
                <span className="step-action">Add →</span>
              )}
            </button>
          );
        })}
      </div>

      {completionPercent < 100 && (
        <p className="progress-hint">
          Complete your profile to increase trust and get more ride requests!
        </p>
      )}
    </div>
  );
};

// First Time User Tip Tooltip
export const FirstTimeTip = ({
  children,
  tipId,
  message,
  position = 'bottom', // 'top', 'bottom', 'left', 'right'
  onDismiss
}) => {
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if tip was already dismissed
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '[]');
    if (dismissedTips.includes(tipId)) {
      setDismissed(true);
    }
  }, [tipId]);

  const handleDismiss = () => {
    setVisible(false);
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '[]');
    if (!dismissedTips.includes(tipId)) {
      localStorage.setItem('dismissedTips', JSON.stringify([...dismissedTips, tipId]));
    }
    onDismiss?.();
    setDismissed(true);
  };

  if (dismissed) {
    return children;
  }

  return (
    <div className="first-time-tip-wrapper">
      {children}
      {visible && (
        <div className={`first-time-tip ${position}`}>
          <div className="tip-content">
            <span className="tip-icon">💡</span>
            <span className="tip-message">{message}</span>
          </div>
          <button className="tip-dismiss" onClick={handleDismiss}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
};

// Spotlight/Highlight Component for tutorials
export const Spotlight = ({
  active,
  targetRef,
  message,
  step,
  totalSteps,
  onNext,
  onPrev,
  onDismiss
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (active && targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    }
  }, [active, targetRef]);

  if (!active) return null;

  return (
    <div className="spotlight-overlay">
      <div
        className="spotlight-hole"
        style={{
          top: position.top - 8,
          left: position.left - 8,
          width: position.width + 16,
          height: position.height + 16
        }}
      />
      <div
        className="spotlight-tooltip"
        style={{
          top: position.top + position.height + 16,
          left: position.left
        }}
      >
        <p className="spotlight-message">{message}</p>
        <div className="spotlight-nav">
          <span className="spotlight-step">
            {step} / {totalSteps}
          </span>
          <div className="spotlight-buttons">
            {step > 1 && (
              <button onClick={onPrev}>Back</button>
            )}
            {step < totalSteps ? (
              <button onClick={onNext}>Next</button>
            ) : (
              <button onClick={onDismiss}>Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Banner for new users
export const WelcomeBanner = ({
  userName,
  onStartTour,
  onDismiss
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="welcome-banner">
      <div className="welcome-content">
        <span className="welcome-emoji">👋</span>
        <div className="welcome-text">
          <h4>Welcome{userName ? `, ${userName}` : ''}!</h4>
          <p>New here? Take a quick tour to learn how carpooling works.</p>
        </div>
      </div>
      <div className="welcome-actions">
        <button className="welcome-btn primary" onClick={onStartTour}>
          Start Tour
        </button>
        <button
          className="welcome-btn secondary"
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

// Hook for tracking onboarding state
export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    localStorage.getItem('onboardingCompleted') === 'true'
  );
  const [showOnboarding, setShowOnboarding] = useState(false);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingCompleted');
    setHasCompletedOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    showOnboarding,
    completeOnboarding,
    startOnboarding,
    resetOnboarding,
    setShowOnboarding
  };
};

export default Onboarding;
