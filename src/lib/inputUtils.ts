export const numericValueRegex = /^\d*(?:\\[.])?\d*$/;
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
