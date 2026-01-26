/// <reference types="@testing-library/jest-dom" />
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, expect, vi } from 'vitest';

expect.extend(matchers);

// Mock environment variables for tests
vi.stubEnv(
  'VITE_VAULT_CONTRACT_IDS',
  JSON.stringify({
    local: '0x0000000000000000000000000000000000000000000000000000000000000000',
    testnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
  })
);
vi.stubEnv(
  'VITE_INDEXER_URLS',
  JSON.stringify({
    local: 'http://localhost:8080',
    testnet: 'https://testnet.example.com',
  })
);
vi.stubEnv('VITE_DEFAULT_ENVIRONMENT', 'local');
vi.stubEnv(
  'VITE_RPC_URLS',
  JSON.stringify({
    local: 'http://localhost:4000/v1/graphql',
    testnet: 'https://testnet.fuel.network/v1/graphql',
  })
);
vi.stubEnv(
  'VITE_CHAIN_IDS',
  JSON.stringify({
    local: 0,
    testnet: 0,
  })
);
vi.stubEnv('VITE_ENV', 'dev');

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Polyfill for Radix UI hasPointerCapture
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false;
    };
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {};
  }
});

afterEach(() => {
  cleanup();
});
