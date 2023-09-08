import React from 'react';

import { log } from '@/lib/telemetry';

type ErrorBoundaryProps = { children: React.ReactNode };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  componentDidCatch(error: Error): void {
    log('ErrorBoundary', error);
  }

  render() {
    return this.props.children;
  }
}
