import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState({});
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef(null);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  // Parallax mouse effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const testimonialsCount = testimonials.length;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonialsCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const benefits = [
    {
      icon: '🤝',
      title: 'Connect & Network',
      description: 'Meet amazing people on your daily commute. Build meaningful connections and expand your professional network while sharing rides.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: '10K+ connections made',
    },
    {
      icon: '⛽',
      title: 'Save on Fuel',
      description: 'Cut your transportation costs by up to 75%. Share expenses with fellow travelers and keep more money in your pocket.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stats: '$2.5M saved collectively',
    },
    {
      icon: '🌿',
      title: 'Eco-Friendly',
      description: 'Reduce your carbon footprint with every shared ride. Together, we can make a real difference for our planet.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stats: '500+ tons CO₂ reduced',
    },
  ];

  const howItWorks = [
    { step: 1, title: 'Create Event', description: 'Set up your carpool event in seconds', icon: '📍' },
    { step: 2, title: 'Share Code', description: 'Invite others with a simple event code', icon: '🔗' },
    { step: 3, title: 'Match & Ride', description: 'Get matched with the perfect ride', icon: '🚗' },
    { step: 4, title: 'Connect', description: 'Meet new people, save money, help earth', icon: '✨' },
  ];

  const testimonials = [
    {
      quote: "Trempi transformed my daily commute into a networking opportunity. I've made genuine friendships and saved over $300 monthly!",
      author: 'Sarah M.',
      role: 'Marketing Manager',
      avatar: '👩‍💼',
    },
    {
      quote: "As someone who cares deeply about the environment, Trempi lets me reduce my carbon footprint while meeting like-minded people.",
      author: 'David K.',
      role: 'Environmental Scientist',
      avatar: '👨‍🔬',
    },
    {
      quote: "The best decision I made was joining Trempi. My commute is now the highlight of my day!",
      author: 'Lisa T.',
      role: 'Software Engineer',
      avatar: '👩‍💻',
    },
  ];

  const impactStats = [
    { value: '50K+', label: 'Active Users', icon: '👥' },
    { value: '2M+', label: 'Rides Shared', icon: '🚗' },
    { value: '$5M+', label: 'Money Saved', icon: '💰' },
    { value: '1000+', label: 'Tons CO₂ Saved', icon: '🌍' },
  ];

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1" style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }} />
        <div className="gradient-orb orb-2" style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }} />
        <div className="gradient-orb orb-3" style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }} />
        <div className="floating-shapes">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="floating-shape"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-content" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <div className="hero-badge animate-float">
            <span className="badge-icon">🚀</span>
            <span>Join the Carpooling Revolution</span>
          </div>

          <h1 className="hero-title">
            <span className="title-line">Share the Ride,</span>
            <span className="title-line gradient-text">Share the Journey</span>
          </h1>

          <p className="hero-subtitle">
            Connect with amazing people, save money on fuel, and help protect our planet.
            Every shared ride is a step towards a better tomorrow.
          </p>

          <div className="hero-cta">
            <button className="cta-primary" onClick={() => navigate('/')}>
              <span>Get Started Free</span>
              <span className="cta-arrow">→</span>
            </button>
            <button className="cta-secondary" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>
              <span className="play-icon">▶</span>
              <span>See How It Works</span>
            </button>
          </div>

          <div className="hero-stats">
            {impactStats.slice(0, 3).map((stat, index) => (
              <div key={index} className="hero-stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="car-animation">
            <div className="road">
              <div className="road-line" />
            </div>
            <div className="car car-1">🚗</div>
            <div className="car car-2">🚙</div>
            <div className="car car-3">🚕</div>
            <div className="people-bubbles">
              <span className="bubble bubble-1">👋</span>
              <span className="bubble bubble-2">💬</span>
              <span className="bubble bubble-3">🌱</span>
            </div>
          </div>
          <div className="connection-lines">
            <svg viewBox="0 0 400 300" className="connection-svg">
              <path className="connection-path" d="M50,150 Q200,50 350,150" />
              <path className="connection-path delay-1" d="M50,200 Q200,100 350,200" />
              <path className="connection-path delay-2" d="M50,250 Q200,150 350,250" />
            </svg>
          </div>
        </div>

        <div className="scroll-indicator" onClick={() => document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' })}>
          <span className="scroll-text">Scroll to explore</span>
          <div className="scroll-arrow">
            <span>↓</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section animate-on-scroll">
        <div className="section-header">
          <span className="section-tag">Why Choose Trempi</span>
          <h2 className="section-title">
            Three Powerful Reasons to <span className="gradient-text">Join Today</span>
          </h2>
          <p className="section-subtitle">
            Every ride shared is a connection made, money saved, and a greener choice.
          </p>
        </div>

        <div className={`benefits-grid ${isVisible['benefits'] ? 'visible' : ''}`}>
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="benefit-card"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="benefit-icon-wrapper" style={{ background: benefit.gradient }}>
                <span className="benefit-icon">{benefit.icon}</span>
              </div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
              <div className="benefit-stats">
                <span className="stats-badge">{benefit.stats}</span>
              </div>
              <div className="benefit-glow" style={{ background: benefit.gradient }} />
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section animate-on-scroll">
        <div className="section-header">
          <span className="section-tag">Simple & Easy</span>
          <h2 className="section-title">
            How <span className="gradient-text">Trempi</span> Works
          </h2>
          <p className="section-subtitle">
            Get started in minutes. It's that simple.
          </p>
        </div>

        <div className={`steps-container ${isVisible['how-it-works'] ? 'visible' : ''}`}>
          <div className="steps-line" />
          {howItWorks.map((step, index) => (
            <div
              key={index}
              className="step-card"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="step-number">{step.step}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section animate-on-scroll" id="impact">
        <div className="impact-background">
          <div className="impact-gradient" />
        </div>
        <div className="section-header light">
          <span className="section-tag light">Our Impact</span>
          <h2 className="section-title light">
            Together, We're Making a <span className="gradient-text-light">Difference</span>
          </h2>
        </div>

        <div className={`impact-stats-grid ${isVisible['impact'] ? 'visible' : ''}`}>
          {impactStats.map((stat, index) => (
            <div
              key={index}
              className="impact-stat-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="impact-icon">{stat.icon}</span>
              <span className="impact-value">{stat.value}</span>
              <span className="impact-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="earth-animation">
          <div className="earth">🌍</div>
          <div className="orbit orbit-1">
            <span className="satellite">🚗</span>
          </div>
          <div className="orbit orbit-2">
            <span className="satellite">🌱</span>
          </div>
          <div className="orbit orbit-3">
            <span className="satellite">💚</span>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section animate-on-scroll" id="testimonials">
        <div className="section-header">
          <span className="section-tag">What People Say</span>
          <h2 className="section-title">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
        </div>

        <div className="testimonials-carousel">
          <div className="testimonials-track" style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-icon">"</div>
                <p className="testimonial-quote">{testimonial.quote}</p>
                <div className="testimonial-author">
                  <span className="author-avatar">{testimonial.avatar}</span>
                  <div className="author-info">
                    <span className="author-name">{testimonial.author}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section animate-on-scroll" id="cta">
        <div className="cta-content">
          <div className="cta-badge">
            <span>🎉</span>
            <span>Join 50,000+ Happy Riders</span>
          </div>
          <h2 className="cta-title">
            Ready to Start Your
            <span className="gradient-text"> Journey?</span>
          </h2>
          <p className="cta-subtitle">
            Join the community that's changing how we travel.
            Better for your wallet, better for connections, better for Earth.
          </p>
          <button className="cta-button-large" onClick={() => navigate('/')}>
            <span>Start Carpooling Now</span>
            <span className="button-shine" />
          </button>
          <p className="cta-note">Free to join • No credit card required</p>
        </div>

        <div className="cta-decoration">
          <div className="floating-card card-1">
            <span>💰</span>
            <span>Save $200/mo</span>
          </div>
          <div className="floating-card card-2">
            <span>🌱</span>
            <span>Go Green</span>
          </div>
          <div className="floating-card card-3">
            <span>🤝</span>
            <span>Make Friends</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-logo">Trempi</h3>
            <p className="footer-tagline">Share the ride, share the journey.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => navigate('/')}>Home</button>
            <button onClick={() => navigate('/info')}>About</button>
            <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}>How It Works</button>
          </div>
          <p className="footer-copyright">© 2024 Trempi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
