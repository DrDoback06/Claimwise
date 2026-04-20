import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * Global Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and optionally to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
    // errorReportingService.logError(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReset = () => {
    // Reset to home/initial state
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const { fallback, showDetails = false } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-xl p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Something went wrong
                </h1>
                <p className="text-slate-400">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>
            </div>

            {showDetails && error && (
              <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-400 hover:text-slate-300 mb-2">
                    Error Details (click to expand)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-slate-500">Error:</span>
                      <pre className="mt-1 text-red-400 text-xs overflow-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && errorInfo.componentStack && (
                      <div>
                        <span className="text-slate-500">Component Stack:</span>
                        <pre className="mt-1 text-slate-400 text-xs overflow-auto max-h-40">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again {retryCount > 0 && `(${retryCount})`}
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              {retryCount >= 3 && (
                <button
                  onClick={() => window.location.reload()}
                  className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                >
                  Reload Page
                </button>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Tip:</strong> If this error persists, try refreshing the page or clearing your browser cache.
                Your work is automatically saved, so you won't lose any progress.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
