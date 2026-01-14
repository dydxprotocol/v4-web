import { DecimalValue, HeadlessDecimalValue } from '../../models/DecimalValue';

export class Formula {
  constructor(private elements: FormulaElement[] = []) {}

  copy() {
    return new Formula([...this.elements]);
  }

  hasElements() {
    return this.elements.length > 0;
  }

  addElement(element: FormulaElement) {
    this.elements.push(element);
  }

  calculate() {
    let numerator: bigint = 0n;
    let decimalExponent: bigint = 0n;

    this.elements.forEach((event, idx) => {
      // Even indices (0, 2, 4...) are DecimalValue elements
      if (idx % 2 === 0) {
        numerator = this.processNumerator(event, idx, numerator, decimalExponent);
        decimalExponent = this.processExponent(event, idx, decimalExponent);
      }
      // Odd indices (1, 3, 5...) are operation strings ('mul', 'add', 'sub', 'div')
      // These are handled by processNumerator when processing the next element
    });

    return new HeadlessDecimalValue(numerator, decimalExponent);
  }

  private processNumerator(
    event: FormulaElement,
    idx: number,
    numerator: bigint,
    decimalExponent: bigint
  ): bigint {
    if (!(event instanceof DecimalValue)) throw new Error('Expected DecimalValue');
    if (idx === 0) return event.value;

    const operation = this.elements[idx - 1] as NumeratorOperation;
    let a = numerator;
    let b = event.value;

    if (operation === 'div') return a / b;
    if (operation === 'mul') return a * b;

    const aDecimals = decimalExponent;
    const bDecimals = event.decimals;
    [a, b] = this.scaleOperandsToMatch(a, aDecimals, b, bDecimals);

    if (operation === 'add') return a + b;
    if (operation === 'sub') return a - b;
    throw new Error('Unknown operation');
  }

  private processExponent(event: FormulaElement, idx: number, decimalExponent: bigint): bigint {
    if (!(event instanceof DecimalValue)) throw new Error('Expected DecimalValue');
    const iteratedExponent = event.decimals;
    if (idx === 0) return iteratedExponent;

    const operation = this.elements[idx - 1] as NumeratorOperation;
    const ad = decimalExponent;
    const bd = iteratedExponent;

    switch (operation) {
      case 'div':
        return ad - bd;
      case 'mul':
        return ad + bd;
      case 'add':
      case 'sub':
        return ad > bd ? ad : bd;
    }
  }

  private scaleOperandsToMatch(
    a: bigint,
    aDecimals: bigint,
    b: bigint,
    bDecimals: bigint
  ): [bigint, bigint] {
    if (aDecimals < bDecimals) {
      return [a * 10n ** (bDecimals - aDecimals), b];
    } else if (bDecimals < aDecimals) {
      return [a, b * 10n ** (aDecimals - bDecimals)];
    }
    return [a, b];
  }
}

export type FormulaElement = bigint | 'mul' | 'div' | 'add' | 'sub' | DecimalValue;
export type NumeratorOperation = 'mul' | 'div' | 'add' | 'sub';
