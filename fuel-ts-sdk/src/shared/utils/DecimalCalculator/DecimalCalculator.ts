import type { DecimalValueInstance, DecimalValueSchema } from '../../models/DecimalValue';
import { $decimalValue, DecimalValue } from '../../models/DecimalValue';
import { Formula } from './Formula';

export class DecimalCalculator {
  get then() {
    return this;
  }

  private get currentFormula() {
    return this.denominatorFormula ?? this.numeratorFormula;
  }

  private constructor(
    private readonly numeratorFormula: Formula = new Formula(),
    private denominatorFormula?: Formula
  ) {}

  private deepCopy() {
    return new DecimalCalculator(this.numeratorFormula.copy(), this.denominatorFormula?.copy());
  }

  static first(value: DecimalValueInstance) {
    return this.initializeWithValue(value);
  }

  static value(value: DecimalValueInstance) {
    return this.initializeWithValue(value);
  }

  static inNumerator(
    builder: DecimalCalculator | ((builder: DecimalCalculator) => DecimalCalculator)
  ) {
    const builtFormula = typeof builder === 'function' ? builder(new DecimalCalculator()) : builder;
    if (builtFormula.denominatorFormula)
      throw new Error('Nominator formula cannot have nested denominator formulas');

    return new DecimalCalculator(builtFormula.numeratorFormula);
  }

  private static initializeWithValue(value: DecimalValueInstance) {
    return new DecimalCalculator().populateFormula(value);
  }

  value(value: DecimalValueInstance) {
    if (this.currentFormula.hasElements())
      throw new Error('Cannot initialize a populated formula.');
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  multiplyBy(value: DecimalValueInstance) {
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement('mul');
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  add(value: DecimalValueInstance) {
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement('add');
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  subtractBy(value: DecimalValueInstance) {
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement('sub');
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  divideBy(value: DecimalValueInstance) {
    if (!this.numeratorFormula.hasElements())
      throw new Error('Denominator cannot be invoked before numerator');
    if (this.denominatorFormula) throw new Error('Illegal consecutive denominator invocation');

    const calc = this.deepCopy();
    calc.denominatorFormula = new Formula([value]);
    return calc;
  }

  inDenominator(builder: DecimalCalculator | ((builder: DecimalCalculator) => DecimalCalculator)) {
    if (!this.numeratorFormula.hasElements())
      throw new Error('Denominator cannot be invoked before numerator');
    if (this.denominatorFormula) throw new Error('Illegal consecutive denominator invocation');

    const builtFormula = typeof builder === 'function' ? builder(new DecimalCalculator()) : builder;
    if (builtFormula.denominatorFormula)
      throw new Error('Denominator formula cannot have nested denominator formulas');

    const calc = this.deepCopy();
    calc.denominatorFormula = builtFormula.numeratorFormula;
    return calc;
  }

  calculate<TDecimals extends number, TBrand extends string>(
    decimalValueSchema: DecimalValueSchema<TDecimals, TBrand> = DecimalValue as DecimalValueSchema<
      TDecimals,
      TBrand
    >
  ): DecimalValueInstance<TDecimals, TBrand> {
    const numeratorResult = this.numeratorFormula.calculate();

    if (!this.denominatorFormula)
      return $decimalValue(numeratorResult).adjustTo(decimalValueSchema);
    const denominatorResult = this.denominatorFormula.calculate();

    const scaleFactor = 2n * BigInt(denominatorResult.decimals);
    const resultNumerator =
      (BigInt(numeratorResult.value) * 10n ** scaleFactor) / BigInt(denominatorResult.value);
    const resultDecimals = numeratorResult.decimals + denominatorResult.decimals;

    return $decimalValue({
      decimals: resultDecimals,
      value: resultNumerator.toString(),
    }).adjustTo(decimalValueSchema);
  }

  private populateFormula(value: DecimalValueInstance) {
    if (this.currentFormula.hasElements()) throw new Error('Formula has already been populated');
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement(value);
    return calculator;
  }
}
