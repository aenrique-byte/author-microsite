import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            <details className="text-sm text-neutral-700 dark:text-neutral-300">
              <summary className="cursor-pointer mb-2">Error details</summary>
              <pre className="whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-800 p-3 rounded text-xs overflow-auto">
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
