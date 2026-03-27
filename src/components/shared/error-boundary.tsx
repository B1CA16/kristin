'use client';

import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Catches rendering errors in child components and shows a fallback
 * instead of crashing the entire page. Used to isolate sections
 * that depend on external data (TMDB, Supabase).
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="text-muted-foreground bg-card rounded-2xl py-8 text-center text-sm shadow-sm">
            Something went wrong. Please try refreshing.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
