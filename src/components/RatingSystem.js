import React, { useState } from 'react';
import './RatingSystem.css';

// Star Rating Component - displays and allows input of ratings
export const StarRating = ({
  rating = 0,
  maxRating = 5,
  size = 'medium', // 'small', 'medium', 'large'
  interactive = false,
  onChange,
  showValue = false,
  reviewCount,
  label
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`star-rating ${size} ${interactive ? 'interactive' : ''}`}>
      {label && <span className="rating-label">{label}</span>}
      <div className="stars-container">
        {[...Array(maxRating)].map((_, index) => {
          const value = index + 1;
          const filled = value <= displayRating;
          const halfFilled = !filled && value - 0.5 <= displayRating;

          return (
            <span
              key={index}
              className={`star ${filled ? 'filled' : ''} ${halfFilled ? 'half-filled' : ''}`}
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              role={interactive ? 'button' : 'presentation'}
              tabIndex={interactive ? 0 : -1}
              onKeyDown={(e) => {
                if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                  handleClick(value);
                }
              }}
            >
              <svg viewBox="0 0 24 24" className="star-icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {halfFilled && (
                <svg viewBox="0 0 24 24" className="star-icon half">
                  <defs>
                    <linearGradient id="halfGradient">
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="url(#halfGradient)"
                  />
                </svg>
              )}
            </span>
          );
        })}
      </div>
      {(showValue || reviewCount !== undefined) && (
        <div className="rating-info">
          {showValue && <span className="rating-value">{rating.toFixed(1)}</span>}
          {reviewCount !== undefined && (
            <span className="review-count">({reviewCount} reviews)</span>
          )}
        </div>
      )}
    </div>
  );
};

// Quick feedback tags for reviews
const FEEDBACK_TAGS = {
  positive: [
    { id: 'punctual', label: 'Punctual', emoji: '⏰' },
    { id: 'friendly', label: 'Friendly', emoji: '😊' },
    { id: 'clean_car', label: 'Clean Car', emoji: '✨' },
    { id: 'good_driver', label: 'Good Driver', emoji: '🚗' },
    { id: 'great_conversation', label: 'Great Chat', emoji: '💬' },
    { id: 'comfortable', label: 'Comfortable', emoji: '🛋️' },
  ],
  negative: [
    { id: 'late', label: 'Was Late', emoji: '⌛' },
    { id: 'unfriendly', label: 'Unfriendly', emoji: '😐' },
    { id: 'messy_car', label: 'Messy Car', emoji: '🗑️' },
    { id: 'unsafe_driving', label: 'Unsafe Driving', emoji: '⚠️' },
    { id: 'no_show', label: 'No Show', emoji: '❌' },
  ]
};

