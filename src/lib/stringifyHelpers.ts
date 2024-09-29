export function safeStringifyForAbacusParsing(arg: any): string {
  if (arg == null) {
    return '';
  }
  return JSON.stringify(arg);
}
