import type { AbacusFormatterProtocol } from '@/constants/abacus';

class AbacusFormatter implements AbacusFormatterProtocol {
  percent(value: number, digits: number): string {
    return value.toString();
  }

  dollar(value: number, tickSize: string): string {
    return value.toString();
  }
}

export default AbacusFormatter;
