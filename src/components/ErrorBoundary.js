import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // You could log to an error reporting service here
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>😕</div>
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            <p style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </p>

            <div style={styles.actions}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                🔄 Reload Page
              </button>
              <button onClick={this.handleGoHome} style={styles.secondaryButton}>
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '48px 32px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(11, 42, 74, 0.1)',
    border: '1px solid #E5E7EB',
  },
  icon: {
    fontSize: '72px',
    marginBottom: '24px',
  },
  title: {
    color: '#0B1220',
    fontSize: '1.5rem',
    fontWeight: '800',
    marginBottom: '12px',
  },
  message: {
    color: '#4B5563',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #0B2A4A 0%, #0EA5E9 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  secondaryButton: {
    padding: '14px 28px',
    background: '#FFFFFF',
    color: '#0B1220',
    border: '2px solid #E5E7EB',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  details: {
    marginTop: '32px',
    textAlign: 'left',
  },
  summary: {
    cursor: 'pointer',
    color: '#4B5563',
    fontSize: '13px',
    marginBottom: '12px',
  },
  errorText: {
    background: '#FEE2E2',
    color: '#991B1B',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default ErrorBoundary;
