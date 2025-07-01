import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console for debugging
    console.error("Uncaught error in component:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI
      return (
        <div className="error-container main-content">
            <h1 className="dashboard-title">Something went wrong.</h1>
            <p className="dashboard-subtitle">We're sorry, but the application encountered an unrecoverable error. This is not a blank screen, but a captured error.</p>
            <div className="dashboard-card" style={{ marginTop: '2rem' }}>
                <h3 className="card-title">Error Details</h3>
                <details style={{ whiteSpace: 'pre-wrap', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px' }}>
                    {this.state.error && this.state.error.toString()}
                    <br />
                    <br />
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </details>
            </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary; 