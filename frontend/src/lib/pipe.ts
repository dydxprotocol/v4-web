export {};

function pipe<TOut, TIn>(this: TIn, predicate: (value: TIn) => TOut): TOut {
  return predicate(this);
}

Object.defineProperty(Array.prototype, 'pipe', {
  value: pipe,
  writable: true,
  enumerable: false,
  configurable: true,
});

Object.defineProperty(String.prototype, 'pipe', {
  value: pipe,
  writable: true,
  enumerable: false,
  configurable: true,
});

Object.defineProperty(Number.prototype, 'pipe', {
  value: pipe,
  writable: true,
  enumerable: false,
  configurable: true,
});

Object.defineProperty(Boolean.prototype, 'pipe', {
  value: pipe,
  writable: true,
  enumerable: false,
  configurable: true,
});

Object.defineProperty(Object.prototype, 'pipe', {
  value: pipe,
  writable: true,
  enumerable: false,
  configurable: true,
});

declare global {
  interface Array<T> {
    /**
     * A utility method that enables pipeline-style function composition on arrays.
     * Instead of nesting function calls like `a(b(c(['x'])))`, you can chain them
     * using the more readable syntax: `['x'].pipe(c).pipe(b).pipe(a)`.
     *
     * This method applies a transformation function to the array and returns the result,
     * allowing you to chain multiple operations in a left-to-right, fluent style.
     *
     * @template TOut - The return type of the transformation function
     * @param {(items: T[]) => TOut} predicate - A function that takes the array and returns a transformed value
     * @returns {TOut} The result of applying the predicate function to this array
     *
     * @example
     * // Without .pipe() - nested function calls (hard to read)
     * const result = filterActive(sortByDate(mapToUsers(users)));
     *
     * // With .pipe() - pipeline style (easier to read)
     * const result = users
     *   .pipe(mapToUsers)
     *   .pipe(sortByDate)
     *   .pipe(filterActive);
     *
     * @example
     * // Inline functions
     * const sum = [1, 2, 3]
     *   .pipe(arr => arr.map(x => x * 2))
     *   .pipe(arr => arr.reduce((a, b) => a + b, 0));
     * // Returns: 12
     */
    pipe<TOut>(this: T[], predicate: (items: T[]) => TOut): TOut;
  }

  interface String {
    /**
     * A utility method that enables pipeline-style function composition on strings.
     * Applies a transformation function to the string and returns the result.
     *
     * @template TOut - The return type of the transformation function
     * @param {(value: string) => TOut} predicate - A function that takes the string and returns a transformed value
     * @returns {TOut} The result of applying the predicate function to this string
     *
     * @example
     * const result = "hello"
     *   .pipe(s => s.toUpperCase())
     *   .pipe(s => s.split(''))
     *   .pipe(arr => arr.length);
     * // Returns: 5
     */
    pipe<TOut>(this: string, predicate: (value: string) => TOut): TOut;
  }

  interface Number {
    /**
     * A utility method that enables pipeline-style function composition on numbers.
     * Applies a transformation function to the number and returns the result.
     *
     * @template TOut - The return type of the transformation function
     * @param {(value: number) => TOut} predicate - A function that takes the number and returns a transformed value
     * @returns {TOut} The result of applying the predicate function to this number
     *
     * @example
     * const result = (42)
     *   .pipe(n => n * 2)
     *   .pipe(n => n.toString())
     *   .pipe(s => s.length);
     * // Returns: 2
     */
    pipe<TOut>(this: number, predicate: (value: number) => TOut): TOut;
  }

  interface Boolean {
    /**
     * A utility method that enables pipeline-style function composition on booleans.
     * Applies a transformation function to the boolean and returns the result.
     *
     * @template TOut - The return type of the transformation function
     * @param {(value: boolean) => TOut} predicate - A function that takes the boolean and returns a transformed value
     * @returns {TOut} The result of applying the predicate function to this boolean
     *
     * @example
     * const result = true
     *   .pipe(b => !b)
     *   .pipe(b => b ? 'yes' : 'no');
     * // Returns: 'no'
     */
    pipe<TOut>(this: boolean, predicate: (value: boolean) => TOut): TOut;
  }

  interface Object {
    /**
     * A utility method that enables pipeline-style function composition on objects.
     * Applies a transformation function to the object and returns the result.
     *
     * @template TOut - The return type of the transformation function
     * @param {(value: this) => TOut} predicate - A function that takes the object and returns a transformed value
     * @returns {TOut} The result of applying the predicate function to this object
     *
     * @example
     * const result = { x: 1, y: 2 }
     *   .pipe(obj => obj.x + obj.y)
     *   .pipe(sum => sum * 2);
     * // Returns: 6
     */
    pipe<TOut>(this: Object, predicate: (value: this) => TOut): TOut;
  }
}
