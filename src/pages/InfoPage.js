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

const styles = {
  // Base page
  page: {
    minHeight: '100vh',
    background: colors.background,
    color: colors.text,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflowX: 'hidden',
  },

  // Navigation
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '16px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    background: 'transparent',
  },
  navScrolled: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  logo: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: colors.primary,
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    color: colors.muted,
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    transition: 'color 0.2s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  navCta: {
    background: colors.primary,
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Hero Section
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    padding: '120px 40px 80px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
    width: '100%',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  heroTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.accentSoft,
    padding: '8px 16px',
    borderRadius: '100px',
    fontSize: '14px',
    color: colors.accent,
    fontWeight: 600,
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: '24px',
    color: colors.text,
    letterSpacing: '-1px',
  },
  heroHighlight: {
    color: colors.accent,
    position: 'relative',
  },
  heroSubtitle: {
    fontSize: '1.15rem',
    color: colors.muted,
    lineHeight: 1.7,
    marginBottom: '36px',
    maxWidth: '500px',
  },
  heroInput: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    paddingLeft: '48px',
    borderRadius: '12px',
    border: `2px solid ${colors.border}`,
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s',
    background: colors.surface,
    color: colors.text,
    boxSizing: 'border-box',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.muted,
    fontSize: '18px',
  },
  primaryBtn: {
    background: colors.primary,
    color: '#fff',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  heroStats: {
    display: 'flex',
    gap: '40px',
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  heroStatNumber: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: colors.primary,
  },
  heroStatLabel: {
    fontSize: '14px',
    color: colors.muted,
  },
  heroVisual: {
    position: 'relative',
  },
  heroCard: {
    background: colors.surface,
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(11, 42, 74, 0.1)',
    border: `1px solid ${colors.border}`,
  },
  heroCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  heroCardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: colors.text,
  },
  heroCardBadge: {
    background: colors.accentSoft,
    color: colors.accent,
    padding: '6px 12px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: 600,
  },
  rideCard: {
    background: colors.background,
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.2s',
  },
  rideCardActive: {
    borderColor: colors.accent,
    boxShadow: `0 0 0 3px ${colors.accentSoft}`,
  },
  rideDriver: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '16px',
    color: '#fff',
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    fontWeight: 600,
    fontSize: '15px',
    color: colors.text,
    marginBottom: '2px',
  },
  rideRoute: {
    fontSize: '13px',
    color: colors.muted,
  },
  rideSeats: {
    display: 'flex',
    gap: '4px',
    marginTop: '12px',
  },
  seat: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  seatFilled: {
    background: colors.accentSoft,
    color: colors.accent,
  },
  seatEmpty: {
    background: colors.border,
    color: colors.muted,
    border: '2px dashed',
    borderColor: colors.muted,
  },
  decorBlob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
    opacity: 0.5,
  },

  // Social Proof Section
  socialProof: {
    padding: '60px 40px',
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
  },
  socialProofContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '40px',
  },
  socialLabel: {
    fontSize: '15px',
    color: colors.muted,
    fontWeight: 500,
  },
  avatarStack: {
    display: 'flex',
    alignItems: 'center',
  },
  stackedAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #fff',
    marginLeft: '-12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    background: colors.primary,
  },
  trustBadges: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  trustBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: colors.muted,
  },
  trustIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: colors.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },

  // Value Props Section
  valueProps: {
    padding: '100px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 60px',
  },
  sectionTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: colors.accentSoft,
    padding: '8px 16px',
    borderRadius: '100px',
    fontSize: '13px',
    color: colors.accent,
    fontWeight: 600,
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '16px',
    color: colors.text,
    letterSpacing: '-0.5px',
  },
  sectionSubtitle: {
    fontSize: '1.05rem',
    color: colors.muted,
    lineHeight: 1.7,
  },
  valueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  valueCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '32px',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  valueIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    marginBottom: '20px',
  },
  valueTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    marginBottom: '10px',
    color: colors.text,
  },
  valueDesc: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.7,
  },

  // Trust Section
  trust: {
    padding: '100px 40px',
    background: colors.primary,
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  trustContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '20px',
    letterSpacing: '-0.5px',
  },
  trustSubtitle: {
    fontSize: '1.05rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    marginBottom: '40px',
  },
  trustFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  trustFeature: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  trustFeatureIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
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
    lineHeight: 1.6,
  },
  trustVisual: {
    position: 'relative',
  },
  profileCard: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '28px',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  profileHeader: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '20px',
  },
  profileAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #22C55E 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#fff',
  },
  profileName: {
    fontWeight: 600,
    fontSize: '18px',
    marginBottom: '4px',
  },
  profileVerified: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: colors.success,
  },
  profileStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  profileStat: {
    textAlign: 'center',
    padding: '12px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '12px',
  },
  profileStatNum: {
    fontWeight: 700,
    fontSize: '1.25rem',
  },
  profileStatLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
  },
  profileReview: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
  },
  reviewStars: {
    marginBottom: '8px',
    color: '#FBBF24',
  },
  reviewText: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  reviewAuthor: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },

  // Networking Section
  networking: {
    padding: '100px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  networkingGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
  },
  networkingVisual: {
    position: 'relative',
  },
  conversationCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '28px',
    boxShadow: '0 20px 60px rgba(11, 42, 74, 0.08)',
    border: `1px solid ${colors.border}`,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: '14px 18px',
    borderRadius: '18px',
    marginBottom: '12px',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  chatBubbleOut: {
    background: colors.primary,
    color: '#fff',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px',
  },
  chatBubbleIn: {
    background: colors.background,
    color: colors.text,
    borderBottomLeftRadius: '4px',
  },
  chatMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    padding: '12px 16px',
    background: colors.accentSoft,
    borderRadius: '12px',
  },
  networkingContent: {},
  networkingTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(34, 197, 94, 0.1)',
    padding: '8px 16px',
    borderRadius: '100px',
    fontSize: '13px',
    color: colors.success,
    fontWeight: 600,
    marginBottom: '16px',
  },
  networkingTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '20px',
    color: colors.text,
    letterSpacing: '-0.5px',
  },
  networkingSubtitle: {
    fontSize: '1.05rem',
    color: colors.muted,
    lineHeight: 1.7,
    marginBottom: '32px',
  },
  networkingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  networkingItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  networkingIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: colors.accentSoft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  networkingItemTitle: {
    fontWeight: 600,
    marginBottom: '4px',
    color: colors.text,
  },
  networkingItemDesc: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: 1.6,
  },

  // How It Works
  howItWorks: {
    padding: '100px 40px',
    background: colors.surface,
  },
  howItWorksContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  stepsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '32px',
    marginTop: '60px',
    position: 'relative',
  },
  stepsLine: {
    position: 'absolute',
    top: '44px',
    left: '10%',
    right: '10%',
    height: '2px',
    background: colors.border,
  },
  step: {
    textAlign: 'center',
    position: 'relative',
  },
  stepNumber: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    background: colors.background,
    border: `2px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    margin: '0 auto 20px',
    position: 'relative',
    zIndex: 2,
    transition: 'all 0.3s ease',
  },
  stepTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '8px',
    color: colors.text,
  },
  stepDesc: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: 1.6,
  },

  // Testimonials
  testimonials: {
    padding: '100px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  testimonialCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '28px',
    border: `1px solid ${colors.border}`,
  },
  testimonialHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  testimonialAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
  testimonialName: {
    fontWeight: 600,
    fontSize: '15px',
    color: colors.text,
    marginBottom: '2px',
  },
  testimonialEvent: {
    fontSize: '13px',
    color: colors.muted,
  },
  testimonialStars: {
    color: '#FBBF24',
    marginBottom: '12px',
  },
  testimonialText: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.7,
    fontStyle: 'italic',
  },

  // Impact Section
  impact: {
    padding: '100px 40px',
    background: `linear-gradient(135deg, ${colors.accentSoft} 0%, ${colors.background} 100%)`,
  },
  impactContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '32px',
    marginTop: '60px',
  },
  impactCard: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '32px 24px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 20px rgba(11, 42, 74, 0.04)',
  },
  impactIcon: {
    fontSize: '40px',
    marginBottom: '16px',
  },
  impactNumber: {
    fontSize: '2rem',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: '4px',
  },
  impactLabel: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.5,
  },

  // CTA Section
  cta: {
    padding: '100px 40px',
    background: colors.surface,
    textAlign: 'center',
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    marginBottom: '16px',
    color: colors.text,
    letterSpacing: '-0.5px',
  },
  ctaSubtitle: {
    fontSize: '1.05rem',
    color: colors.muted,
    marginBottom: '40px',
    lineHeight: 1.7,
  },
  ctaInput: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  ctaOr: {
    color: colors.muted,
    fontSize: '14px',
    marginBottom: '16px',
  },
  secondaryBtn: {
    background: colors.background,
    color: colors.primary,
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    border: `2px solid ${colors.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Footer
  footer: {
    padding: '60px 40px 40px',
    borderTop: `1px solid ${colors.border}`,
    background: colors.surface,
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerTop: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '60px',
    marginBottom: '40px',
  },
  footerBrand: {},
  footerLogo: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.primary,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footerTagline: {
    fontSize: '15px',
    color: colors.muted,
    lineHeight: 1.6,
    maxWidth: '280px',
  },
  footerColumn: {},
  footerColumnTitle: {
    fontWeight: 600,
    fontSize: '14px',
    color: colors.text,
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footerLink: {
    color: colors.muted,
    textDecoration: 'none',
    fontSize: '15px',
    transition: 'color 0.2s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    padding: 0,
  },
  footerBottom: {
    paddingTop: '24px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: '14px',
    color: colors.muted,
  },
  footerSocial: {
    display: 'flex',
    gap: '16px',
  },
  socialIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.muted,
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
};

function InfoPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [eventCode, setEventCode] = useState('');

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

  const handleJoinEvent = () => {
    if (eventCode.trim()) {
      navigate(`/event/${eventCode.trim()}`);
    }
  };

  const valueProps = [
    {
      icon: '🎯',
      title: 'Event-Centric',
      desc: 'Built specifically for events. Weddings, conferences, meetups, retreats – coordinate rides in one central hub.',
      bg: colors.accentSoft,
    },
    {
      icon: '🤝',
      title: 'Trust First',
      desc: 'Share rides with people attending the same event. Common interests and mutual connections build instant trust.',
      bg: 'rgba(34, 197, 94, 0.1)',
    },
    {
      icon: '💬',
      title: 'Connect Instantly',
      desc: 'One-tap WhatsApp messaging and calling. Coordinate pickup points and arrival times effortlessly.',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      icon: '🗺️',
      title: 'Smart Matching',
      desc: 'Our algorithm matches drivers and passengers along optimal routes, minimizing detours for everyone.',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
    {
      icon: '🔒',
      title: 'Privacy Controls',
      desc: 'Share only what you want. Hide your phone, email, or full name while still coordinating rides.',
      bg: 'rgba(236, 72, 153, 0.1)',
    },
    {
      icon: '📱',
      title: 'No App Needed',
      desc: 'Works in any browser. Share a link and everyone can join – no downloads, no friction.',
      bg: colors.accentSoft,
    },
  ];

  const steps = [
    { icon: '📝', title: 'Create Event', desc: 'Set up your event with date, time, and location in seconds.' },
    { icon: '📤', title: 'Share Link', desc: 'Send the unique link to all attendees via any messaging app.' },
    { icon: '🚗', title: 'Offer or Request', desc: 'Drivers offer seats, passengers request rides based on routes.' },
    { icon: '✅', title: 'Match & Go', desc: 'Connect, coordinate pickup, and travel together!' },
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      event: 'Wedding Guest',
      avatar: 'SM',
      color: '#0EA5E9',
      text: 'Met my future business partner on the drive to a friend\'s wedding. We had 2 hours to talk shop and exchanged ideas the whole way!',
    },
    {
      name: 'David K.',
      event: 'Conference Attendee',
      avatar: 'DK',
      color: '#22C55E',
      text: 'Saved 200₪ on parking and made 3 new industry connections before the conference even started. Absolute game-changer.',
    },
    {
      name: 'Maya R.',
      event: 'Event Organizer',
      avatar: 'MR',
      color: '#8B5CF6',
      text: 'As an organizer, trempi solved our parking nightmare. 40% fewer cars meant happy guests and a happy venue manager.',
    },
  ];

  return (
    <div style={styles.page}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />

      {/* Navigation */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🚗</div>
          trempi
        </div>
        <div style={styles.navLinks}>
          <button 
            style={styles.navLink} 
            onClick={() => scrollToSection('features')}
            onMouseOver={(e) => e.target.style.color = colors.primary}
            onMouseOut={(e) => e.target.style.color = colors.muted}
          >
            Features
          </button>
          <button 
            style={styles.navLink} 
            onClick={() => scrollToSection('how-it-works')}
            onMouseOver={(e) => e.target.style.color = colors.primary}
            onMouseOut={(e) => e.target.style.color = colors.muted}
          >
            How It Works
          </button>
          <button 
            style={styles.navLink} 
            onClick={() => scrollToSection('trust')}
            onMouseOver={(e) => e.target.style.color = colors.primary}
            onMouseOut={(e) => e.target.style.color = colors.muted}
          >
            Trust & Safety
          </button>
          <button
            style={styles.navCta}
            onClick={() => navigate('/create-event')}
            onMouseOver={(e) => {
              e.target.style.background = colors.primaryHover;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = colors.primary;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Create Event
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        {/* Decorative blobs */}
        <div style={{ ...styles.decorBlob, width: '600px', height: '600px', background: colors.accentSoft, top: '-200px', right: '-200px' }} />
        <div style={{ ...styles.decorBlob, width: '400px', height: '400px', background: 'rgba(34, 197, 94, 0.08)', bottom: '100px', left: '-100px' }} />
        
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.heroTag}>
              <span>✨</span>
              <span>Smarter rides for better events</span>
            </div>
            <h1 style={styles.heroTitle}>
              Your Event.<br />
              <span style={styles.heroHighlight}>Your Community.</span><br />
              One Ride at a Time.
            </h1>
            <p style={styles.heroSubtitle}>
              Turn every journey into an opportunity. Connect with fellow attendees, share experiences, 
              and arrive together. Networking starts before you even get there.
            </p>
            
            <div style={styles.heroInput}>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔗</span>
                <input
                  type="text"
                  placeholder="Enter event code or link"
                  style={styles.input}
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
                />
              </div>
              <button
                style={styles.primaryBtn}
                onClick={handleJoinEvent}
                onMouseOver={(e) => {
                  e.target.style.background = colors.primaryHover;
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(11, 42, 74, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Join Event
              </button>
            </div>

            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <div style={styles.heroStatNumber}>100%</div>
                <div style={styles.heroStatLabel}>Free Forever</div>
              </div>
              <div style={styles.heroStat}>
                <div style={styles.heroStatNumber}>30s</div>
                <div style={styles.heroStatLabel}>To Create Event</div>
              </div>
              <div style={styles.heroStat}>
                <div style={styles.heroStatNumber}>0</div>
                <div style={styles.heroStatLabel}>Apps to Download</div>
              </div>
            </div>
          </div>

          <div style={styles.heroVisual}>
            <div style={styles.heroCard}>
              <div style={styles.heroCardHeader}>
                <div style={styles.heroCardTitle}>🎉 Wedding - Sarah & Mike</div>
                <div style={styles.heroCardBadge}>6 rides</div>
              </div>
              
              <div style={{ ...styles.rideCard, ...styles.rideCardActive }}>
                <div style={styles.rideDriver}>
                  <div style={{ ...styles.avatar, background: 'linear-gradient(135deg, #0EA5E9, #0B2A4A)' }}>DK</div>
                  <div style={styles.rideInfo}>
                    <div style={styles.rideName}>David K.</div>
                    <div style={styles.rideRoute}>Tel Aviv → Haifa • Leaving 4:30 PM</div>
                  </div>
                </div>
                <div style={styles.rideSeats}>
                  <div style={{ ...styles.seat, ...styles.seatFilled }}>👤</div>
                  <div style={{ ...styles.seat, ...styles.seatFilled }}>👤</div>
                  <div style={{ ...styles.seat, ...styles.seatEmpty }}>+</div>
                  <div style={{ ...styles.seat, ...styles.seatEmpty }}>+</div>
                </div>
              </div>

              <div style={styles.rideCard}>
                <div style={styles.rideDriver}>
                  <div style={{ ...styles.avatar, background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>RL</div>
                  <div style={styles.rideInfo}>
                    <div style={styles.rideName}>Rachel L.</div>
                    <div style={styles.rideRoute}>Jerusalem → Haifa • Leaving 3:00 PM</div>
                  </div>
                </div>
                <div style={styles.rideSeats}>
                  <div style={{ ...styles.seat, ...styles.seatFilled }}>👤</div>
                  <div style={{ ...styles.seat, ...styles.seatEmpty }}>+</div>
                  <div style={{ ...styles.seat, ...styles.seatEmpty }}>+</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={styles.socialProof}>
        <div style={styles.socialProofContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={styles.avatarStack}>
              {['#0EA5E9', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899'].map((color, i) => (
                <div key={i} style={{ ...styles.stackedAvatar, background: color, marginLeft: i === 0 ? 0 : '-12px' }}>
                  {['A', 'B', 'C', 'D', 'E'][i]}
                </div>
              ))}
            </div>
            <div style={styles.socialLabel}>Join thousands already carpooling</div>
          </div>
          <div style={styles.trustBadges}>
            <div style={styles.trustBadge}>
              <div style={styles.trustIcon}>✓</div>
              <span>Verified Profiles</span>
            </div>
            <div style={styles.trustBadge}>
              <div style={styles.trustIcon}>🔒</div>
              <span>Privacy First</span>
            </div>
            <div style={styles.trustBadge}>
              <div style={styles.trustIcon}>⚡</div>
              <span>Instant Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section id="features" style={styles.valueProps}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTag}>
            <span>⚡</span>
            <span>Features</span>
          </div>
          <h2 style={styles.sectionTitle}>Everything You Need to Share Rides</h2>
          <p style={styles.sectionSubtitle}>
            Built for event organizers and attendees who want seamless, trustworthy carpooling.
          </p>
        </div>

        <div style={styles.valueGrid}>
          {valueProps.map((prop, idx) => (
            <div
              key={idx}
              style={styles.valueCard}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(11, 42, 74, 0.1)';
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <div style={{ ...styles.valueIcon, background: prop.bg }}>{prop.icon}</div>
              <h3 style={styles.valueTitle}>{prop.title}</h3>
              <p style={styles.valueDesc}>{prop.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" style={styles.trust}>
        <div style={{ ...styles.decorBlob, width: '400px', height: '400px', background: 'rgba(14, 165, 233, 0.2)', top: '-100px', right: '10%' }} />
        
        <div style={styles.trustContent}>
          <div>
            <h2 style={styles.trustTitle}>
              Ride with People<br />You Can Trust
            </h2>
            <p style={styles.trustSubtitle}>
              When everyone's going to the same event, you already have something in common. 
              That shared context creates instant trust and better conversations.
            </p>
            
            <div style={styles.trustFeatures}>
              <div style={styles.trustFeature}>
                <div style={styles.trustFeatureIcon}>👥</div>
                <div>
                  <div style={styles.trustFeatureTitle}>Mutual Connections</div>
                  <div style={styles.trustFeatureDesc}>
                    See shared friends and connections. You're not riding with strangers – you're riding with friends-of-friends.
                  </div>
                </div>
              </div>
              <div style={styles.trustFeature}>
                <div style={styles.trustFeatureIcon}>⭐</div>
                <div>
                  <div style={styles.trustFeatureTitle}>Driver Ratings & Reviews</div>
                  <div style={styles.trustFeatureDesc}>
                    Real feedback from real riders. See how others experienced the journey before you commit.
                  </div>
                </div>
              </div>
              <div style={styles.trustFeature}>
                <div style={styles.trustFeatureIcon}>✓</div>
                <div>
                  <div style={styles.trustFeatureTitle}>Verified Profiles</div>
                  <div style={styles.trustFeatureDesc}>
                    Phone verification ensures everyone is who they say they are. Real people, real rides.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.trustVisual}>
            <div style={styles.profileCard}>
              <div style={styles.profileHeader}>
                <div style={styles.profileAvatar}>DK</div>
                <div>
                  <div style={styles.profileName}>David K.</div>
                  <div style={styles.profileVerified}>
                    <span>✓</span> Verified Driver
                  </div>
                </div>
              </div>
              <div style={styles.profileStats}>
                <div style={styles.profileStat}>
                  <div style={styles.profileStatNum}>47</div>
                  <div style={styles.profileStatLabel}>Rides Given</div>
                </div>
                <div style={styles.profileStat}>
                  <div style={styles.profileStatNum}>4.9</div>
                  <div style={styles.profileStatLabel}>Rating</div>
                </div>
                <div style={styles.profileStat}>
                  <div style={styles.profileStatNum}>12</div>
                  <div style={styles.profileStatLabel}>Events</div>
                </div>
              </div>
              <div style={styles.profileReview}>
                <div style={styles.reviewStars}>★★★★★</div>
                <div style={styles.reviewText}>
                  "David is an amazing driver! Great conversation about the tech industry and arrived right on time."
                </div>
                <div style={styles.reviewAuthor}>— Maya, Tech Conference 2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Networking Section */}
      <section id="networking" style={styles.networking}>
        <div style={styles.networkingGrid}>
          <div style={styles.networkingVisual}>
            <div style={styles.conversationCard}>
              <div style={{ ...styles.chatBubble, ...styles.chatBubbleIn }}>
                Hey! I see you're heading to the startup meetup too. I'm working on a fintech product – you?
              </div>
              <div style={{ ...styles.chatBubble, ...styles.chatBubbleOut }}>
                Nice! I'm in product design. Actually working on some fintech UX right now. Would love to pick your brain!
              </div>
              <div style={{ ...styles.chatBubble, ...styles.chatBubbleIn }}>
                Perfect timing! Let's grab coffee after the event too. I'll share my deck with you 📊
              </div>
              <div style={styles.chatMeta}>
                <span>💡</span>
                <span style={{ fontSize: '14px', color: colors.accent, fontWeight: 500 }}>Connection made 45 min before event</span>
              </div>
            </div>
          </div>

          <div style={styles.networkingContent}>
            <div style={styles.networkingTag}>
              <span>🌟</span>
              <span>Networking</span>
            </div>
            <h2 style={styles.networkingTitle}>
              Networking Starts<br />in Your Car
            </h2>
            <p style={styles.networkingSubtitle}>
              The best connections happen in unexpected places. A 45-minute drive with a fellow attendee 
              can lead to partnerships, friendships, and opportunities you'd never find at the event itself.
            </p>

            <div style={styles.networkingList}>
              <div style={styles.networkingItem}>
                <div style={styles.networkingIcon}>🎯</div>
                <div>
                  <div style={styles.networkingItemTitle}>Shared Interests</div>
                  <div style={styles.networkingItemDesc}>
                    You're already going to the same place. Common ground is built-in.
                  </div>
                </div>
              </div>
              <div style={styles.networkingItem}>
                <div style={styles.networkingIcon}>⏰</div>
                <div>
                  <div style={styles.networkingItemTitle}>Uninterrupted Time</div>
                  <div style={styles.networkingItemDesc}>
                    No crowds, no noise. Real conversations that actually go somewhere.
                  </div>
                </div>
              </div>
              <div style={styles.networkingItem}>
                <div style={styles.networkingIcon}>🤝</div>
                <div>
                  <div style={styles.networkingItemTitle}>Warm Introductions</div>
                  <div style={styles.networkingItemDesc}>
                    Arrive together and you've already got someone to introduce you around.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={styles.howItWorks}>
        <div style={styles.howItWorksContent}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionTag, background: 'rgba(245, 158, 11, 0.1)', color: colors.warning }}>
              <span>📋</span>
              <span>How It Works</span>
            </div>
            <h2 style={styles.sectionTitle}>Up and Running in Minutes</h2>
            <p style={styles.sectionSubtitle}>
              No complex setup. No app downloads. Just create, share, and go.
            </p>
          </div>

          <div style={styles.stepsContainer}>
            <div style={styles.stepsLine} />
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                style={styles.step}
                onMouseOver={(e) => {
                  const num = e.currentTarget.querySelector('[data-step-num]');
                  if (num) {
                    num.style.background = colors.accentSoft;
                    num.style.borderColor = colors.accent;
                    num.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseOut={(e) => {
                  const num = e.currentTarget.querySelector('[data-step-num]');
                  if (num) {
                    num.style.background = colors.background;
                    num.style.borderColor = colors.border;
                    num.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={styles.stepNumber} data-step-num>{step.icon}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={styles.testimonials}>
        <div style={styles.sectionHeader}>
          <div style={{ ...styles.sectionTag, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
            <span>💬</span>
            <span>Stories</span>
          </div>
          <h2 style={styles.sectionTitle}>Real Connections, Real Stories</h2>
          <p style={styles.sectionSubtitle}>
            Every ride is an opportunity waiting to happen.
          </p>
        </div>

        <div style={styles.testimonialsGrid}>
          {testimonials.map((t, idx) => (
            <div key={idx} style={styles.testimonialCard}>
              <div style={styles.testimonialHeader}>
                <div style={{ ...styles.testimonialAvatar, background: t.color }}>{t.avatar}</div>
                <div>
                  <div style={styles.testimonialName}>{t.name}</div>
                  <div style={styles.testimonialEvent}>{t.event}</div>
                </div>
              </div>
              <div style={styles.testimonialStars}>★★★★★</div>
              <p style={styles.testimonialText}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section style={styles.impact}>
        <div style={styles.impactContent}>
          <div style={styles.sectionHeader}>
            <div style={{ ...styles.sectionTag, background: 'rgba(34, 197, 94, 0.1)', color: colors.success }}>
              <span>🌍</span>
              <span>Impact</span>
            </div>
            <h2 style={styles.sectionTitle}>Better for Everyone</h2>
            <p style={styles.sectionSubtitle}>
              Carpooling isn't just convenient – it's a choice that benefits you, your community, and the planet.
            </p>
          </div>

          <div style={styles.impactGrid}>
            <div style={styles.impactCard}>
              <div style={styles.impactIcon}>💰</div>
              <div style={styles.impactNumber}>50%</div>
              <div style={styles.impactLabel}>Average savings on travel costs</div>
            </div>
            <div style={styles.impactCard}>
              <div style={styles.impactIcon}>🚗</div>
              <div style={styles.impactNumber}>40%</div>
              <div style={styles.impactLabel}>Fewer cars at event venues</div>
            </div>
            <div style={styles.impactCard}>
              <div style={styles.impactIcon}>🌱</div>
              <div style={styles.impactNumber}>2.5kg</div>
              <div style={styles.impactLabel}>CO₂ saved per shared ride</div>
            </div>
            <div style={styles.impactCard}>
              <div style={styles.impactIcon}>⏱️</div>
              <div style={styles.impactNumber}>∞</div>
              <div style={styles.impactLabel}>Connections waiting to happen</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Ride Together?</h2>
          <p style={styles.ctaSubtitle}>
            Join the community of event-goers who've discovered that the journey is just as important as the destination.
          </p>
          
          <div style={styles.ctaInput}>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔗</span>
              <input
                type="text"
                placeholder="Enter event code"
                style={{ ...styles.input, maxWidth: '300px' }}
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = colors.accent}
                onBlur={(e) => e.target.style.borderColor = colors.border}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinEvent()}
              />
            </div>
            <button
              style={styles.primaryBtn}
              onClick={handleJoinEvent}
              onMouseOver={(e) => {
                e.target.style.background = colors.primaryHover;
              }}
              onMouseOut={(e) => {
                e.target.style.background = colors.primary;
              }}
            >
              Join Event
            </button>
          </div>

          <div style={styles.ctaOr}>or</div>

          <button
            style={styles.secondaryBtn}
            onClick={() => navigate('/create-event')}
            onMouseOver={(e) => {
              e.target.style.background = colors.accentSoft;
              e.target.style.borderColor = colors.accent;
            }}
            onMouseOut={(e) => {
              e.target.style.background = colors.background;
              e.target.style.borderColor = colors.border;
            }}
          >
            Create Your Own Event
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerTop}>
            <div style={styles.footerBrand}>
              <div style={styles.footerLogo}>
                <div style={{ ...styles.logoIcon, width: '28px', height: '28px', fontSize: '14px' }}>🚗</div>
                trempi
              </div>
              <p style={styles.footerTagline}>
                Making every event journey a chance to connect, share, and arrive together.
              </p>
            </div>
            <div style={styles.footerColumn}>
              <div style={styles.footerColumnTitle}>Product</div>
              <div style={styles.footerLinks}>
                <button style={styles.footerLink} onClick={() => scrollToSection('features')}>Features</button>
                <button style={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
                <button style={styles.footerLink} onClick={() => navigate('/create-event')}>Create Event</button>
              </div>
            </div>
            <div style={styles.footerColumn}>
              <div style={styles.footerColumnTitle}>Resources</div>
              <div style={styles.footerLinks}>
                <button style={styles.footerLink}>Help Center</button>
                <button style={styles.footerLink}>Safety</button>
                <button style={styles.footerLink}>Community</button>
              </div>
            </div>
            <div style={styles.footerColumn}>
              <div style={styles.footerColumnTitle}>Company</div>
              <div style={styles.footerLinks}>
                <button style={styles.footerLink}>About</button>
                <button style={styles.footerLink}>Contact</button>
                <button style={styles.footerLink}>Privacy</button>
              </div>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <div style={styles.footerCopyright}>
              © {new Date().getFullYear()} Trempi. All rights reserved.
            </div>
            <div style={styles.footerSocial}>
              <button 
                style={styles.socialIcon}
                onMouseOver={(e) => {
                  e.target.style.background = colors.accentSoft;
                  e.target.style.color = colors.accent;
                }}
                onMouseOut={(e) => {
                  e.target.style.background = colors.background;
                  e.target.style.color = colors.muted;
                }}
              >𝕏</button>
              <button 
                style={styles.socialIcon}
                onMouseOver={(e) => {
                  e.target.style.background = colors.accentSoft;
                  e.target.style.color = colors.accent;
                }}
                onMouseOut={(e) => {
                  e.target.style.background = colors.background;
                  e.target.style.color = colors.muted;
                }}
              >in</button>
              <button 
                style={styles.socialIcon}
                onMouseOver={(e) => {
                  e.target.style.background = colors.accentSoft;
                  e.target.style.color = colors.accent;
                }}
                onMouseOut={(e) => {
                  e.target.style.background = colors.background;
                  e.target.style.color = colors.muted;
                }}
              >📸</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          nav > div:last-child { display: none !important; }
        }
        @media (max-width: 900px) {
          .hero-container { grid-template-columns: 1fr !important; }
          .trust-content { grid-template-columns: 1fr !important; }
          .networking-grid { grid-template-columns: 1fr !important; }
          .value-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-container { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-line { display: none !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .impact-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-top { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
          .value-grid { grid-template-columns: 1fr !important; }
          .steps-container { grid-template-columns: 1fr !important; }
          .impact-grid { grid-template-columns: 1fr !important; }
          .footer-top { grid-template-columns: 1fr !important; }
          .hero-input { flex-direction: column !important; }
          .hero-stats { flex-direction: column !important; gap: 20px !important; }
        }
      `}</style>
    </div>
  );
}

export default InfoPage;