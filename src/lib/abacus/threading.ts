import type { AbacusThreadingProtocol, ThreadingType } from '@/constants/abacus';

class AbacusThreading implements AbacusThreadingProtocol {
  async(type: ThreadingType, block: () => void) {
    block();
  }
}

export default AbacusThreading;
