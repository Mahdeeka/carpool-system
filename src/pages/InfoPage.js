import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Color palette
const colors = {
  primary: '#0B2A4A',
  primaryHover: '#071F36',
  accent: '#0EA5E9',
  accentSoft: '#E0F2FE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0B1220',
  muted: '#4B5563',
  border: '#E5E7EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

function InfoPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const testimonialsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollToSection = (id) => {
    setMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleJoinEvent = () => {
    if (eventCode.trim()) {
      navigate(`/event/${eventCode.trim()}`);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e, maxIndex) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveTestimonial((prev) => Math.min(prev + 1, maxIndex));
      } else {
        setActiveTestimonial((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const valueProps = [
    { icon: '🎯', title: 'Event-Centric', desc: 'Built for weddings, conferences, meetups & more', color: colors.accent },
    { icon: '🤝', title: 'Trust First', desc: 'Ride with people going to the same event', color: colors.success },
    { icon: '💬', title: 'Connect Instantly', desc: 'One-tap WhatsApp & calling', color: colors.warning },
    { icon: '🗺️', title: 'Smart Matching', desc: 'Optimal routes, minimal detours', color: '#8B5CF6' },
    { icon: '🔒', title: 'Privacy Controls', desc: 'Share only what you want', color: '#EC4899' },
    { icon: '📱', title: 'No App Needed', desc: 'Works in any browser', color: colors.accent },
  ];

  const steps = [
    { icon: '📝', title: 'Create', desc: 'Set up your event' },
    { icon: '📤', title: 'Share', desc: 'Send the link' },
    { icon: '🚗', title: 'Match', desc: 'Find your ride' },
    { icon: '✅', title: 'Go!', desc: 'Travel together' },
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      event: 'Wedding Guest',
      avatar: 'SM',
      color: '#0EA5E9',
      text: 'Met my future business partner on the drive to a friend\'s wedding. 2 hours of great conversation!',
    },
    {
      name: 'David K.',
      event: 'Conference Attendee',
      avatar: 'DK',
      color: '#22C55E',
      text: 'Saved ₪200 on parking and made 3 new industry connections before the event started.',
    },
    {
      name: 'Maya R.',
      event: 'Event Organizer',
      avatar: 'MR',
      color: '#8B5CF6',
      text: 'As an organizer, trempi solved our parking nightmare. 40% fewer cars!',
    },
  ];

  const impacts = [
    { icon: '💰', value: '50%', label: 'Cost savings' },
    { icon: '🚗', value: '40%', label: 'Fewer cars' },
    { icon: '🌱', value: '2.5kg', label: 'CO₂ saved' },
    { icon: '⏱️', value: '∞', label: 'Connections' },
  ];

  return (
    <div style={styles.page}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
      
      {/* CSS Animations & Responsive */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-in { 
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
          opacity: 0;
        }
        .animate-in-delay-1 { animation-delay: 0.1s; }
        .animate-in-delay-2 { animation-delay: 0.2s; }
        .animate-in-delay-3 { animation-delay: 0.3s; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse { animation: pulse 2.5s ease-in-out infinite; }
        
        html { 
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: transparent;
        }
        
        * { box-sizing: border-box; }
        
        input { font-family: inherit; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .touch-active { transition: transform 0.12s ease, opacity 0.12s ease; }
        .touch-active:active { transform: scale(0.97); opacity: 0.9; }
        
        .gradient-text {
          background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
          .features-grid { 
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
          }
          .hero-container {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 60px !important;
            align-items: center !important;
            text-align: left !important;
          }
          .hero-content { text-align: left !important; }
          .hero-buttons { justify-content: flex-start !important; }
          .stats-row { justify-content: flex-start !important; }
          .steps-container { 
            flex-direction: row !important;
            justify-content: space-between !important;
          }
          .step-connector { 
            width: 60px !important;
            height: 2px !important;
            position: absolute !important;
            right: -35px !important;
            top: 26px !important;
          }
          .step-item { flex-direction: column !important; text-align: center !important; }
          .trust-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .impact-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .testimonial-grid { 
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
          }
          .network-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 60px !important;
            align-items: center !important;
          }
          .section-wide { max-width: 1200px !important; margin: 0 auto !important; }
          .cta-buttons { flex-direction: row !important; }
          .footer-grid {
            display: grid !important;
            grid-template-columns: 2fr 1fr 1fr 1fr !important;
            gap: 40px !important;
            text-align: left !important;
          }
          .footer-links-desktop { 
            display: flex !important; 
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        ...styles.nav,
        ...(scrolled ? styles.navScrolled : {}),
      }}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => navigate('/')}>
            <div style={styles.logoIcon}>🚗</div>
            <span>trempi</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="desktop-only" style={styles.navLinks}>
            <button style={styles.navLink} onClick={() => scrollToSection('features')}>Features</button>
            <button style={styles.navLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button style={styles.navLink} onClick={() => scrollToSection('trust')}>Trust</button>
            <button style={styles.navCta} onClick={() => navigate('/create-event')}>Create Event</button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="mobile-only touch-active"
            style={styles.menuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div style={{
              ...styles.menuLine,
              transform: menuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
            }} />
            <div style={{
              ...styles.menuLine,
              opacity: menuOpen ? 0 : 1,
              transform: menuOpen ? 'scaleX(0)' : 'scaleX(1)',
            }} />
            <div style={{
              ...styles.menuLine,
              transform: menuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none',
            }} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className="mobile-only"
        style={{
          ...styles.mobileMenu,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
        onClick={() => setMenuOpen(false)}
      >
        <div 
          style={{
            ...styles.mobileMenuContent,
            transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.98)',
            opacity: menuOpen ? 1 : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: '⚡', label: 'Features', id: 'features' },
            { icon: '📋', label: 'How It Works', id: 'how-it-works' },
            { icon: '🛡️', label: 'Trust & Safety', id: 'trust' },
            { icon: '🌟', label: 'Networking', id: 'networking' },
          ].map((item, i) => (
            <button 
              key={i}
              style={styles.mobileMenuItem} 
              onClick={() => scrollToSection(item.id)}
              className="touch-active"
            >
              <span style={styles.mobileMenuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div style={styles.mobileMenuDivider} />
          <button 
            style={styles.mobileMenuCta}
            onClick={() => { setMenuOpen(false); navigate('/create-event'); }}
            className="touch-active"
          >
            ✨ Create Event
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroDecor1} className="animate-float" />
        <div style={styles.heroDecor2} />
        
        <div style={styles.heroContainer} className="hero-container">
          <div style={styles.heroContent} className="hero-content">
            <div style={styles.heroTag} className="animate-in">
              <span>✨</span>
              <span>Smarter rides for better events</span>
            </div>
            
            <h1 style={styles.heroTitle} className="animate-in animate-in-delay-1">
              Your Event.<br />
              <span className="gradient-text">Your Community.</span><br />
              One Ride.
            </h1>
            
            <p style={styles.heroSubtitle} className="animate-in animate-in-delay-2">
              Turn every journey into an opportunity. Connect with fellow attendees, share experiences, and arrive together.
            </p>

            {/* Event Code Input */}
            <div style={styles.heroInputWrapper} className="animate-in animate-in-delay-3">
              <div style={styles.heroInputContainer}>
                <span style={styles.heroInputIcon}>🔗</span>
                <input
                  type="text"
                  placeholder="Enter event code"
                  style={styles.heroInput}
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
                />
                <button 
                  style={styles.heroInputBtn}
                  onClick={handleJoinEvent}
                  className="touch-active"
                >
                  Join
                </button>
              </div>
              <button 
                style={styles.heroCreateBtn}
                onClick={() => navigate('/create-event')}
                className="touch-active"
              >
                <span>✨</span> Create New Event
              </button>
            </div>

            {/* Stats */}
            <div style={styles.statsRow} className="hide-scrollbar stats-row">
              {[
                { value: '100%', label: 'Free' },
                { value: '30s', label: 'Setup' },
                { value: '0', label: 'Downloads' },
              ].map((stat, i) => (
                <div key={i} style={styles.statPill}>
                  <span style={styles.statValue}>{stat.value}</span>
                  <span style={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div style={styles.heroVisual} className="animate-in animate-in-delay-2">
            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <span style={styles.previewDot} />
                <span style={styles.previewTitle}>🎉 Wedding - Sarah & Mike</span>
                <span style={styles.previewBadge}>6 rides</span>
              </div>
              
              <div style={{...styles.ridePreview, ...styles.ridePreviewActive}}>
                <div style={styles.rideAvatar}>DK</div>
                <div style={styles.rideInfo}>
                  <div style={styles.rideName}>David K. <span style={styles.verifiedBadge}>✓</span></div>
                  <div style={styles.rideRoute}>Tel Aviv → Haifa • 4:30 PM</div>
                </div>
                <div style={styles.rideSeats}>
                  <span style={styles.seatFilled}>👤</span>
                  <span style={styles.seatFilled}>👤</span>
                  <span style={styles.seatEmpty}>+</span>
                </div>
              </div>
              
              <div style={styles.ridePreview}>
                <div style={{ ...styles.rideAvatar, background: `linear-gradient(135deg, ${colors.success}, #16A34A)` }}>RL</div>
                <div style={styles.rideInfo}>
                  <div style={styles.rideName}>Rachel L. <span style={styles.verifiedBadge}>✓</span></div>
                  <div style={styles.rideRoute}>Jerusalem → Haifa • 3:00 PM</div>
                </div>
                <div style={styles.rideSeats}>
                  <span style={styles.seatFilled}>👤</span>
                  <span style={styles.seatEmpty}>+</span>
                  <span style={styles.seatEmpty}>+</span>
                </div>
              </div>
              
              <div style={styles.previewFooter}>
                <span style={styles.previewFooterText}>👆 Tap to request a seat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Horizontal Scroll */}
      <section style={styles.trustBadges}>
        <div style={styles.trustBadgesInner} className="hide-scrollbar">
          {[
            { icon: '✓', text: 'Verified Profiles', color: colors.success },
            { icon: '🔒', text: 'Privacy First', color: colors.accent },
            { icon: '⚡', text: 'Instant Match', color: colors.warning },
            { icon: '⭐', text: 'Rated Drivers', color: '#8B5CF6' },
          ].map((badge, i) => (
            <div key={i} style={styles.trustBadge}>
              <span style={{...styles.trustBadgeIcon, background: `${badge.color}20`, color: badge.color}}>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>⚡ Features</span>
          <h2 style={styles.sectionTitle}>Everything You Need</h2>
          <p style={styles.sectionSubtitle}>Powerful features for seamless carpooling</p>
        </div>

        <div style={styles.featuresGrid} className="features-grid">
          {valueProps.map((prop, idx) => (
            <div 
              key={idx} 
              style={styles.featureCard}
              className="touch-active"
            >
              <div style={{ ...styles.featureIcon, background: `${prop.color}15` }}>
                <span style={{ fontSize: '28px' }}>{prop.icon}</span>
              </div>
              <h3 style={styles.featureTitle}>{prop.title}</h3>
              <p style={styles.featureDesc}>{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ ...styles.section, background: colors.surface }}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionTag, background: `${colors.warning}15`, color: colors.warning }}>📋 How It Works</span>
          <h2 style={styles.sectionTitle}>4 Simple Steps</h2>
          <p style={styles.sectionSubtitle}>Get started in under a minute</p>
        </div>

        <div style={styles.stepsContainer} className="steps-container section-wide">
          {steps.map((step, idx) => (
            <div key={idx} style={styles.stepItem} className="step-item">
              <div style={styles.stepIconWrapper}>
                <div style={styles.stepIcon} className="animate-pulse">{step.icon}</div>
                {idx < steps.length - 1 && <div style={styles.stepConnector} className="step-connector" />}
              </div>
              <div style={styles.stepContent}>
                <h4 style={styles.stepTitle}>{step.title}</h4>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" style={{ ...styles.section, background: colors.primary, color: '#fff' }}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionTag, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>🛡️ Trust & Safety</span>
          <h2 style={{ ...styles.sectionTitle, color: '#fff' }}>Ride with Confidence</h2>
          <p style={{ ...styles.sectionSubtitle, color: 'rgba(255,255,255,0.7)' }}>
            Everyone's going to the same event – trust is built-in
          </p>
        </div>

        <div style={styles.trustGrid} className="trust-grid section-wide">
          {[
            { icon: '👥', title: 'Mutual Connections', desc: 'See shared friends' },
            { icon: '⭐', title: 'Driver Ratings', desc: 'Real reviews' },
            { icon: '✓', title: 'Verified Profiles', desc: 'Phone verification' },
            { icon: '📍', title: 'Live Updates', desc: 'Share your route' },
          ].map((item, idx) => (
            <div key={idx} style={styles.trustItem} className="touch-active">
              <div style={styles.trustItemIcon}>{item.icon}</div>
              <div>
                <h4 style={styles.trustItemTitle}>{item.title}</h4>
                <p style={styles.trustItemDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Preview */}
        <div style={styles.profilePreview}>
          <div style={styles.profileHeader}>
            <div style={styles.profileAvatar}>DK</div>
            <div style={styles.profileInfo}>
              <div style={styles.profileName}>David K.</div>
              <div style={styles.profileVerified}>✓ Verified Driver</div>
            </div>
            <div style={styles.profileRating}>
              <span>⭐</span> 4.9
            </div>
          </div>
          <div style={styles.profileStats}>
            <div style={styles.profileStat}>
              <div style={styles.profileStatNum}>47</div>
              <div style={styles.profileStatLabel}>Rides</div>
            </div>
            <div style={styles.profileStat}>
              <div style={styles.profileStatNum}>12</div>
              <div style={styles.profileStatLabel}>Events</div>
            </div>
            <div style={styles.profileStat}>
              <div style={styles.profileStatNum}>100%</div>
              <div style={styles.profileStatLabel}>On-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Networking Section */}
      <section id="networking" style={styles.section}>
        <div className="network-grid section-wide">
          <div style={styles.networkContent}>
            <span style={{ ...styles.sectionTag, background: `${colors.success}15`, color: colors.success }}>🌟 Networking</span>
            <h2 style={{...styles.sectionTitle, marginBottom: '12px'}}>Networking Starts<br/>in Your Car</h2>
            <p style={{...styles.sectionSubtitle, textAlign: 'left', margin: '0 0 24px'}}>
              The best connections happen in unexpected places. A 45-minute drive can lead to partnerships and friendships.
            </p>
            
            {/* Benefits List */}
            <div style={styles.benefitsList}>
              {[
                { icon: '🎯', title: 'Shared Interests', desc: 'Common ground is built-in' },
                { icon: '⏰', title: 'Quality Time', desc: 'Real conversations that go somewhere' },
                { icon: '🤝', title: 'Warm Intros', desc: 'Arrive with someone to introduce you' },
              ].map((item, idx) => (
                <div key={idx} style={styles.benefitItem} className="touch-active">
                  <div style={styles.benefitIcon}>{item.icon}</div>
                  <div>
                    <h4 style={styles.benefitTitle}>{item.title}</h4>
                    <p style={styles.benefitDesc}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Preview */}
          <div style={styles.chatPreview}>
            <div style={styles.chatBubbleIn}>
              Hey! I see you're heading to the startup meetup too 🚀
            </div>
            <div style={styles.chatBubbleOut}>
              Yes! I'm in product design. What are you working on?
            </div>
            <div style={styles.chatBubbleIn}>
              Building a fintech app! Would love to hear your thoughts on the UX
            </div>
            <div style={styles.chatBubbleOut}>
              Perfect timing! Let's grab coffee after too ☕
            </div>
            <div style={styles.chatMeta}>
              <span>💡</span>
              <span>Connection made 45 min before event</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ ...styles.section, background: colors.surface, paddingBottom: '40px' }}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionTag, background: '#8B5CF615', color: '#8B5CF6' }}>💬 Stories</span>
          <h2 style={styles.sectionTitle}>Real Connections</h2>
          <p style={styles.sectionSubtitle}>Every ride is an opportunity</p>
        </div>

        {/* Mobile Carousel */}
        <div 
          className="mobile-only"
          style={styles.testimonialCarousel}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(e, testimonials.length - 1)}
        >
          <div style={{
            ...styles.testimonialTrack,
            transform: `translateX(-${activeTestimonial * 100}%)`,
          }}>
            {testimonials.map((t, idx) => (
              <div key={idx} style={styles.testimonialSlide}>
                <div style={styles.testimonialCard}>
                  <div style={styles.testimonialStars}>★★★★★</div>
                  <p style={styles.testimonialText}>"{t.text}"</p>
                  <div style={styles.testimonialAuthor}>
                    <div style={{ ...styles.testimonialAvatar, background: t.color }}>{t.avatar}</div>
                    <div>
                      <div style={styles.testimonialName}>{t.name}</div>
                      <div style={styles.testimonialEvent}>{t.event}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dots */}
          <div style={styles.dotsContainer}>
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.dot,
                  ...(idx === activeTestimonial ? styles.dotActive : {}),
                }}
                onClick={() => setActiveTestimonial(idx)}
              />
            ))}
          </div>
        </div>
        
        {/* Desktop Grid */}
        <div className="desktop-only testimonial-grid" style={styles.testimonialGridDesktop}>
          {testimonials.map((t, idx) => (
            <div key={idx} style={styles.testimonialCard}>
              <div style={styles.testimonialStars}>★★★★★</div>
              <p style={styles.testimonialText}>"{t.text}"</p>
              <div style={styles.testimonialAuthor}>
                <div style={{ ...styles.testimonialAvatar, background: t.color }}>{t.avatar}</div>
                <div>
                  <div style={styles.testimonialName}>{t.name}</div>
                  <div style={styles.testimonialEvent}>{t.event}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Stats */}
      <section style={{ ...styles.section, background: colors.accentSoft }}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionTag, background: '#fff' }}>🌍 Impact</span>
          <h2 style={styles.sectionTitle}>Better for Everyone</h2>
          <p style={styles.sectionSubtitle}>Good for you, your community, and the planet</p>
        </div>

        <div style={styles.impactGrid} className="impact-grid section-wide">
          {impacts.map((item, idx) => (
            <div key={idx} style={styles.impactCard} className="touch-active">
              <div style={styles.impactIcon}>{item.icon}</div>
              <div style={styles.impactValue}>{item.value}</div>
              <div style={styles.impactLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Ride Together?</h2>
        <p style={styles.ctaSubtitle}>
          Join the community making every journey count
        </p>
        
        <div style={styles.ctaButtons} className="cta-buttons">
          <button 
            style={styles.ctaPrimary}
            onClick={() => navigate('/create-event')}
            className="touch-active"
          >
            <span>✨</span> Create Event
          </button>
          <button 
            style={styles.ctaSecondary}
            onClick={() => navigate('/')}
            className="touch-active"
          >
            <span>🔗</span> Join Event
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div className="footer-grid section-wide" style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>
              <div style={{...styles.logoIcon, width: '28px', height: '28px', fontSize: '14px'}}>🚗</div>
              <span>trempi</span>
            </div>
            <p style={styles.footerTagline}>
              Making every event journey a chance to connect, share, and arrive together.
            </p>
          </div>
          
          <div className="desktop-only footer-links-desktop">
            <div style={styles.footerColTitle}>Product</div>
            <button style={styles.footerLink} onClick={() => scrollToSection('features')}>Features</button>
            <button style={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button style={styles.footerLink} onClick={() => navigate('/create-event')}>Create Event</button>
          </div>
          
          <div className="desktop-only footer-links-desktop">
            <div style={styles.footerColTitle}>Resources</div>
            <button style={styles.footerLink}>Help Center</button>
            <button style={styles.footerLink}>Safety</button>
            <button style={styles.footerLink}>Community</button>
          </div>
          
          <div className="desktop-only footer-links-desktop">
            <div style={styles.footerColTitle}>Company</div>
            <button style={styles.footerLink}>About</button>
            <button style={styles.footerLink}>Contact</button>
            <button style={styles.footerLink}>Privacy</button>
          </div>
        </div>
        
        {/* Mobile Footer Links */}
        <div className="mobile-only" style={styles.footerLinksMobile}>
          <button style={styles.footerLink} onClick={() => scrollToSection('features')}>Features</button>
          <button style={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
          <button style={styles.footerLink} onClick={() => scrollToSection('trust')}>Trust</button>
          <button style={styles.footerLink} onClick={() => navigate('/create-event')}>Create</button>
        </div>
        
        <div style={styles.footerBottom}>
          <p>© {new Date().getFullYear()} Trempi. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating CTA - Mobile Only */}
      <div className="mobile-only" style={{
        ...styles.floatingCta,
        transform: scrolled ? 'translateY(0)' : 'translateY(100px)',
        opacity: scrolled ? 1 : 0,
      }}>
        <button 
          style={styles.floatingBtn}
          onClick={() => navigate('/create-event')}
          className="touch-active"
        >
          <span>✨</span> Create Event
        </button>
      </div>
    </div>
  );
}

// Mobile-first styles
const styles = {
  page: {
    minHeight: '100vh',
    background: colors.background,
    color: colors.text,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  // Navigation
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '12px 20px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  navScrolled: {
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
  },
  navInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.primary,
    cursor: 'pointer',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: `0 4px 12px ${colors.accent}40`,
  },
  navLinks: {
    display: 'flex',
    gap: '28px',
    alignItems: 'center',
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: colors.muted,
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '8px 4px',
    transition: 'color 0.2s',
  },
  navCta: {
    background: colors.primary,
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: `0 4px 12px ${colors.primary}30`,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    padding: '10px',
    margin: '-10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 1001,
  },
  menuLine: {
    width: '26px',
    height: '2.5px',
    background: colors.primary,
    borderRadius: '2px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'center',
  },

  // Mobile Menu
  mobileMenu: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(248, 250, 252, 0.98)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease',
  },
  mobileMenuContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '24px',
    width: '100%',
    maxWidth: '320px',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  mobileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    padding: '18px 20px',
    fontSize: '17px',
    fontWeight: 500,
    color: colors.text,
    cursor: 'pointer',
    borderRadius: '14px',
    transition: 'all 0.2s',
  },
  mobileMenuIcon: {
    fontSize: '20px',
  },
  mobileMenuDivider: {
    height: '1px',
    background: colors.border,
    margin: '12px 0',
  },
  mobileMenuCta: {
    background: colors.primary,
    color: '#fff',
    border: 'none',
    padding: '18px 24px',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 8px 24px ${colors.primary}30`,
  },

  // Hero
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '100px 20px 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    top: '-80px',
    right: '-80px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.accentSoft} 0%, rgba(14, 165, 233, 0.1) 100%)`,
    filter: 'blur(40px)',
    opacity: 0.9,
  },
  heroDecor2: {
    position: 'absolute',
    bottom: '120px',
    left: '-60px',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: `${colors.success}15`,
    filter: 'blur(50px)',
  },
  heroContainer: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  heroContent: {
    textAlign: 'center',
  },
  heroTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.accentSoft,
    padding: '10px 16px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 600,
    color: colors.accent,
    marginBottom: '24px',
    boxShadow: `0 2px 8px ${colors.accent}15`,
  },
  heroTitle: {
    fontSize: 'clamp(2.25rem, 10vw, 4rem)',
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: '20px',
    letterSpacing: '-1.5px',
  },
  heroSubtitle: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    color: colors.muted,
    lineHeight: 1.6,
    marginBottom: '32px',
    maxWidth: '500px',
    margin: '0 auto 32px',
  },
  heroInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
    maxWidth: '400px',
    margin: '0 auto 32px',
  },
  heroInputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: colors.surface,
    borderRadius: '16px',
    padding: '6px',
    border: `2px solid ${colors.border}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  },
  heroInputIcon: {
    padding: '0 14px',
    fontSize: '20px',
  },
  heroInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '17px',
    padding: '14px 0',
    outline: 'none',
    color: colors.text,
    minWidth: 0,
  },
  heroInputBtn: {
    background: colors.primary,
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: `0 4px 12px ${colors.primary}30`,
  },
  heroCreateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: colors.accentSoft,
    color: colors.accent,
    border: `2px solid transparent`,
    padding: '16px 24px',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    overflowX: 'auto',
    padding: '4px 0',
  },
  statPill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: colors.surface,
    padding: '14px 24px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    minWidth: '100px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.primary,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '13px',
    color: colors.muted,
    fontWeight: 500,
  },
  heroVisual: {
    marginTop: '48px',
    maxWidth: '420px',
    margin: '48px auto 0',
  },
  previewCard: {
    background: colors.surface,
    borderRadius: '24px',
    padding: '20px',
    boxShadow: '0 12px 48px rgba(11, 42, 74, 0.08), 0 2px 8px rgba(0,0,0,0.04)',
    border: `1px solid ${colors.border}`,
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  previewDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: colors.success,
    boxShadow: `0 0 8px ${colors.success}60`,
  },
  previewTitle: {
    flex: 1,
    fontSize: '15px',
    fontWeight: 600,
  },
  previewBadge: {
    background: colors.accentSoft,
    color: colors.accent,
    padding: '6px 12px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: 600,
  },
  ridePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    background: colors.background,
    borderRadius: '16px',
    marginBottom: '10px',
    border: `2px solid transparent`,
    transition: 'all 0.2s',
  },
  ridePreviewActive: {
    borderColor: colors.accent,
    background: `${colors.accent}08`,
  },
  rideAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: `0 4px 12px ${colors.accent}30`,
  },
  rideInfo: {
    flex: 1,
    minWidth: 0,
  },
  rideName: {
    fontSize: '15px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '2px',
  },
  verifiedBadge: {
    color: colors.success,
    fontSize: '13px',
    fontWeight: 700,
  },
  rideRoute: {
    fontSize: '13px',
    color: colors.muted,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rideSeats: {
    display: 'flex',
    gap: '6px',
  },
  seatFilled: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: colors.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  seatEmpty: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: colors.background,
    border: `2px dashed ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: colors.muted,
    fontWeight: 500,
  },
  previewFooter: {
    textAlign: 'center',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.border}`,
    marginTop: '6px',
  },
  previewFooterText: {
    fontSize: '13px',
    color: colors.muted,
    fontWeight: 500,
  },

  // Trust Badges
  trustBadges: {
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
    padding: '20px 0',
  },
  trustBadgesInner: {
    display: 'flex',
    gap: '12px',
    padding: '0 20px',
    overflowX: 'auto',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: colors.background,
    borderRadius: '100px',
    fontSize: '14px',
    color: colors.text,
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  trustBadgeIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
  },

  // Section
  section: {
    padding: '72px 20px',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  sectionTag: {
    display: 'inline-block',
    background: colors.accentSoft,
    color: colors.accent,
    padding: '8px 16px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '12px',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: colors.muted,
    maxWidth: '400px',
    margin: '0 auto',
    lineHeight: 1.6,
  },

  // Features
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  featureCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '24px 20px',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '6px',
    color: colors.text,
  },
  featureDesc: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: 1.5,
  },

  // Steps
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    maxWidth: '340px',
    margin: '0 auto',
  },
  stepItem: {
    display: 'flex',
    gap: '20px',
    position: 'relative',
  },
  stepIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: colors.accentSoft,
    border: `3px solid ${colors.accent}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    position: 'relative',
    zIndex: 2,
  },
  stepConnector: {
    width: '3px',
    height: '48px',
    background: `linear-gradient(180deg, ${colors.accent}40 0%, ${colors.border} 100%)`,
    borderRadius: '2px',
  },
  stepContent: {
    paddingTop: '14px',
    paddingBottom: '32px',
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '4px',
    color: colors.text,
  },
  stepDesc: {
    fontSize: '15px',
    color: colors.muted,
  },

  // Trust Section
  trustGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '28px',
  },
  trustItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.08)',
    padding: '18px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  trustItemIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  trustItemTitle: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  trustItemDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.4,
  },
  profilePreview: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '24px',
    maxWidth: '380px',
    margin: '0 auto',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  profileAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.success})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 700,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 600,
    fontSize: '18px',
    marginBottom: '2px',
  },
  profileVerified: {
    fontSize: '14px',
    color: colors.success,
    fontWeight: 500,
  },
  profileRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '17px',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.15)',
    padding: '8px 14px',
    borderRadius: '12px',
  },
  profileStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  profileStat: {
    textAlign: 'center',
    padding: '14px 8px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '14px',
  },
  profileStatNum: {
    fontWeight: 700,
    fontSize: '20px',
    marginBottom: '2px',
  },
  profileStatLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 500,
  },

  // Networking
  networkContent: {
    marginBottom: '32px',
  },
  chatPreview: {
    background: colors.surface,
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
  },
  chatBubbleIn: {
    background: colors.background,
    color: colors.text,
    padding: '14px 18px',
    borderRadius: '20px 20px 20px 6px',
    marginBottom: '10px',
    maxWidth: '88%',
    fontSize: '15px',
    lineHeight: 1.5,
  },
  chatBubbleOut: {
    background: colors.primary,
    color: '#fff',
    padding: '14px 18px',
    borderRadius: '20px 20px 6px 20px',
    marginBottom: '10px',
    maxWidth: '88%',
    marginLeft: 'auto',
    fontSize: '15px',
    lineHeight: 1.5,
  },
  chatMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '16px',
    padding: '12px 16px',
    background: colors.accentSoft,
    borderRadius: '12px',
    fontSize: '14px',
    color: colors.accent,
    fontWeight: 600,
  },
  benefitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  benefitItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    background: colors.surface,
    padding: '20px',
    borderRadius: '18px',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s',
  },
  benefitIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: colors.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
    color: colors.text,
  },
  benefitDesc: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: 1.5,
  },

  // Testimonials
  testimonialCarousel: {
    overflow: 'hidden',
    margin: '0 -20px',
    padding: '0 20px',
  },
  testimonialTrack: {
    display: 'flex',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  testimonialSlide: {
    flexShrink: 0,
    width: '100%',
    padding: '0 4px',
    boxSizing: 'border-box',
  },
  testimonialGridDesktop: {
    display: 'grid',
    gap: '16px',
  },
  testimonialCard: {
    background: colors.background,
    borderRadius: '24px',
    padding: '28px',
  },
  testimonialStars: {
    color: '#FBBF24',
    fontSize: '18px',
    marginBottom: '16px',
    letterSpacing: '3px',
  },
  testimonialText: {
    fontSize: '16px',
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  testimonialAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
  },
  testimonialName: {
    fontWeight: 600,
    fontSize: '15px',
    marginBottom: '2px',
  },
  testimonialEvent: {
    fontSize: '13px',
    color: colors.muted,
  },
  dotsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '24px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: colors.border,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  dotActive: {
    background: colors.accent,
    width: '32px',
    borderRadius: '5px',
  },

  // Impact
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px',
  },
  impactCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '24px 16px',
    textAlign: 'center',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  impactIcon: {
    fontSize: '36px',
    marginBottom: '10px',
  },
  impactValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: colors.primary,
    lineHeight: 1.2,
  },
  impactLabel: {
    fontSize: '14px',
    color: colors.muted,
    fontWeight: 500,
  },

  // CTA
  ctaSection: {
    padding: '72px 20px',
    textAlign: 'center',
    background: colors.surface,
  },
  ctaTitle: {
    fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  ctaSubtitle: {
    fontSize: '16px',
    color: colors.muted,
    marginBottom: '32px',
    lineHeight: 1.6,
  },
  ctaButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxWidth: '340px',
    margin: '0 auto',
  },
  ctaPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    padding: '18px 28px',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 8px 28px ${colors.primary}35`,
  },
  ctaSecondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: colors.background,
    color: colors.primary,
    border: `2px solid ${colors.border}`,
    padding: '16px 28px',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Footer
  footer: {
    padding: '48px 20px 120px',
    borderTop: `1px solid ${colors.border}`,
  },
  footerInner: {
    marginBottom: '24px',
  },
  footerBrand: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  footerLogo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: '10px',
  },
  footerTagline: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.6,
    maxWidth: '280px',
    margin: '0 auto',
  },
  footerColTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px',
  },
  footerLinksMobile: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '4px 16px',
    marginBottom: '24px',
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: colors.muted,
    fontSize: '15px',
    cursor: 'pointer',
    padding: '8px',
  },
  footerBottom: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: `1px solid ${colors.border}`,
    fontSize: '14px',
    color: colors.muted,
  },

  // Floating CTA
  floatingCta: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 20px',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    background: 'linear-gradient(0deg, rgba(255,255,255,1) 60%, rgba(255,255,255,0) 100%)',
    zIndex: 100,
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  floatingBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    padding: '18px',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 8px 32px ${colors.primary}40`,
  },
};

export default InfoPage;