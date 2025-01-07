export function mergeById<T>(
  newItems: T[],
  existing: T[],
  getId: (item: T) => string | null | undefined
): T[] {
  const ids = new Set<string>();
  const merged: T[] = [];

  [...newItems, ...existing].forEach((item) => {
    const id = getId(item);
    if (id != null && !ids.has(id)) {
      ids.add(id);
      merged.push(item);
    }
  });

  return merged;
}
