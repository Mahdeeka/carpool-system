import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isMobile]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollToSection = (id) => {
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleJoinEvent = () => {
    if (eventCode.trim()) navigate(`/event/${eventCode.trim()}`);
  };

  const handleSwipe = (e, isStart) => {
    if (isStart) {
      setTouchStart(e.touches[0].clientX);
    } else {
      const diff = touchStart - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        setActiveTestimonial(prev => 
          diff > 0 ? Math.min(prev + 1, testimonials.length - 1) : Math.max(prev - 1, 0)
        );
      }
    }
  };

  const valueProps = [
    { icon: '🎯', title: 'Event-Centric', desc: 'Built specifically for events. Weddings, conferences, meetups – coordinate rides in one central hub.', color: colors.accent },
    { icon: '🤝', title: 'Trust First', desc: 'Share rides with people attending the same event. Common interests build instant trust.', color: colors.success },
    { icon: '💬', title: 'Connect Instantly', desc: 'One-tap WhatsApp messaging and calling. Coordinate pickup points effortlessly.', color: colors.warning },
    { icon: '🗺️', title: 'Smart Matching', desc: 'Our algorithm matches drivers and passengers along optimal routes.', color: '#8B5CF6' },
    { icon: '🔒', title: 'Privacy Controls', desc: 'Share only what you want. Hide your phone, email, or name from others.', color: '#EC4899' },
    { icon: '📱', title: 'No App Needed', desc: 'Works in any browser. Share a link and everyone can join instantly.', color: colors.accent },
  ];

  const steps = [
    { icon: '📝', title: 'Create Event', desc: 'Set up your event with date, time, and location in seconds.' },
    { icon: '📤', title: 'Share Link', desc: 'Send the unique link to all attendees via any messaging app.' },
    { icon: '🚗', title: 'Offer or Request', desc: 'Drivers offer seats, passengers request rides based on routes.' },
    { icon: '✅', title: 'Match & Go', desc: 'Connect, coordinate pickup, and travel together!' },
  ];

  const testimonials = [
    { name: 'Sarah M.', event: 'Wedding Guest', avatar: 'SM', color: '#0EA5E9', text: 'Met my future business partner on the drive to a friend\'s wedding. We had 2 hours to talk shop and exchanged ideas the whole way!' },
    { name: 'David K.', event: 'Conference Attendee', avatar: 'DK', color: '#22C55E', text: 'Saved ₪200 on parking and made 3 new industry connections before the conference even started. Absolute game-changer.' },
    { name: 'Maya R.', event: 'Event Organizer', avatar: 'MR', color: '#8B5CF6', text: 'As an organizer, trempi solved our parking nightmare. 40% fewer cars meant happy guests and a happy venue manager.' },
  ];

  const impacts = [
    { icon: '💰', value: '50%', label: 'Average savings on travel costs' },
    { icon: '🚗', value: '40%', label: 'Fewer cars at event venues' },
    { icon: '🌱', value: '2.5kg', label: 'CO₂ saved per shared ride' },
    { icon: '⏱️', value: '∞', label: 'Connections waiting to happen' },
  ];

  return (
    <div style={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />
      
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
        input { font-family: inherit; }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        
        .animate-in { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        
        .touch-active { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .touch-active:active { transform: scale(0.97); }
        
        .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(11,42,74,0.12); border-color: ${colors.accent}; }
        
        .gradient-text {
          background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .features-grid-responsive { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid-responsive { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        @media (min-width: 900px) {
          .hero-container {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 80px !important;
            align-items: center !important;
          }
          .hero-content {
            text-align: left !important;
          }
          .hero-subtitle {
            margin: 0 0 32px !important;
          }
          .hero-input-wrapper {
            margin: 0 0 32px !important;
          }
          .hero-stats {
            justify-content: flex-start !important;
          }
          .trust-content {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 80px !important;
          }
          .networking-content {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 80px !important;
          }
          .steps-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .step-connector {
            display: block !important;
          }
        }
        @media (max-width: 899px) {
          .step-connector {
            display: none !important;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => navigate('/')}>
            <div style={styles.logoIcon}>🚗</div>
            <span>trempi</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="desktop-only" style={styles.navLinks}>
            <button style={styles.navLink} onClick={() => scrollToSection('features')} 
              onMouseOver={e => e.target.style.color = colors.primary}
              onMouseOut={e => e.target.style.color = colors.muted}>Features</button>
            <button style={styles.navLink} onClick={() => scrollToSection('how-it-works')}
              onMouseOver={e => e.target.style.color = colors.primary}
              onMouseOut={e => e.target.style.color = colors.muted}>How It Works</button>
            <button style={styles.navLink} onClick={() => scrollToSection('trust')}
              onMouseOver={e => e.target.style.color = colors.primary}
              onMouseOut={e => e.target.style.color = colors.muted}>Trust</button>
            <button style={styles.navLink} onClick={() => scrollToSection('networking')}
              onMouseOver={e => e.target.style.color = colors.primary}
              onMouseOut={e => e.target.style.color = colors.muted}>Networking</button>
            <button style={styles.navCta} onClick={() => navigate('/create-event')}
              onMouseOver={e => { e.target.style.background = colors.primaryHover; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.target.style.background = colors.primary; e.target.style.transform = 'translateY(0)'; }}>
              Create Event
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button className="mobile-only touch-active" style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
            <div style={{ ...styles.menuLine, transform: menuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none' }} />
            <div style={{ ...styles.menuLine, opacity: menuOpen ? 0 : 1 }} />
            <div style={{ ...styles.menuLine, transform: menuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobile && (
        <div style={{ ...styles.mobileMenu, opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none' }} onClick={() => setMenuOpen(false)}>
          <div style={{ ...styles.mobileMenuContent, transform: menuOpen ? 'translateY(0)' : 'translateY(-20px)' }} onClick={e => e.stopPropagation()}>
            {[
              { icon: '⚡', label: 'Features', id: 'features' },
              { icon: '📋', label: 'How It Works', id: 'how-it-works' },
              { icon: '🛡️', label: 'Trust & Safety', id: 'trust' },
              { icon: '🌟', label: 'Networking', id: 'networking' },
            ].map((item, i) => (
              <button key={i} style={styles.mobileMenuItem} onClick={() => scrollToSection(item.id)} className="touch-active">
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
            <div style={styles.mobileMenuDivider} />
            <button style={styles.mobileMenuCta} onClick={() => { setMenuOpen(false); navigate('/create-event'); }} className="touch-active">
              ✨ Create Event
            </button>
          </div>
        </div>
      )}

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
            
            <h1 style={styles.heroTitle} className="animate-in delay-1">
              Your Event.<br />
              <span className="gradient-text">Your Community.</span><br />
              One Ride at a Time.
            </h1>
            
            <p style={styles.heroSubtitle} className="animate-in delay-2 hero-subtitle">
              Turn every journey into an opportunity. Connect with fellow attendees, share experiences, and arrive together. Networking starts before you even get there.
            </p>

            <div style={styles.heroInputWrapper} className="animate-in delay-3 hero-input-wrapper">
              <div style={styles.heroInputContainer}>
                <span style={styles.heroInputIcon}>🔗</span>
                <input
                  type="text"
                  placeholder="Enter event code or link"
                  style={styles.heroInput}
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  onFocus={e => e.target.parentElement.style.borderColor = colors.accent}
                  onBlur={e => e.target.parentElement.style.borderColor = colors.border}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
                />
                <button style={styles.heroInputBtn} onClick={handleJoinEvent} className="touch-active">Join</button>
              </div>
              <button style={styles.heroCreateBtn} onClick={() => navigate('/create-event')} className="touch-active">
                <span>✨</span> Create New Event
              </button>
            </div>

            <div style={styles.heroStats} className="hero-stats">
              {[{ value: '100%', label: 'Free Forever' }, { value: '30s', label: 'To Create Event' }, { value: '0', label: 'Apps to Download' }].map((stat, i) => (
                <div key={i} style={styles.heroStat}>
                  <div style={styles.heroStatValue}>{stat.value}</div>
                  <div style={styles.heroStatLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.heroVisual} className="animate-in delay-2">
            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <span style={styles.previewDot} />
                <span style={styles.previewTitle}>🎉 Wedding - Sarah & Mike</span>
                <span style={styles.previewBadge}>6 rides</span>
              </div>
              
              <div style={{ ...styles.rideCard, borderColor: colors.accent, background: `${colors.accent}08` }}>
                <div style={styles.rideDriver}>
                  <div style={styles.rideAvatar}>DK</div>
                  <div style={styles.rideInfo}>
                    <div style={styles.rideName}>David K. <span style={styles.verifiedBadge}>✓</span></div>
                    <div style={styles.rideRoute}>Tel Aviv → Haifa • Leaving 4:30 PM</div>
                  </div>
                </div>
                <div style={styles.rideSeats}>
                  <span style={styles.seatFilled}>👤</span>
                  <span style={styles.seatFilled}>👤</span>
                  <span style={styles.seatEmpty}>+</span>
                  <span style={styles.seatEmpty}>+</span>
                </div>
              </div>
              
              <div style={styles.rideCard}>
                <div style={styles.rideDriver}>
                  <div style={{ ...styles.rideAvatar, background: `linear-gradient(135deg, ${colors.success}, #16A34A)` }}>RL</div>
                  <div style={styles.rideInfo}>
                    <div style={styles.rideName}>Rachel L. <span style={styles.verifiedBadge}>✓</span></div>
                    <div style={styles.rideRoute}>Jerusalem → Haifa • Leaving 3:00 PM</div>
                  </div>
                </div>
                <div style={styles.rideSeats}>
                  <span style={styles.seatFilled}>👤</span>
                  <span style={styles.seatEmpty}>+</span>
                  <span style={styles.seatEmpty}>+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={styles.trustBadgesSection}>
        <div style={styles.trustBadgesInner} className="hide-scrollbar">
          {[
            { icon: '✓', text: 'Verified Profiles', color: colors.success },
            { icon: '🔒', text: 'Privacy First', color: colors.accent },
            { icon: '⚡', text: 'Instant Match', color: colors.warning },
            { icon: '⭐', text: 'Rated Drivers', color: '#8B5CF6' },
          ].map((badge, i) => (
            <div key={i} style={styles.trustBadge}>
              <span style={{ ...styles.trustBadgeIcon, background: `${badge.color}20`, color: badge.color }}>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTag}>⚡ Features</span>
            <h2 style={styles.sectionTitle}>Everything You Need</h2>
            <p style={styles.sectionSubtitle}>Powerful features designed to make carpooling effortless for organizers and attendees alike.</p>
          </div>

          <div style={styles.featuresGrid} className="features-grid-responsive">
            {valueProps.map((prop, idx) => (
              <div key={idx} style={styles.featureCard} className="hover-lift">
                <div style={{ ...styles.featureIcon, background: `${prop.color}15` }}>{prop.icon}</div>
                <h3 style={styles.featureTitle}>{prop.title}</h3>
                <p style={styles.featureDesc}>{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ ...styles.section, background: colors.surface }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={{ ...styles.sectionTag, background: `${colors.warning}15`, color: colors.warning }}>📋 How It Works</span>
            <h2 style={styles.sectionTitle}>Up and Running in Minutes</h2>
            <p style={styles.sectionSubtitle}>No complex setup. No app downloads. Just create, share, and go.</p>
          </div>

          <div style={styles.stepsGrid} className="steps-grid">
            {steps.map((step, idx) => (
              <div key={idx} style={styles.stepCard}>
                <div style={styles.stepNumber}>{step.icon}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
                {idx < steps.length - 1 && <div style={styles.stepConnector} className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" style={{ ...styles.section, background: colors.primary, color: '#fff' }}>
        <div style={styles.sectionInner}>
          <div style={styles.trustContent} className="trust-content">
            <div style={styles.trustText}>
              <span style={{ ...styles.sectionTag, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>🛡️ Trust & Safety</span>
              <h2 style={{ ...styles.sectionTitle, color: '#fff', textAlign: 'left' }}>Ride with People You Can Trust</h2>
              <p style={{ ...styles.sectionSubtitle, color: 'rgba(255,255,255,0.7)', textAlign: 'left', margin: '0 0 32px' }}>
                When everyone's going to the same event, you already have something in common. That shared context creates instant trust and better conversations.
              </p>
              
              <div style={styles.trustFeatures}>
                {[
                  { icon: '👥', title: 'Mutual Connections', desc: 'See shared friends and connections before you ride.' },
                  { icon: '⭐', title: 'Driver Ratings & Reviews', desc: 'Real feedback from real riders.' },
                  { icon: '✓', title: 'Verified Profiles', desc: 'Phone verification ensures everyone is who they say they are.' },
                ].map((item, idx) => (
                  <div key={idx} style={styles.trustFeature}>
                    <div style={styles.trustFeatureIcon}>{item.icon}</div>
                    <div>
                      <div style={styles.trustFeatureTitle}>{item.title}</div>
                      <div style={styles.trustFeatureDesc}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.trustVisual}>
              <div style={styles.profileCard}>
                <div style={styles.profileHeader}>
                  <div style={styles.profileAvatar}>DK</div>
                  <div style={styles.profileInfo}>
                    <div style={styles.profileName}>David K.</div>
                    <div style={styles.profileVerified}>✓ Verified Driver</div>
                  </div>
                  <div style={styles.profileRating}><span>⭐</span> 4.9</div>
                </div>
                <div style={styles.profileStats}>
                  <div style={styles.profileStat}><div style={styles.profileStatNum}>47</div><div style={styles.profileStatLabel}>Rides</div></div>
                  <div style={styles.profileStat}><div style={styles.profileStatNum}>12</div><div style={styles.profileStatLabel}>Events</div></div>
                  <div style={styles.profileStat}><div style={styles.profileStatNum}>100%</div><div style={styles.profileStatLabel}>On-time</div></div>
                </div>
                <div style={styles.profileReview}>
                  <div style={styles.reviewStars}>★★★★★</div>
                  <div style={styles.reviewText}>"David is an amazing driver! Great conversation and arrived right on time."</div>
                  <div style={styles.reviewAuthor}>— Maya, Tech Conference 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Networking Section */}
      <section id="networking" style={styles.section}>
        <div style={styles.sectionInner}>
          <div style={styles.networkingContent} className="networking-content">
            <div style={styles.networkingVisual}>
              <div style={styles.chatCard}>
                <div style={styles.chatBubbleIn}>Hey! I see you're heading to the startup meetup too. What are you working on? 🚀</div>
                <div style={styles.chatBubbleOut}>Building a fintech app! I'm in product design. Would love to hear about your work!</div>
                <div style={styles.chatBubbleIn}>Perfect timing! Let's grab coffee after the event. I'll share my deck with you 📊</div>
                <div style={styles.chatMeta}><span>💡</span> Connection made 45 min before event</div>
              </div>
            </div>

            <div style={styles.networkingText}>
              <span style={{ ...styles.sectionTag, background: `${colors.success}15`, color: colors.success }}>🌟 Networking</span>
              <h2 style={{ ...styles.sectionTitle, textAlign: 'left' }}>Networking Starts in Your Car</h2>
              <p style={{ ...styles.sectionSubtitle, textAlign: 'left', margin: '0 0 32px' }}>
                The best connections happen in unexpected places. A 45-minute drive with a fellow attendee can lead to partnerships, friendships, and opportunities.
              </p>
              
              <div style={styles.benefitsList}>
                {[
                  { icon: '🎯', title: 'Shared Interests', desc: 'You\'re already going to the same place. Common ground is built-in.' },
                  { icon: '⏰', title: 'Uninterrupted Time', desc: 'No crowds, no noise. Real conversations that actually go somewhere.' },
                  { icon: '🤝', title: 'Warm Introductions', desc: 'Arrive together and you\'ve already got someone to introduce you around.' },
                ].map((item, idx) => (
                  <div key={idx} style={styles.benefitItem} className="hover-lift">
                    <div style={styles.benefitIcon}>{item.icon}</div>
                    <div>
                      <div style={styles.benefitTitle}>{item.title}</div>
                      <div style={styles.benefitDesc}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ ...styles.section, background: colors.surface }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={{ ...styles.sectionTag, background: '#8B5CF615', color: '#8B5CF6' }}>💬 Stories</span>
            <h2 style={styles.sectionTitle}>Real Connections, Real Stories</h2>
            <p style={styles.sectionSubtitle}>Every ride is an opportunity waiting to happen.</p>
          </div>

          {/* Desktop Grid */}
          <div className="desktop-only" style={styles.testimonialsGrid}>
            {testimonials.map((t, idx) => (
              <div key={idx} style={styles.testimonialCard} className="hover-lift">
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

          {/* Mobile Carousel */}
          <div className="mobile-only">
            <div style={styles.testimonialCarousel} onTouchStart={e => handleSwipe(e, true)} onTouchEnd={e => handleSwipe(e, false)}>
              <div style={{ ...styles.testimonialTrack, transform: `translateX(-${activeTestimonial * 100}%)` }}>
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
            </div>
            <div style={styles.dotsContainer}>
              {testimonials.map((_, idx) => (
                <button key={idx} style={{ ...styles.dot, ...(idx === activeTestimonial ? styles.dotActive : {}) }} onClick={() => setActiveTestimonial(idx)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section style={{ ...styles.section, background: colors.accentSoft }}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionHeader}>
            <span style={{ ...styles.sectionTag, background: '#fff' }}>🌍 Impact</span>
            <h2 style={styles.sectionTitle}>Better for Everyone</h2>
            <p style={styles.sectionSubtitle}>Carpooling isn't just convenient – it's a choice that benefits you, your community, and the planet.</p>
          </div>

          <div style={styles.impactGrid}>
            {impacts.map((item, idx) => (
              <div key={idx} style={styles.impactCard} className="hover-lift">
                <div style={styles.impactIcon}>{item.icon}</div>
                <div style={styles.impactValue}>{item.value}</div>
                <div style={styles.impactLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...styles.section, background: colors.surface }}>
        <div style={styles.ctaContent}>
          <h2 style={styles.sectionTitle}>Ready to Ride Together?</h2>
          <p style={styles.sectionSubtitle}>Join the community of event-goers who've discovered that the journey is just as important as the destination.</p>
          
          <div style={styles.ctaButtons}>
            <button style={styles.ctaPrimary} onClick={() => navigate('/create-event')} className="touch-active"
              onMouseOver={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = `0 12px 32px ${colors.primary}40`; }}
              onMouseOut={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 8px 24px ${colors.primary}30`; }}>
              <span>✨</span> Create Event
            </button>
            <button style={styles.ctaSecondary} onClick={() => navigate('/')} className="touch-active"
              onMouseOver={e => { e.target.style.background = colors.accentSoft; e.target.style.borderColor = colors.accent; }}
              onMouseOut={e => { e.target.style.background = colors.background; e.target.style.borderColor = colors.border; }}>
              <span>🔗</span> Join Event
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerTop}>
            <div style={styles.footerBrand}>
              <div style={styles.footerLogo}><div style={{ ...styles.logoIcon, width: '28px', height: '28px', fontSize: '14px' }}>🚗</div> trempi</div>
              <p style={styles.footerTagline}>Making every event journey a chance to connect, share, and arrive together.</p>
            </div>
            
            <div className="desktop-only" style={styles.footerColumns}>
              <div style={styles.footerColumn}>
                <div style={styles.footerColTitle}>Product</div>
                <button style={styles.footerLink} onClick={() => scrollToSection('features')}>Features</button>
                <button style={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
                <button style={styles.footerLink} onClick={() => navigate('/create-event')}>Create Event</button>
              </div>
              <div style={styles.footerColumn}>
                <div style={styles.footerColTitle}>Resources</div>
                <button style={styles.footerLink}>Help Center</button>
                <button style={styles.footerLink}>Safety</button>
                <button style={styles.footerLink}>Community</button>
              </div>
              <div style={styles.footerColumn}>
                <div style={styles.footerColTitle}>Company</div>
                <button style={styles.footerLink}>About</button>
                <button style={styles.footerLink}>Contact</button>
                <button style={styles.footerLink}>Privacy</button>
              </div>
            </div>
          </div>
          
          <div className="mobile-only" style={styles.footerLinksMobile}>
            <button style={styles.footerLink} onClick={() => scrollToSection('features')}>Features</button>
            <button style={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button style={styles.footerLink} onClick={() => scrollToSection('trust')}>Trust</button>
            <button style={styles.footerLink} onClick={() => navigate('/create-event')}>Create</button>
          </div>
          
          <div style={styles.footerBottom}>
            <p>© {new Date().getFullYear()} Trempi. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Floating CTA */}
      {isMobile && (
        <div style={{ ...styles.floatingCta, transform: scrolled ? 'translateY(0)' : 'translateY(100px)', opacity: scrolled ? 1 : 0 }}>
          <button style={styles.floatingBtn} onClick={() => navigate('/create-event')} className="touch-active">
            <span>✨</span> Create Event
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.background,
    color: colors.text,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: 'hidden',
  },

  // Nav
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '16px 24px',
    transition: 'all 0.3s ease',
  },
  navScrolled: {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: colors.muted,
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
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
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  menuLine: {
    width: '26px',
    height: '2.5px',
    background: colors.primary,
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  },

  // Mobile Menu
  mobileMenu: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(248,250,252,0.98)',
    backdropFilter: 'blur(20px)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease',
  },
  mobileMenuContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '320px',
    transition: 'all 0.3s ease',
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
  },

  // Hero
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    padding: '120px 24px 80px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecor1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: colors.accentSoft,
    filter: 'blur(60px)',
    opacity: 0.8,
  },
  heroDecor2: {
    position: 'absolute',
    bottom: '100px',
    left: '-80px',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: `${colors.success}15`,
    filter: 'blur(60px)',
  },
  heroContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '48px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    '@media (min-width: 900px)': {
      gridTemplateColumns: '1fr 1fr',
      gap: '80px',
    },
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
  },
  heroTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.accentSoft,
    padding: '10px 18px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 600,
    color: colors.accent,
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: '20px',
    letterSpacing: '-1px',
  },
  heroSubtitle: {
    fontSize: 'clamp(16px, 2.5vw, 18px)',
    color: colors.muted,
    lineHeight: 1.7,
    marginBottom: '32px',
    maxWidth: '540px',
    margin: '0 auto 32px',
  },
  heroInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '440px',
    margin: '0 auto 32px',
  },
  heroInputContainer: {
    display: 'flex',
    alignItems: 'center',
    background: colors.surface,
    borderRadius: '14px',
    padding: '6px',
    border: `2px solid ${colors.border}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    transition: 'border-color 0.2s',
  },
  heroInputIcon: {
    padding: '0 14px',
    fontSize: '20px',
  },
  heroInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
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
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 4px 12px ${colors.primary}30`,
  },
  heroCreateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: colors.accentSoft,
    color: colors.accent,
    border: 'none',
    padding: '16px 24px',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  heroStats: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heroStat: {
    background: colors.surface,
    padding: '14px 24px',
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    minWidth: '110px',
  },
  heroStatValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.primary,
  },
  heroStatLabel: {
    fontSize: '13px',
    color: colors.muted,
  },
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
  },
  previewCard: {
    background: colors.surface,
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 16px 48px rgba(11,42,74,0.1)',
    border: `1px solid ${colors.border}`,
    width: '100%',
    maxWidth: '420px',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
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
  rideCard: {
    padding: '16px',
    background: colors.background,
    borderRadius: '16px',
    marginBottom: '12px',
    border: `2px solid transparent`,
  },
  rideDriver: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '12px',
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
  },
  verifiedBadge: {
    color: colors.success,
    fontSize: '14px',
  },
  rideRoute: {
    fontSize: '13px',
    color: colors.muted,
  },
  rideSeats: {
    display: 'flex',
    gap: '6px',
  },
  seatFilled: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: colors.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  seatEmpty: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: colors.background,
    border: `2px dashed ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: colors.muted,
  },

  // Trust Badges
  trustBadgesSection: {
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
    padding: '20px 0',
  },
  trustBadgesInner: {
    display: 'flex',
    gap: '16px',
    padding: '0 24px',
    overflowX: 'auto',
    justifyContent: 'center',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    background: colors.background,
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  trustBadgeIcon: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },

  // Section
  section: {
    padding: '80px 24px',
  },
  sectionInner: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  sectionTag: {
    display: 'inline-block',
    background: colors.accentSoft,
    color: colors.accent,
    padding: '10px 18px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '16px',
    letterSpacing: '-0.5px',
  },
  sectionSubtitle: {
    fontSize: '17px',
    color: colors.muted,
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.7,
  },

  // Features
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  featureCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '32px',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
  },
  featureIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '32px',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '10px',
  },
  featureDesc: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.6,
  },

  // Steps
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '32px',
  },
  stepCard: {
    textAlign: 'center',
    position: 'relative',
  },
  stepNumber: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: colors.accentSoft,
    border: `3px solid ${colors.accent}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '32px',
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  stepDesc: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.6,
  },
  stepConnector: {
    position: 'absolute',
    right: '-16px',
    top: '40px',
    width: '32px',
    height: '3px',
    background: colors.border,
    borderRadius: '2px',
  },

  // Trust
  trustContent: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '48px',
    alignItems: 'center',
  },
  trustText: {},
  trustFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  trustFeature: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  trustFeatureIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  },
  trustFeatureTitle: {
    fontWeight: 600,
    marginBottom: '4px',
    fontSize: '16px',
  },
  trustFeatureDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
  },
  trustVisual: {
    display: 'flex',
    justifyContent: 'center',
  },
  profileCard: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid rgba(255,255,255,0.15)',
    width: '100%',
    maxWidth: '380px',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  profileAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.accent}, ${colors.success})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: 700,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 600,
    fontSize: '18px',
  },
  profileVerified: {
    fontSize: '14px',
    color: colors.success,
  },
  profileRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '16px',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.15)',
    padding: '8px 14px',
    borderRadius: '12px',
  },
  profileStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
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
  },
  profileStatLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
  },
  profileReview: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '18px',
  },
  reviewStars: {
    color: '#FBBF24',
    marginBottom: '10px',
    letterSpacing: '2px',
  },
  reviewText: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: '10px',
    lineHeight: 1.5,
  },
  reviewAuthor: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },

  // Networking
  networkingContent: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '48px',
    alignItems: 'center',
  },
  networkingVisual: {},
  networkingText: {},
  chatCard: {
    background: colors.surface,
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    maxWidth: '420px',
    margin: '0 auto',
  },
  chatBubbleIn: {
    background: colors.background,
    padding: '14px 18px',
    borderRadius: '20px 20px 20px 6px',
    marginBottom: '12px',
    maxWidth: '85%',
    fontSize: '15px',
    lineHeight: 1.5,
  },
  chatBubbleOut: {
    background: colors.primary,
    color: '#fff',
    padding: '14px 18px',
    borderRadius: '20px 20px 6px 20px',
    marginBottom: '12px',
    maxWidth: '85%',
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
    gap: '16px',
  },
  benefitItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    background: colors.surface,
    padding: '20px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
  },
  benefitIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    background: colors.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  benefitDesc: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: 1.5,
  },

  // Testimonials
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  testimonialCarousel: {
    overflow: 'hidden',
    margin: '0 -24px',
    padding: '0 24px',
  },
  testimonialTrack: {
    display: 'flex',
    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  testimonialSlide: {
    flexShrink: 0,
    width: '100%',
    padding: '0 4px',
  },
  testimonialCard: {
    background: colors.background,
    borderRadius: '24px',
    padding: '28px',
    border: `1px solid ${colors.border}`,
  },
  testimonialStars: {
    color: '#FBBF24',
    fontSize: '18px',
    marginBottom: '16px',
    letterSpacing: '3px',
  },
  testimonialText: {
    fontSize: '16px',
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
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  dotActive: {
    background: colors.accent,
    width: '32px',
    borderRadius: '5px',
  },

  // Impact
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  impactCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '32px 24px',
    textAlign: 'center',
    border: `1px solid ${colors.border}`,
  },
  impactIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  impactValue: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: colors.primary,
  },
  impactLabel: {
    fontSize: '15px',
    color: colors.muted,
    marginTop: '4px',
    lineHeight: 1.4,
  },

  // CTA
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  },
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '32px',
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    padding: '18px 36px',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 8px 24px ${colors.primary}30`,
    transition: 'all 0.3s ease',
  },
  ctaSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: colors.background,
    color: colors.primary,
    border: `2px solid ${colors.border}`,
    padding: '16px 36px',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Footer
  footer: {
    padding: '60px 24px',
    borderTop: `1px solid ${colors.border}`,
    background: colors.surface,
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '48px',
    marginBottom: '40px',
  },
  footerBrand: {
    maxWidth: '300px',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: '12px',
  },
  footerTagline: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.6,
  },
  footerColumns: {
    display: 'flex',
    gap: '64px',
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerColTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: colors.muted,
    fontSize: '15px',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
    transition: 'color 0.2s',
  },
  footerLinksMobile: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '8px 20px',
    marginBottom: '24px',
  },
  footerBottom: {
    textAlign: 'center',
    paddingTop: '24px',
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
    background: 'linear-gradient(0deg, #fff 70%, transparent)',
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