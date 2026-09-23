export const getVisibleData = <Datum>(
  data: Datum[],
  xAccessor: (datum: Datum) => number,
  domain: readonly [number, number]
) => {
  const findBoundary = (target: number, includeEqual: boolean) => {
    let low = 0;
    let high = data.length;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const value = xAccessor(data[middle]!);
      if (value < target || (includeEqual && value === target)) low = middle + 1;
      else high = middle;
    }

    return low;
  };

  return data.slice(findBoundary(domain[0], false), findBoundary(domain[1], true));
};
