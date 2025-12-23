import React, { useState, useEffect, useRef } from 'react';
import './SearchFilters.css';

// Sort options for rides
const SORT_OPTIONS = [
  { id: 'departure_time', label: 'Departure Time', icon: '🕐' },
  { id: 'seats_available', label: 'Seats Available', icon: '💺' },
  { id: 'distance', label: 'Distance', icon: '📍' },
  { id: 'price_low', label: 'Price: Low to High', icon: '💰' },
  { id: 'price_high', label: 'Price: High to Low', icon: '💵' },
  { id: 'rating', label: 'Highest Rated', icon: '⭐' },
  { id: 'newest', label: 'Most Recent', icon: '🆕' },
];

// Filter categories
const FILTER_CATEGORIES = {
  tripType: {
    label: 'Trip Type',
    icon: '🔄',
    options: [
      { id: 'going', label: 'Going Only' },
      { id: 'return', label: 'Return Only' },
      { id: 'both', label: 'Round Trip' }
    ]
  },
  seats: {
    label: 'Seats Needed',
    icon: '💺',
    options: [
      { id: '1', label: '1 Seat' },
      { id: '2', label: '2 Seats' },
      { id: '3', label: '3 Seats' },
      { id: '4+', label: '4+ Seats' }
    ]
  },
  preference: {
    label: 'Preference',
    icon: '👥',
    options: [
      { id: 'any', label: 'Any' },
      { id: 'male', label: 'Male Only' },
      { id: 'female', label: 'Female Only' }
    ]
  },
  payment: {
    label: 'Payment',
    icon: '💳',
    options: [
      { id: 'free', label: 'Free' },
      { id: 'optional', label: 'Optional Payment' },
      { id: 'required', label: 'Payment Required' }
    ]
  },
  time: {
    label: 'Time',
    icon: '⏰',
    options: [
      { id: 'morning', label: 'Morning (6-12)' },
      { id: 'afternoon', label: 'Afternoon (12-18)' },
      { id: 'evening', label: 'Evening (18-24)' },
      { id: 'night', label: 'Night (0-6)' }
    ]
  }
};