// Feedback Tag Selector
export const FeedbackTags = ({
  type = 'positive',
  selected = [],
  onChange,
  maxSelections = 3
}) => {
  const tags = FEEDBACK_TAGS[type] || FEEDBACK_TAGS.positive;

  const handleTagClick = (tagId) => {
    if (!onChange) return;

    if (selected.includes(tagId)) {
      onChange(selected.filter(id => id !== tagId));
    } else if (selected.length < maxSelections) {
      onChange([...selected, tagId]);
    }
  };

  return (
    <div className={`feedback-tags ${type}`}>
      <div className="tags-header">
        <span className="tags-title">
          {type === 'positive' ? 'What went well?' : 'What could improve?'}
        </span>
        <span className="tags-hint">Select up to {maxSelections}</span>
      </div>
      <div className="tags-list">
        {tags.map((tag) => (
          <button
            key={tag.id}
            className={`feedback-tag ${selected.includes(tag.id) ? 'selected' : ''}`}
            onClick={() => handleTagClick(tag.id)}
            disabled={!selected.includes(tag.id) && selected.length >= maxSelections}
          >
            <span className="tag-emoji">{tag.emoji}</span>
            <span className="tag-label">{tag.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Review Card for displaying a single review
export const ReviewCard = ({
  reviewer,
  rating,
  date,
  comment,
  tags = [],
  rideDetails,
  isDriver = false
}) => {
  const positiveTagLabels = tags
    .filter(id => FEEDBACK_TAGS.positive.find(t => t.id === id))
    .map(id => {
      const tag = FEEDBACK_TAGS.positive.find(t => t.id === id);
      return tag ? `${tag.emoji} ${tag.label}` : null;
    })
    .filter(Boolean);

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {reviewer?.avatar || reviewer?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="reviewer-details">
            <span className="reviewer-name">{reviewer?.name || 'Anonymous'}</span>
            {isDriver && <span className="reviewer-role">Driver</span>}
          </div>
        </div>
        <div className="review-meta">
          <StarRating rating={rating} size="small" />
          {date && (
            <span className="review-date">
              {new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>

      {comment && (
        <p className="review-comment">{comment}</p>
      )}

      {positiveTagLabels.length > 0 && (
        <div className="review-tags">
          {positiveTagLabels.map((label, index) => (
            <span key={index} className="review-tag">{label}</span>
          ))}
        </div>
      )}

      {rideDetails && (
        <div className="review-ride-info">
          <span className="ride-route">
            📍 {rideDetails.from} → {rideDetails.to}
          </span>
          {rideDetails.date && (
            <span className="ride-date">
              {new Date(rideDetails.date).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Rating Summary Component
export const RatingSummary = ({
  averageRating,
  totalReviews,
  breakdown = {} // { 5: count, 4: count, ... }
}) => {
  const maxCount = Math.max(...Object.values(breakdown), 1);

  return (
    <div className="rating-summary">
      <div className="rating-overview">
        <div className="rating-big">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <StarRating rating={averageRating} size="small" />
          <span className="total-reviews">{totalReviews} reviews</span>
        </div>
      </div>

      <div className="rating-breakdown">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = breakdown[stars] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={stars} className="breakdown-row">
              <span className="breakdown-stars">{stars}★</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="breakdown-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Full Review Form
export const ReviewForm = ({
  onSubmit,
  onCancel,
  recipientName,
  rideDetails
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [positiveTags, setPositiveTags] = useState([]);
  const [negativeTags, setNegativeTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        comment,
        tags: [...positiveTags, ...negativeTags],
        positiveTags,
        negativeTags
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form-header">
        <h3>Rate your ride</h3>
        {recipientName && (
          <p>How was your experience with {recipientName}?</p>
        )}
      </div>

      <div className="review-form-section">
        <StarRating
          rating={rating}
          interactive={true}
          onChange={setRating}
          size="large"
          label="Overall Rating"
        />
      </div>

      {rating > 0 && (
        <>
          <div className="review-form-section">
            <FeedbackTags
              type={rating >= 3 ? 'positive' : 'negative'}
              selected={rating >= 3 ? positiveTags : negativeTags}
              onChange={rating >= 3 ? setPositiveTags : setNegativeTags}
            />
          </div>

          <div className="review-form-section">
            <label className="form-label">Additional Comments (Optional)</label>
            <textarea
              className="review-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share more about your experience..."
              rows={3}
              maxLength={500}
            />
            <span className="char-count">{comment.length}/500</span>
          </div>
        </>
      )}

      <div className="review-form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary"
          disabled={rating === 0 || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};

// User Rating Badge (for displaying on profiles/cards)
export const UserRatingBadge = ({ rating, totalRides, size = 'medium' }) => {
  if (!rating || totalRides === 0) {
    return (
      <div className={`user-rating-badge ${size} no-rating`}>
        <span className="badge-label">New</span>
      </div>
    );
  }

  return (
    <div className={`user-rating-badge ${size}`}>
      <span className="badge-star">★</span>
      <span className="badge-rating">{rating.toFixed(1)}</span>
      {totalRides && <span className="badge-rides">({totalRides})</span>}
    </div>
  );
};

export default {
  StarRating,
  FeedbackTags,
  ReviewCard,
  RatingSummary,
  ReviewForm,
  UserRatingBadge,
  FEEDBACK_TAGS
};
