import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn(`[ErrorBoundary caught in ${this.props.name || 'Component'}]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '24px',
          margin: '16px 0',
          background: 'var(--surface-1, #1e293b)',
          border: '1px dashed var(--gold, #d97706)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--text-main, #f8fafc)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--gold, #d97706)', marginBottom: '8px' }}>
            ⚠️ {this.props.title || 'This section content could not be displayed properly.'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '16px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            type="button"
            className="file-upload-btn"
            style={{ margin: '0 auto', display: 'inline-block' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            🔄 Reload Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