// Sort Dropdown Component
export const SortDropdown = ({
  value,
  onChange,
  options = SORT_OPTIONS
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sort-dropdown" ref={dropdownRef}>
      <button
        className={`sort-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sort-icon">{selectedOption.icon}</span>
        <span className="sort-label">{selectedOption.label}</span>
        <span className="sort-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="sort-menu">
          {options.map((option) => (
            <button
              key={option.id}
              className={`sort-option ${value === option.id ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
              {value === option.id && <span className="option-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter Chip Component
export const FilterChip = ({
  label,
  icon,
  active,
  onClick,
  onRemove,
  removable = false
}) => (
  <button
    className={`filter-chip ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {icon && <span className="chip-icon">{icon}</span>}
    <span className="chip-label">{label}</span>
    {removable && active && (
      <span
        className="chip-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
      >
        ×
      </span>
    )}
  </button>
);

// Active Filters Bar
export const ActiveFilters = ({
  filters = {},
  onRemove,
  onClearAll
}) => {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value);

  if (activeFilters.length === 0) return null;

  const getFilterLabel = (key, value) => {
    const category = FILTER_CATEGORIES[key];
    if (!category) return `${key}: ${value}`;

    const option = category.options.find(opt => opt.id === value);
    return option ? option.label : value;
  };

  return (
    <div className="active-filters">
      <div className="active-filters-list">
        {activeFilters.map(([key, value]) => (
          <FilterChip
            key={key}
            label={getFilterLabel(key, value)}
            icon={FILTER_CATEGORIES[key]?.icon}
            active
            removable
            onRemove={() => onRemove(key)}
          />
        ))}
      </div>
      <button className="clear-all-btn" onClick={onClearAll}>
        Clear All
      </button>
    </div>
  );
};

// Filter Panel/Modal
export const FilterPanel = ({
  isOpen,
  onClose,
  filters = {},
  onChange,
  onApply,
  onReset
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleChange = (category, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [category]: prev[category] === value ? null : value
    }));
  };

  const handleApply = () => {
    onChange?.(localFilters);
    onApply?.();
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset?.();
  };

  const activeCount = Object.values(localFilters).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="filter-panel-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={e => e.stopPropagation()}>
        <div className="filter-panel-header">
          <h3>Filter Rides</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="filter-panel-body">
          {Object.entries(FILTER_CATEGORIES).map(([key, category]) => (
            <div key={key} className="filter-section">
              <h4 className="filter-section-title">
                <span className="section-icon">{category.icon}</span>
                {category.label}
              </h4>
              <div className="filter-options">
                {category.options.map((option) => (
                  <button
                    key={option.id}
                    className={`filter-option ${localFilters[key] === option.id ? 'selected' : ''}`}
                    onClick={() => handleChange(key, option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="filter-panel-footer">
          <button className="reset-btn" onClick={handleReset}>
            Reset Filters
          </button>
          <button className="apply-btn" onClick={handleApply}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Filters Bar (horizontal scroll)
export const QuickFilters = ({
  filters = {},
  onChange,
  showSort = true,
  sortValue,
  onSortChange,
  onOpenAdvanced
}) => {
  const quickFilterOptions = [
    { id: 'free', label: 'Free', icon: '🆓', filterKey: 'payment', filterValue: 'free' },
    { id: 'going', label: 'Going', icon: '➡️', filterKey: 'tripType', filterValue: 'going' },
    { id: 'return', label: 'Return', icon: '⬅️', filterKey: 'tripType', filterValue: 'return' },
    { id: 'seats_2plus', label: '2+ Seats', icon: '💺', filterKey: 'seats', filterValue: '2' },
    { id: 'female_only', label: 'Women Only', icon: '👩', filterKey: 'preference', filterValue: 'female' },
    { id: 'male_only', label: 'Men Only', icon: '👨', filterKey: 'preference', filterValue: 'male' },
  ];

  const toggleFilter = (filterKey, filterValue) => {
    onChange({
      ...filters,
      [filterKey]: filters[filterKey] === filterValue ? null : filterValue
    });
  };

  return (
    <div className="quick-filters">
      <div className="quick-filters-scroll">
        {onOpenAdvanced && (
          <button className="filter-toggle-btn" onClick={onOpenAdvanced}>
            <span className="toggle-icon">⚙️</span>
            <span className="toggle-label">Filters</span>
          </button>
        )}

        {quickFilterOptions.map((option) => (
          <FilterChip
            key={option.id}
            label={option.label}
            icon={option.icon}
            active={filters[option.filterKey] === option.filterValue}
            onClick={() => toggleFilter(option.filterKey, option.filterValue)}
          />
        ))}
      </div>

      {showSort && (
        <SortDropdown value={sortValue} onChange={onSortChange} />
      )}
    </div>
  );
};

// Search Input with filters
export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search rides...',
  onClear
}) => {
  return (
    <div className="search-input-container">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className="clear-search" onClick={onClear}>
          ×
        </button>
      )}
    </div>
  );
};

// Combined Search and Filter Bar
export const SearchFilterBar = ({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  sortValue,
  onSortChange
}) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  return (
    <div className="search-filter-bar">
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        onClear={() => onSearchChange('')}
      />

      <QuickFilters
        filters={filters}
        onChange={onFiltersChange}
        sortValue={sortValue}
        onSortChange={onSortChange}
        onOpenAdvanced={() => setShowFilterPanel(true)}
      />

      <ActiveFilters
        filters={filters}
        onRemove={(key) => onFiltersChange({ ...filters, [key]: null })}
        onClearAll={() => onFiltersChange({})}
      />

      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={filters}
        onChange={onFiltersChange}
        onReset={() => onFiltersChange({})}
      />
    </div>
  );
};

// Hook for managing filters and sort
export const useFiltersAndSort = (initialFilters = {}, initialSort = 'departure_time') => {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [search, setSearch] = useState('');

  const clearFilters = () => setFilters({});

  const removeFilter = (key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const applyFilters = (items, filterFn) => {
    if (!items) return [];

    let filtered = [...items];

    // Apply search
    if (search) {
      filtered = filtered.filter(item => filterFn(item, search));
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          switch (key) {
            case 'tripType':
              return item.trip_type === value || item.tripType === value;
            case 'seats':
              const seats = parseInt(item.available_seats || item.seats || 0);
              if (value === '4+') return seats >= 4;
              return seats >= parseInt(value);
            case 'preference':
              return item.preference === value || value === 'any';
            case 'payment':
              if (value === 'free') return item.payment_required === 'not_required';
              if (value === 'optional') return item.payment_required === 'optional';
              if (value === 'required') return item.payment_required === 'obligatory';
              return true;
            default:
              return true;
          }
        });
      }
    });

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'seats_available':
          return (b.available_seats || 0) - (a.available_seats || 0);
        case 'price_low':
          return (parseFloat(a.payment_amount) || 0) - (parseFloat(b.payment_amount) || 0);
        case 'price_high':
          return (parseFloat(b.payment_amount) || 0) - (parseFloat(a.payment_amount) || 0);
        case 'rating':
          return (b.driver_rating || 0) - (a.driver_rating || 0);
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  return {
    filters,
    setFilters,
    sort,
    setSort,
    search,
    setSearch,
    clearFilters,
    removeFilter,
    applyFilters,
    activeFilterCount: Object.values(filters).filter(Boolean).length
  };
};

export default {
  SortDropdown,
  FilterChip,
  ActiveFilters,
  FilterPanel,
  QuickFilters,
  SearchInput,
  SearchFilterBar,
  useFiltersAndSort,
  SORT_OPTIONS,
  FILTER_CATEGORIES
};
