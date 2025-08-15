import { OtpType } from '@turnkey/sdk-react';
import { ApiKeyStamper, TurnkeyServerClient } from '@turnkey/sdk-server';
import { decode, JwtPayload } from 'jsonwebtoken';
import { getAddress } from 'viem';

import { Email, Wallet } from '@/types/turnkey';

const TURNKEY_API_PUBLIC_KEY = import.meta.env.VITE_TURNKEY_API_PUBLIC_KEY;
const TURNKEY_API_PRIVATE_KEY = import.meta.env.VITE_TURNKEY_API_PRIVATE_KEY;

const stamper = new ApiKeyStamper({
  apiPublicKey: TURNKEY_API_PUBLIC_KEY,
  apiPrivateKey: TURNKEY_API_PRIVATE_KEY,
});

const client = new TurnkeyServerClient({
  apiBaseUrl: import.meta.env.VITE_TURNKEY_API_BASE_URL,
  organizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,
  stamper,
});

const BASE_URL = (() => {
  if (import.meta.env.VITE_PUBLIC_WEBSITE_URL) {
    return import.meta.env.VITE_PUBLIC_WEBSITE_URL;
  }

  // Local development fallback
  return 'http://localhost:5173';
})();

type SiteConfig = {
  name: string;
  author: string;
  description: string;
  keywords: Array<string>;
  url: {
    base: string;
    author: string;
  };
  links: {
    github: string;
  };
  ogImage: string;
};

export const siteConfig: SiteConfig = {
  name: 'dYdX',
  author: '',
  description: 'dYdX Exchange',
  keywords: [],
  url: {
    base: BASE_URL,
    author: 'https://dydx.xyz',
  },
  links: {
    github: 'https://github.com/dydxprotocol/v4-web',
  },
  ogImage: `${BASE_URL}/og-image.png`,
};

export function decodeJwt(credential: string): JwtPayload | null {
  const decoded = decode(credential);

  if (decoded && typeof decoded === 'object' && 'email' in decoded) {
    return decoded as JwtPayload;
  }

  return null;
}

const getMagicLinkTemplate = (
  action: string,
  email: string,
  method: string,
  publicKey: string,
  baseUrl: string = siteConfig.url.base
) =>
  `${baseUrl}/email-${action}?userEmail=${email}&continueWith=${method}&publicKey=${publicKey}&credentialBundle=%s`;

export const initEmailAuth = async ({
  email,
  targetPublicKey,
  baseUrl,
}: {
  email: Email;
  targetPublicKey: string;
  baseUrl?: string;
}) => {
  const organizationId = await getSubOrgIdByEmail(email as Email);

  const magicLinkTemplate = getMagicLinkTemplate('auth', email, 'email', targetPublicKey, baseUrl);

  if (organizationId.length) {
    const authResponse = await client.initOtp({
      userIdentifier: targetPublicKey,
      otpType: OtpType.Email,
      contact: email,
      emailCustomization: {
        magicLinkTemplate,
      },
    });
    return authResponse;
  }

  return null;
};

export const verifyOtp = async ({
  otpId,
  otpCode,
}: {
  otpId: string;
  otpCode: string;
  publicKey: string;
}) => {
  const authResponse = await client.verifyOtp({
    otpId,
    otpCode,
  });

  return authResponse;
};

export const otpLogin = async ({
  publicKey,
  verificationToken,
  email,
}: {
  publicKey: string;
  verificationToken: string;
  email: Email;
}) => {
  const subOrgId = await getSubOrgIdByEmail(email);

  if (!subOrgId) {
    throw new Error('Could not find suborg by email');
  }

  const sessionResponse = await client.otpLogin({
    verificationToken,
    publicKey,
    organizationId: subOrgId,
  });

  return {
    userId: sessionResponse.activity.votes[0]?.userId,
    session: sessionResponse.session,
    organizationId: subOrgId,
  };
};

type EmailParam = { email: Email };
type PublicKeyParam = { publicKey: string };
type UsernameParam = { username: string };
type OidcTokenParam = { oidcToken: string };

export function getSubOrgId(param: EmailParam): Promise<string>;
export function getSubOrgId(param: PublicKeyParam): Promise<string>;
export function getSubOrgId(param: UsernameParam): Promise<string>;
export function getSubOrgId(param: OidcTokenParam): Promise<string>;

export async function getSubOrgId(
  param: EmailParam | PublicKeyParam | UsernameParam | OidcTokenParam
): Promise<string> {
  let filterType: string;
  let filterValue: string;

  if ('email' in param) {
    filterType = 'EMAIL';
    filterValue = param.email;
  } else if ('publicKey' in param) {
    filterType = 'PUBLIC_KEY';
    filterValue = param.publicKey;
  } else if ('username' in param) {
    filterType = 'USERNAME';
    filterValue = param.username;
  } else if ('oidcToken' in param) {
    filterType = 'OIDC_TOKEN';
    filterValue = param.oidcToken;
  } else {
    throw new Error('Invalid parameter');
  }

  const { organizationIds } = await client.getSubOrgIds({
    organizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,
    filterType,
    filterValue,
  });

  if (organizationIds[0] == null) {
    throw new Error('No organization ID found');
  }

  return organizationIds[0];
}

export const getSubOrgIdByEmail = async (email: Email) => {
  return getSubOrgId({ email });
};

export const getSubOrgIdByPublicKey = async (publicKey: string) => {
  return getSubOrgId({ publicKey });
};

export const getSubOrgIdByUsername = async (username: string) => {
  return getSubOrgId({ username });
};

export const getUser = async (userId: string, subOrgId: string) => {
  return client.getUser({
    organizationId: subOrgId,
    userId,
  });
};

export async function getWalletsWithAccounts(organizationId: string): Promise<Wallet[]> {
  const { wallets } = await client.getWallets({
    organizationId,
  });

  return Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await client.getWalletAccounts({
        organizationId,
        walletId: wallet.walletId,
      });

      const accountsWithBalance = await Promise.all(
        accounts
          .filter((account) => account.curve === 'CURVE_SECP256K1')
          .map(async ({ address, ...account }) => {
            return {
              ...account,
              address: getAddress(address),
              balance: undefined,
            };
          })
      );
      return { ...wallet, accounts: accountsWithBalance };
    })
  );
}

export const getWallet = async (walletId: string, organizationId: string): Promise<Wallet> => {
  const [{ wallet }, accounts] = await Promise.all([
    client.getWallet({ walletId, organizationId }),
    client.getWalletAccounts({ walletId, organizationId }).then(({ accounts: walletAccounts }) =>
      walletAccounts.map((account) => {
        return account;
      })
    ),
  ]);

  return { ...wallet, accounts };
};

export const getAuthenticators = async (userId: string, subOrgId: string) => {
  const { authenticators } = await client.getAuthenticators({
    organizationId: subOrgId,
    userId,
  });
  return authenticators;
};

export const getAuthenticator = async (authenticatorId: string, subOrgId: string) => {
  const { authenticator } = await client.getAuthenticator({
    organizationId: subOrgId,
    authenticatorId,
  });
  return authenticator;
};
