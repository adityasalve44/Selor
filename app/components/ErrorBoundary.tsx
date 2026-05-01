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
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-10 text-center p-20 bg-surface-container-low rounded-lg shadow-technical border border-white/5 mx-auto max-w-2xl mt-24 relative overflow-hidden group">
          <div className="absolute inset-0 technical-grid opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <div className="w-24 h-24 rounded-sm bg-error/5 flex items-center justify-center text-error mb-4 shadow-inner border border-error/10">
             <span className="material-symbols-outlined text-[40px]">terminal</span>
          </div>
          <div className="space-y-4 relative z-10">
            <h2 className="font-display-lg text-5xl text-on-surface tracking-tighter lowercase">system <span className="text-error">interruption</span></h2>
            <p className="font-label-md text-on-surface-variant text-[11px] uppercase tracking-[0.3em] opacity-40 leading-relaxed max-w-md mx-auto">
              {this.state.message || 'An unhandled exception has occurred in the execution environment.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-12 py-6 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.3em] text-[11px] shadow-technical hover:opacity-90 transition-all active:scale-[0.98] mt-6"
          >
            re-initialize manifest
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
