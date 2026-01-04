import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { requestOTP, verifyOTP } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData, showToast, authData } = useApp();
  
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'register'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState(''); // 'male' or 'female'
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [debugOtp, setDebugOtp] = useState(''); // For development
  
  const otpInputRefs = useRef([]);
  const abortControllerRef = useRef(null);
  
  // Redirect if already logged in
  useEffect(() => {
    if (authData) {
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo, { replace: true });
    }
  }, [authData, navigate, location]);
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleOtpAutoSubmit = useCallback(async (otpCode) => {
    if (otpCode.length === 6) {
      try {
        setLoading(true);
        const response = await verifyOTP(phone, otpCode, isNewUser ? name : null, isNewUser ? email : null, isNewUser ? gender : null);
        
        if (response.requires_registration) {
          setIsNewUser(true);
          setStep('register');
          showToast('Please complete your registration', 'info');
          return;
        }
        
        // Save auth data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('authAccount', JSON.stringify(response.account));
        
        setAuthData(response.account);
        showToast(`Welcome${response.account.name ? ', ' + response.account.name : ''}!`, 'success');
        
        const returnTo = location.state?.returnTo || '/';
        navigate(returnTo, { replace: true });
      } catch (error) {
        showToast(error.message || 'Invalid OTP', 'error');
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    }
  }, [phone, isNewUser, name, email, gender, showToast, setAuthData, navigate, location]);

  // Auto-read OTP from SMS using Web OTP API
  useEffect(() => {
    if (step === 'otp' && 'OTPCredential' in window) {
      abortControllerRef.current = new AbortController();
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: abortControllerRef.current.signal
      }).then(otpCredential => {
        if (otpCredential && otpCredential.code) {
          const otpCode = otpCredential.code;
          const otpArray = otpCode.split('').slice(0, 6);
          setOtp(otpArray);
          // Auto-submit after receiving OTP
          setTimeout(() => {
            handleOtpAutoSubmit(otpArray.join(''));
          }, 100);
        }
      }).catch(err => {
        // User cancelled or API not available
      });
      
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [step, handleOtpAutoSubmit]);
  
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    if (!phone.trim() || phone.length < 10) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await requestOTP(phone);
      setIsNewUser(response.is_new_user);
      
      if (response.requires_registration) {
        // New user - show registration form, OTP not sent yet
        setStep('register');
        showToast('Please fill in your details to create an account', 'info');
      } else if (response.otp_sent) {
        // Existing user - OTP was sent
        setStep('otp');
        setCountdown(60);
        showToast('Welcome back! Login code sent.', 'success');
        
        if (response.debug_otp) {
          setDebugOtp(response.debug_otp);
        }
      } else if (response.account_exists) {
        // Fallback for old API response format
        setStep('otp');
        setCountdown(60);
        showToast('Welcome back! Login code sent.', 'success');
        
        if (response.debug_otp) {
          setDebugOtp(response.debug_otp);
        }
      } else {
        // New user fallback
        setStep('register');
        showToast('Please fill in your details to create an account', 'info');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to send OTP';
      
      // If rate limited, it means OTP was already sent - move to OTP step anyway
      if (errorMessage.includes('Please wait') || errorMessage.includes('wait before')) {
        showToast('An OTP was already sent. Please enter it below.', 'info');
        setStep('otp');
        // Extract countdown from error message if available, or use default
        const retryMatch = errorMessage.match(/(\d+)/);
        setCountdown(retryMatch ? parseInt(retryMatch[1]) : 30);
        // Set debug OTP to default for testing
        setDebugOtp('123456');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleOtpAutoSubmit(newOtp.join(''));
    }
  };
  
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const otpArray = pastedData.split('');
      setOtp(otpArray);
      handleOtpAutoSubmit(pastedData);
    }
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }
    
    await handleOtpAutoSubmit(otpCode);
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    
    if (!email.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }
    
    if (!gender) {
      showToast('Please select your gender', 'error');
      return;
    }
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    
    // Now request OTP for new registration - include registration data
    setLoading(true);
    
    try {
      const response = await requestOTP(phone, name, email, gender);
      
      if (response.otp_sent) {
        setStep('otp');
        setCountdown(60);
        showToast('Verification code sent!', 'success');
        
        if (response.debug_otp) {
          setDebugOtp(response.debug_otp);
        }
      } else if (response.requires_registration) {
        // Should not happen here since we already have registration data
        showToast('Please fill in all registration details', 'error');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to send OTP';
      
      // If rate limited, it means OTP was already sent - move to OTP step anyway
      if (errorMessage.includes('Please wait') || errorMessage.includes('wait before')) {
        showToast('An OTP was already sent. Please enter it below.', 'info');
        setStep('otp');
        const retryMatch = errorMessage.match(/(\d+)/);
        setCountdown(retryMatch ? parseInt(retryMatch[1]) : 30);
        setDebugOtp('123456');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const response = await requestOTP(phone);
      setCountdown(60);
      showToast('OTP resent to your phone', 'success');
      
      if (response.debug_otp) {
        setDebugOtp(response.debug_otp);
      }
    } catch (error) {
      showToast(error.message || 'Failed to resend OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🚗</div>
          <h1>Carpool</h1>
          <p>Share rides, save together</p>
        </div>
        
        {step === 'phone' && (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="phone-input-wrapper">
                <input
                  type="tel"
                  className="form-input phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  autoFocus
                />
              </div>
              <p className="form-hint">We'll send you a verification code via SMS</p>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-car-loading">
                  <span className="mini-car">🚗</span>
                  Sending...
                </span>
              ) : 'Continue'}
            </button>
          </form>
        )}
        
        {step === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="step-indicator">
              <span className="step-badge">New Account</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                disabled
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <div className="radio-group radio-group-horizontal">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <span>♂️ Male</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <span>♀️ Female</span>
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-car-loading">
                  <span className="mini-car">🚗</span>
                  Sending OTP...
                </span>
              ) : 'Create Account'}
            </button>
            
            <button
              type="button"
              className="btn btn-secondary btn-block mt-12"
              onClick={() => {
                setStep('phone');
                setName('');
                setEmail('');
              }}
            >
              ← Back
            </button>
          </form>
        )}
        
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div className="otp-info">
              <p>Enter the 6-digit code sent to</p>
              <strong>{phone}</strong>
              <button
                type="button"
                className="change-phone-btn"
                onClick={() => {
                  setStep(isNewUser ? 'register' : 'phone');
                  setOtp(['', '', '', '', '', '']);
                }}
              >
                Change
              </button>
            </div>
            
            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  autoFocus={index === 0}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                />
              ))}
            </div>
            
            {debugOtp && (
              <div className="debug-otp">
                <small>🔧 Dev OTP: <strong>{debugOtp}</strong></small>
              </div>
            )}
            
            <div className="sms-auto-read-hint">
              <span className="hint-icon">📱</span>
              <span>OTP will be auto-filled from SMS</span>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || otp.some(d => !d)}
            >
              {loading ? (
                <span className="btn-car-loading">
                  <span className="mini-car">🚗</span>
                  Verifying...
                </span>
              ) : 'Verify & Login'}
            </button>
            
            <div className="resend-section">
              {countdown > 0 ? (
                <p className="resend-countdown">Resend code in {countdown}s</p>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
        
        <div className="login-footer">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
      
      {/* Full-page loading animation */}
      {loading && (
        <div className="page-loading-overlay">
          <div className="simple-car-loader">
            <div className="simple-car">
              <div className="simple-car-body"></div>
              <div className="simple-car-top"></div>
              <div className="simple-car-window"></div>
              <div className="simple-car-light-front"></div>
              <div className="simple-car-light-back"></div>
              <div className="simple-car-wheel simple-car-wheel-front"></div>
              <div className="simple-car-wheel simple-car-wheel-back"></div>
              <div className="speed-lines">
                <div className="speed-line"></div>
                <div className="speed-line"></div>
                <div className="speed-line"></div>
              </div>
              <div className="exhaust">
                <div className="exhaust-puff"></div>
                <div className="exhaust-puff"></div>
                <div className="exhaust-puff"></div>
              </div>
            </div>
            <div className="simple-road"></div>
          </div>
          <p className="loading-text">{step === 'otp' ? 'Verifying...' : 'Sending OTP...'}</p>
        </div>
      )}
    </div>
  );
}

export default Login;

