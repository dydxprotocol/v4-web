import React from 'react';

import { log } from '@/lib/telemetry';

type ErrorBoundaryProps = { children: React.ReactNode };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error): void {
    log('ErrorBoundary', error);
  }

  render() {
    const { children } = this.props;
    return children;
  }
}
