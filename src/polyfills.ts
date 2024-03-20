import { Buffer } from 'buffer';

globalThis.process = globalThis.process || { env: {} }; // Minimal process polyfill
globalThis.global = globalThis.global || globalThis;
globalThis.Buffer = globalThis.Buffer || Buffer;

declare global {
  interface WindowEventMap {
    'dydx:log': CustomEvent;
    'dydx:track': CustomEvent;
    'dydx:identify': CustomEvent;

    'abacus:connectNetwork': CustomEvent;
  }

  var Intercom: any;
}
