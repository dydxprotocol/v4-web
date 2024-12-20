import { log } from '@/lib/telemetry';

export function logAbacusTsError(source: string, message: string, ...args: any[]) {
  log(`${source}: ${message}`, undefined, { context: args }, true);
}
