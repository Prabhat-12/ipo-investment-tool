import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { DivergenLogo } from './DivergenLogo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Divergen Error Boundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isInline = Boolean(this.props.inline);

      if (isInline) {
        return (
          <div
            role="alert"
            style={{
              padding: '24px',
              margin: '16px 0',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <AlertTriangle size={24} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              {this.props.sectionName ? `Unable to load ${this.props.sectionName}` : 'Section unavailable'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
              An unexpected error occurred while rendering this module. You can try refreshing it.
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                borderRadius: '999px',
                marginTop: '4px'
              }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        );
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg)',
            backgroundImage: 'radial-gradient(ellipse at top right, rgba(139,130,115,0.04), transparent 50%), radial-gradient(ellipse at bottom left, rgba(139,130,115,0.05), transparent 50%)',
            padding: '24px',
            color: 'var(--text)',
            fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px'
            }}
          >
            <DivergenLogo variant="nav" />

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                Something went wrong
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Divergen ran into an unexpected error. Your saved data and cloud sessions are safe.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={14} /> Reload App
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  width: '100%',
                  marginTop: '12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: 'var(--text-muted)'
                }}
              >
                <summary style={{ cursor: 'pointer', outline: 'none' }}>Technical Details</summary>
                <pre
                  style={{
                    margin: '8px 0 0 0',
                    padding: '12px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#ef4444'
                  }}
                >
                  {this.state.error.toString()}
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
