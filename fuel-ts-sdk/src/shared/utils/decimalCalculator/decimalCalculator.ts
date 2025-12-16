import { DecimalValue, DecimalValueCtor, HeadlessDecimalValue } from '../../models/decimalValue';
import { Formula } from './formula';

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

  static first(value: DecimalValue) {
    return this.initializeWithValue(value);
  }

  static value(value: DecimalValue) {
    return this.initializeWithValue(value);
  }

  static inNumerator(
    builder: DecimalCalculator | ((builder: DecimalCalculator) => DecimalCalculator)
  ) {
    const builtFormula = typeof builder === 'function' ? builder(new DecimalCalculator()) : builder;
    if (!!builtFormula.denominatorFormula)
      throw new Error('Nominator formula cannot have nested denominator formulas');

    return new DecimalCalculator(builtFormula.numeratorFormula);
  }

  private static initializeWithValue(value: DecimalValue) {
    return new DecimalCalculator().populateFormula(value);
  }

  value(value: DecimalValue) {
    if (this.currentFormula.hasElements())
      throw new Error('Cannot initialize a populated formula.');
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  multiplyBy(value: DecimalValue) {
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement('mul');
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  add(value: DecimalValue) {
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement('add');
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  subtractBy(value: DecimalValue) {
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement('sub');
    calculator.currentFormula.addElement(value);
    return calculator;
  }

  divideBy(value: DecimalValue) {
    if (!this.numeratorFormula.hasElements())
      throw new Error('Denominator cannot be invoked before numerator');
    if (!!this.denominatorFormula) throw new Error('Illegal consecutive denominator invocation');

    const calc = this.deepCopy();
    calc.denominatorFormula = new Formula([value]);
    return calc;
  }

  inDenominator(builder: DecimalCalculator | ((builder: DecimalCalculator) => DecimalCalculator)) {
    if (!this.numeratorFormula.hasElements())
      throw new Error('Denominator cannot be invoked before numerator');
    if (!!this.denominatorFormula) throw new Error('Illegal consecutive denominator invocation');

    const builtFormula = typeof builder === 'function' ? builder(new DecimalCalculator()) : builder;
    if (!!builtFormula.denominatorFormula)
      throw new Error('Denominator formula cannot have nested denominator formulas');

    const calc = this.deepCopy();
    calc.denominatorFormula = builtFormula.numeratorFormula;
    return calc;
  }

  calculate<T extends DecimalValue>(DecimalValueConstructor: DecimalValueCtor<T>): T {
    const numeratorResult = this.numeratorFormula.calculate();
    if (!this.denominatorFormula) return numeratorResult.adjustTo(DecimalValueConstructor);

    const denominatorResult = this.denominatorFormula.calculate();

    const scaleFactor = 2n * denominatorResult.decimals;
    const resultNumerator = (numeratorResult.value * 10n ** scaleFactor) / denominatorResult.value;
    const resultDecimals = numeratorResult.decimals + denominatorResult.decimals;

    return new HeadlessDecimalValue(resultNumerator, resultDecimals).adjustTo(
      DecimalValueConstructor
    );
  }

  private populateFormula(value: DecimalValue) {
    if (this.currentFormula.hasElements()) throw new Error('Formula has already been populated');
    const calculator = this.deepCopy();
    calculator.currentFormula.addElement(value);
    return calculator;
  }
}
