/* eslint-disable no-console */
import type { AbacusLoggingProtocol } from '@/constants/abacus';

class AbacusLogger implements Omit<AbacusLoggingProtocol, '__doNotUseOrImplementIt'> {
  d(tag: string, message: string) {
    if (import.meta.env.VITE_ENABLE_ABACUS_LOGGING) {
      console.log(`${tag}: ${message}`);
    }
  }

  e(tag: string, message: string) {
    if (
      true
      // import.meta.env.VITE_ENABLE_ABACUS_LOGGING ||
      // import.meta.env.VITE_ABACUS_LOG_LEVEL === 'error'
    ) {
      console.error(`${tag}: ${message}`);
    }
  }
}

export default AbacusLogger;
