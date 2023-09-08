import type { AbacusLocalizerProtocol } from '@/constants/abacus';

class AbacusLocalizer implements Omit<AbacusLocalizerProtocol, '__doNotUseOrImplementIt'> {
  localize(path: string, paramsAsJson: string): string {
    return path;
  }
}

export default AbacusLocalizer;
