export function safeStringifyForAbacusParsing(arg: any): string {
  if (arg == null) {
    return '';
  }
  return JSON.stringify(arg);
}

export function removeTrailingSlash(str: string) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}
