import type { TurnkeyApiTypes } from '@turnkey/http';

export type TurnkeyWalletAccount =
  TurnkeyApiTypes['v1GetWalletAccountsResponse']['accounts'][number];

export type TurnkeyWallet = TurnkeyApiTypes['v1GetWalletsResponse']['wallets'][number] & {
  accounts: TurnkeyWalletAccount[];
};

export type UserSession = {
  id: string;
  name: string;
  email: string;
  organization: {
    organizationId: string;
    organizationName: string;
  };
};

export enum LoginMethod {
  Passkey = 'PASSKEY',
  Email = 'EMAIL',
  OAuth = 'OAUTH',
}

export enum HashFunction {
  NoOp = 'HASH_FUNCTION_NO_OP',
  SHA256 = 'HASH_FUNCTION_SHA256',
  KECCAK256 = 'HASH_FUNCTION_KECCAK256',
  NotApplicable = 'HASH_FUNCTION_NOT_APPLICABLE',
}

export enum PayloadEncoding {
  Hexadecimal = 'PAYLOAD_ENCODING_HEXADECIMAL',
  TextUTF8 = 'PAYLOAD_ENCODING_TEXT_UTF8',
}

export enum AddressFormat {
  Ethereum = 'ADDRESS_FORMAT_ETHEREUM',
  Solana = 'ADDRESS_FORMAT_SOLANA',
}

export type SignRawPayloadResult = TurnkeyApiTypes['v1SignRawPayloadResult'];

export type GoogleIdTokenPayload = {
  email?: string;
  email_verified?: boolean;
};

export type SignInBody =
  | {
      signinMethod: 'social' | 'passkey';
      targetPublicKey: string;
      provider: 'google' | 'apple';
      oidcToken: string;
      userEmail?: string;
    }
  | {
      signinMethod: 'email';
      targetPublicKey: string;
      userEmail: string;
      magicLink: string;
    };

export type TurnkeyEmailOnboardingData = {
  salt: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  dydxAddress?: string;
};

export type TurnkeyOAuthResponse = {
  session?: string;
  salt?: string;
  dydxAddress?: string;
};

export type TurnkeyEmailResponse = {
  apiKeyId?: string;
  userId?: string;
  organizationId?: string;
  salt?: string;
  dydxAddress?: string;
};
