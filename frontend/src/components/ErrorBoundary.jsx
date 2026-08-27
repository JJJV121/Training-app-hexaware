import React from 'react';
import Icon from './Icon';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = 'home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-main, #f8fafc)',
          color: 'var(--text-dark, #0f172a)',
          borderRadius: '16px',
          margin: '20px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Icon name="alert-triangle" style={{ width: '32px', height: '32px' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0' }}>
            Something went wrong loading this component
          </h2>
          <p style={{ color: 'var(--text-medium, #64748b)', maxWidth: '500px', fontSize: '14px', margin: '0 0 24px 0', lineHeight: '1.5' }}>
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                backgroundColor: 'transparent',
                color: 'var(--text-dark, #0f172a)',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
