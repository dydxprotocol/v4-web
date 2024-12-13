type SimpleMap<T> = { [key: string]: T };
export function mergeObjects<T>(one: SimpleMap<T>, two: SimpleMap<T>, merge: (a: T, b: T) => T) {
  const finalObj: SimpleMap<T> = {};

  [...Object.keys(one), ...Object.keys(two)].forEach((key) => {
    if (finalObj[key] != null) {
      return;
    }
    const obj = one[key];
    const otherObj = two[key];
    if (obj != null && otherObj != null) {
      finalObj[key] = merge(obj, otherObj);
    } else if (obj == null && otherObj == null) {
      // do nothing
    } else {
      // we know one of them is non-null
      finalObj[key] = (obj ?? otherObj)!;
    }
  });
  return finalObj;
}
