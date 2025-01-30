import { log, logInfo } from '@/lib/telemetry';

export function logBonsaiError(source: string, message: string, ...args: any[]) {
  log(`bonsai: ${source}: ${message}`, args[0]?.error, { context: args });
}

export function logBonsaiInfo(source: string, message: string, ...args: any[]) {
  logInfo(`bonsai: ${source}: ${message}`, { context: args });
}
