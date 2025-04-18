// untyped helper function that lets you transform a recursive object whose leaves are functions
export function transformOntologyObject<T>(
  obj: any,
  transformer: (func: (...args: any[]) => any, path: string) => T,
  basePath: string = ''
): any {
  const result: {
    [key: string]: any;
  } = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const path = `${basePath}.${key}`;

      if (typeof value === 'function') {
        result[key] = transformer(value, path);
      } else if (typeof value === 'object') {
        result[key] = transformOntologyObject(value, transformer, path);
      }
    }
  }

  return result;
}
