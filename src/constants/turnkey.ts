import type { TurnkeyProvider } from '@turnkey/sdk-react';

export const TURNKEY_CONFIG: Parameters<typeof TurnkeyProvider>[0]['config'] = {
  apiBaseUrl: import.meta.env.VITE_TURNKEY_API_BASE_URL,
  defaultOrganizationId: import.meta.env.VITE_TURNKEY_PUBLIC_ORGANIZATION_ID,
};
