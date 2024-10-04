export function parseStorageItem<T>(data: string | null): T | undefined {
  if (!data) return undefined;

  try {
    return JSON.parse(data);
  } catch (_) {
    return undefined;
  }
}
