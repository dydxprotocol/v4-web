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

  ddInfo(tag: string, message: string, context: object) {
    let contextString = null;
    try {
      contextString = context.toString();
      const parsedContext = JSON.parse(contextString);
      if (import.meta.env.VITE_DATADOG_LOG_LEVEL === 'debug') {
        console.log(`${tag} dd info: ${message}`, parsedContext);
      }
      dd.info(message, parsedContext);
      // catch in case parsing context fails for some reason
    } catch (err) {
      dd.error('Error sending dd info', { contextString }, err);
    }
  }
}

export default AbacusLogger;
