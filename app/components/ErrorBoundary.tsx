'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8">
          <span className="material-symbols-outlined text-[56px] text-error">error_outline</span>
          <h2 className="font-headline-lg text-on-surface">Something went wrong</h2>
          <p className="text-tertiary max-w-sm">{this.state.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg font-label-md hover:brightness-110 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
