import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// All styles in one object for single-file approach
const styles = {
  // Global page styles
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#fff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: 'hidden',
  },
  
  // Navigation
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  },
  navScrolled: {
    background: 'rgba(10, 10, 15, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
  },
  logo: {
    fontSize: '1.8rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    transition: 'color 0.2s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  navCta: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
    transition: 'all 0.3s ease',
  },
  
  // Hero Section
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '120px 40px 80px',
    position: 'relative',
  },
  heroContent: {
    textAlign: 'center',
    maxWidth: '900px',
    position: 'relative',
    zIndex: 2,
  },
  heroTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    padding: '8px 20px',
    borderRadius: '100px',
    fontSize: '14px',
    color: '#a5b4fc',
    marginBottom: '32px',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 8vw, 5rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: '28px',
    background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7,
    marginBottom: '48px',
    maxWidth: '700px',
    margin: '0 auto 48px',
  },
  heroButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    padding: '18px 40px',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    padding: '18px 40px',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  heroGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  
  // Stats Section
  stats: {
    padding: '60px 40px',
    background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    maxWidth: '1000px',
    margin: '0 auto',
    textAlign: 'center',
  },
  statItem: {
    padding: '20px',
  },
  statNumber: {
    fontSize: '3rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 500,
  },
  
  // Features Section
  features: {
    padding: '120px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '8px 20px',
    borderRadius: '100px',
    fontSize: '14px',
    color: '#6ee7b7',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
    marginBottom: '20px',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.6)',
    maxWidth: '600px',
    marginBottom: '60px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px',
  },
  featureCard: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
    borderRadius: '24px',
    padding: '36px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.4s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    marginBottom: '24px',
  },
  featureTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    marginBottom: '12px',
    color: '#fff',
  },
  featureDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7,
  },
  
  // How It Works Section
  howItWorks: {
    padding: '120px 40px',
    background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)',
  },
  howItWorksContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '40px',
    marginTop: '60px',
  },
  step: {
    position: 'relative',
    padding: '40px 30px',
    textAlign: 'center',
  },
  stepNumber: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 auto 24px',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
  },
  stepTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '12px',
    color: '#fff',
  },
  stepDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.7,
  },
  
  // Benefits Section
  benefits: {
    padding: '120px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '60px',
    alignItems: 'center',
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  benefitItem: {
    display: 'flex',
    gap: '20px',
    marginBottom: '32px',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#fff',
  },
  benefitDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.6,
  },
  mockup: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
    borderRadius: '32px',
    padding: '40px',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
  },
  mockupScreen: {
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '20px',
    padding: '30px',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  mockupCard: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  
  // CTA Section
  cta: {
    padding: '120px 40px',
    textAlign: 'center',
    position: 'relative',
  },
  ctaContent: {
    maxWidth: '700px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  ctaTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
    marginBottom: '20px',
    color: '#fff',
  },
  ctaSubtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '40px',
  },
  ctaGlow: {
    position: 'absolute',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  
  // Footer
  footer: {
    padding: '60px 40px 40px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
  },
  footerLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
};

function InfoPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: '🎯',
      title: 'Event-Based Carpooling',
      desc: 'Create events and let attendees coordinate rides together. Perfect for weddings, conferences, parties, and community gatherings.',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)',
    },
    {
      icon: '🗺️',
      title: 'Smart Route Matching',
      desc: 'Our intelligent system matches drivers with passengers along their route, minimizing detours and maximizing efficiency.',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      desc: 'Beautiful, intuitive interface designed for smartphones. Manage your rides on the go with ease.',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)',
    },
    {
      icon: '🔒',
      title: 'Privacy Controls',
      desc: 'Choose what information to share. Hide your phone, email, or name from other users while still coordinating rides.',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
    },
    {
      icon: '💬',
      title: 'Instant Communication',
      desc: 'One-tap WhatsApp integration and direct calling. Connect with drivers or passengers instantly.',
      gradient: 'linear-gradient(135deg, rgba(37, 211, 102, 0.2) 0%, rgba(37, 211, 102, 0.1) 100%)',
    },
    {
      icon: '✨',
      title: 'No App Required',
      desc: 'Works directly in your browser. Share a simple link and everyone can participate without downloading anything.',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
    },
  ];

  const steps = [
    {
      num: '1',
      title: 'Create an Event',
      desc: 'Set up your event with date, time, and location. Get a unique shareable link instantly.',
    },
    {
      num: '2',
      title: 'Share with Attendees',
      desc: 'Send the link to your guests. They can offer rides or request to join existing carpools.',
    },
    {
      num: '3',
      title: 'Match & Go',
      desc: 'Drivers accept passengers, everyone coordinates pickup points, and you\'re ready to travel together!',
    },
  ];

  const benefits = [
    {
      icon: '🌍',
      title: 'Reduce Carbon Footprint',
      desc: 'Every shared ride means fewer cars on the road and less environmental impact.',
    },
    {
      icon: '💰',
      title: 'Save Money',
      desc: 'Split fuel costs and parking fees. Carpooling makes travel affordable for everyone.',
    },
    {
      icon: '🤝',
      title: 'Build Community',
      desc: 'Turn commutes into connections. Meet new people and strengthen existing relationships.',
    },
    {
      icon: '🚗',
      title: 'Reduce Traffic',
      desc: 'Fewer vehicles means less congestion, shorter travel times, and less stress for everyone.',
    },
  ];

  return (
    <div style={styles.page}>
      {/* Navigation */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.logo}>trempi</div>
        <div style={styles.navLinks}>
          <button style={styles.navLink} onClick={() => scrollToSection('features')}>
            Features
          </button>
          <button style={styles.navLink} onClick={() => scrollToSection('how-it-works')}>
            How It Works
          </button>
          <button style={styles.navLink} onClick={() => scrollToSection('benefits')}>
            Benefits
          </button>
          <button 
            style={styles.navCta}
            onClick={() => navigate('/')}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroContent}>
          <div style={styles.heroTag}>
            <span>🚀</span>
            <span>The Future of Event Transportation</span>
          </div>
          <h1 style={styles.heroTitle}>
            Carpooling Made<br />
            <span style={styles.heroHighlight}>Simple & Social</span>
          </h1>
          <p style={styles.heroSubtitle}>
            The smartest way to coordinate rides for any event. Create, share, and match 
            with fellow travelers in seconds. No downloads, no hassle.
          </p>
          <div style={styles.heroButtons}>
            <button 
              style={styles.primaryBtn}
              onClick={() => navigate('/create-event')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
              }}
            >
              <span>✨</span> Create Event
            </button>
            <button 
              style={styles.secondaryBtn}
              onClick={() => navigate('/')}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.05)';
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              <span>🔗</span> Join Event
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.stats}>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>100%</div>
            <div style={styles.statLabel}>Free to Use</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>0</div>
            <div style={styles.statLabel}>Apps to Download</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>30s</div>
            <div style={styles.statLabel}>To Create Event</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>∞</div>
            <div style={styles.statLabel}>Rides to Share</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <div style={styles.sectionTag}>
          <span>⚡</span>
          <span>Features</span>
        </div>
        <h2 style={styles.sectionTitle}>Everything You Need</h2>
        <p style={styles.sectionSubtitle}>
          Powerful features designed to make carpooling effortless for organizers and attendees alike.
        </p>
        <div style={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              style={styles.featureCard}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ ...styles.featureIcon, background: feature.gradient }}>
                {feature.icon}
              </div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={styles.howItWorks}>
        <div style={styles.howItWorksContent}>
          <div style={{ ...styles.sectionTag, background: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            <span style={{ color: '#f472b6' }}>🎯</span>
            <span style={{ color: '#f472b6' }}>How It Works</span>
          </div>
          <h2 style={styles.sectionTitle}>Three Simple Steps</h2>
          <p style={styles.sectionSubtitle}>
            Get your event carpooling up and running in minutes, not hours.
          </p>
          <div style={styles.stepsGrid}>
            {steps.map((step, idx) => (
              <div key={idx} style={styles.step}>
                <div style={styles.stepNumber}>{step.num}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" style={styles.benefits}>
        <div style={styles.benefitsGrid}>
          <div>
            <div style={styles.sectionTag}>
              <span>💚</span>
              <span>Why Carpool</span>
            </div>
            <h2 style={styles.sectionTitle}>Better for Everyone</h2>
            <p style={{ ...styles.sectionSubtitle, marginBottom: '40px' }}>
              Carpooling isn't just convenient—it's a choice that benefits you, your community, and the planet.
            </p>
            <ul style={styles.benefitsList}>
              {benefits.map((benefit, idx) => (
                <li key={idx} style={styles.benefitItem}>
                  <div style={styles.benefitIcon}>{benefit.icon}</div>
                  <div>
                    <h4 style={styles.benefitTitle}>{benefit.title}</h4>
                    <p style={styles.benefitDesc}>{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.mockup}>
            <div style={styles.mockupScreen}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                📅 Wedding - Sarah & Mike
              </div>
              <div style={styles.mockupCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px'
                  }}>🚗</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>David K.</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>3 seats available</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ 
                    background: 'rgba(16, 185, 129, 0.2)', 
                    color: '#6ee7b7', 
                    padding: '4px 12px', 
                    borderRadius: '100px',
                    fontSize: '12px'
                  }}>Round Trip</span>
                  <span style={{ 
                    background: 'rgba(99, 102, 241, 0.2)', 
                    color: '#a5b4fc', 
                    padding: '4px 12px', 
                    borderRadius: '100px',
                    fontSize: '12px'
                  }}>Tel Aviv → Haifa</span>
                </div>
              </div>
              <div style={styles.mockupCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px'
                  }}>🙋</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>Rachel M.</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Looking for ride</div>
                  </div>
                </div>
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  borderRadius: '8px', 
                  padding: '10px',
                  fontSize: '13px',
                  color: '#fbbf24'
                }}>
                  ⏳ Awaiting driver confirmation...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaGlow} />
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Start Sharing Rides?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of people who are making their events more sustainable and connected.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              style={styles.primaryBtn}
              onClick={() => navigate('/create-event')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
              }}
            >
              Create Your First Event
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div>
            <div style={{ ...styles.logo, marginBottom: '8px' }}>trempi</div>
            <p style={styles.footerText}>Making carpooling simple for everyone.</p>
          </div>
          <div style={styles.footerLinks}>
            <button style={styles.footerLink} onClick={() => navigate('/')}>
              Home
            </button>
            <button style={styles.footerLink} onClick={() => navigate('/create-event')}>
              Create Event
            </button>
            <button style={styles.footerLink} onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '13px'
        }}>
          © {new Date().getFullYear()} Trempi. All rights reserved.
        </div>
      </footer>

      {/* Mobile responsive styles via media query simulation */}
      <style>{`
        @media (max-width: 768px) {
          nav { padding: 16px 20px !important; }
          nav > div:last-child { display: none !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default InfoPage;

