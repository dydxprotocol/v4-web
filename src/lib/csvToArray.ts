const csvToArray = <T>({ stringVal, splitter }: { stringVal: string; splitter: string }) => {
  const [keys, ...rest] = stringVal
    .trim()
    .split('\n')
    .map((item) => item.split(splitter));

  const formedArr = rest.map((item) => {
    const object: Record<string, string> = {};
    keys.forEach((key, index) => (object[key] = item[index]));
    return object;
  });

  return formedArr as T;
};

export default csvToArray;
