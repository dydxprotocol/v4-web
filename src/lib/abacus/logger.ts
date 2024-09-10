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

  ddInfo(tag: string, message: string, context: string) {
    const parsedContext = JSON.parse(context.toString());
    if (import.meta.env.VITE_ABACUS_LOG_LEVEL === 'debug') {
      console.log(`${tag} dd info: ${message}`, parsedContext);
    }
    dd.info(message, parsedContext);
  }
}

export default AbacusLogger;
