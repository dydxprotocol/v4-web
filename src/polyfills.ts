import { Buffer } from 'buffer';

// @ts-ignore
globalThis.process ??= { env: {} }; // Minimal process polyfill
globalThis.global ??= globalThis;
globalThis.Buffer ??= Buffer;

declare global {
  interface WindowEventMap {
    'dydx:log': CustomEvent;
    'dydx:track': CustomEvent;
    'dydx:identify': CustomEvent;

    'abacus:connectNetwork': CustomEvent;
  }
}
