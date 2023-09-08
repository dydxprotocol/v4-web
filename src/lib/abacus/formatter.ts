import type { AbacusFormatterProtocol } from '@/constants/abacus';

import { type LocaleSeparators, MustBigNumber, getFractionDigits } from '../numbers';

class AbacusFormatter implements AbacusFormatterProtocol {
  localeSeparators: LocaleSeparators;

  constructor() {
    this.localeSeparators = { group: ',', decimal: '.' };
  }

  setLocaleSeparators({ group, decimal }: LocaleSeparators) {
    this.localeSeparators = { group, decimal };
  }

  percent(value: number, digits: number): string {
    return MustBigNumber(value).toFixed(digits);
  }

  dollar(value: number, tickSize: string): string {
    const tickSizeDecimals = getFractionDigits(tickSize);
    return MustBigNumber(value).toFixed(tickSizeDecimals);
  }
}

export default AbacusFormatter;
