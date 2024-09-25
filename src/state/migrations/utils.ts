export function parseStorageItem(data: string | null) {
  if (!data) return undefined;

  try {
    return JSON.parse(data);
  } catch (_) {
    return undefined;
  }
}
