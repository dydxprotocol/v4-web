import type { AbacusLoggingProtocol } from '@/constants/abacus';

class AbacusLogger implements Omit<AbacusLoggingProtocol, '__doNotUseOrImplementIt'> {
  d(tag: string, message: string) {
    console.log(`${tag}: ${message}`);
  }
  e(tag: string, message: string) {
    console.error(`${tag}: ${message}`);
  }
}

export default AbacusLogger;
