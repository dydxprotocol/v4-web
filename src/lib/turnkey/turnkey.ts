export const turnkeyConfig = {
  apiBaseUrl: import.meta.env.VITE_TURNKEY_API_BASE_URL,
  defaultOrganizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,
  iframeUrl: 'https://auth.turnkey.com',
};

export const turnkeyAuthConfig = {
  authConfig: {
    emailEnabled: true,
    // Set the rest to false to disable them
    passkeyEnabled: false,
    phoneEnabled: false,
    appleEnabled: false,
    facebookEnabled: false,
    googleEnabled: false,
    walletEnabled: false,
  },
  // The order of the auth methods to display in the UI
  configOrder: ['email' /* "passkey", "phone", "socials" */],
};
