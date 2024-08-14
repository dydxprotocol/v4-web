/* eslint-disable no-console */
import type { AbacusLoggingProtocol } from '@/constants/abacus';

import { dd } from '../analytics/datadog';

class AbacusLogger implements Omit<AbacusLoggingProtocol, '__doNotUseOrImplementIt'> {
  d(tag: string, message: string) {
    if (
      import.meta.env.VITE_ENABLE_ABACUS_LOGGING ||
      import.meta.env.VITE_ABACUS_LOG_LEVEL === 'debug'
    ) {
      console.log(`${tag}: ${message}`);
    }
  }

  e(tag: string, message: string, context: object, error: Error) {
    if (
      import.meta.env.VITE_ENABLE_ABACUS_LOGGING ||
      import.meta.env.VITE_ABACUS_LOG_LEVEL === 'error'
    ) {
      console.error(`${tag}: ${message}`);
    }
    dd.error(message, context, error);
  }

  ddInfo(message: string, context: object) {
    if (import.meta.env.VITE_ABACUS_LOG_LEVEL === 'debug') {
      console.log(`dd info: ${message}`, context);
    }
    dd.info(message, context);
  }

  ddInfo(tag: string, message: string, context?: {}) {
    if (
      import.meta.env.VITE_ENABLE_ABACUS_LOGGING ||
      import.meta.env.VITE_ABACUS_LOG_LEVEL === 'info'
    ) {
      console.info(`${tag}: ${message}: ${context}`);
    }
  }
}

export default AbacusLogger;
