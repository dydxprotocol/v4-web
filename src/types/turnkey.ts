import { TurnkeyApiTypes } from '@turnkey/http';

export type Attestation = TurnkeyApiTypes['v1Attestation'];

export type Email = `${string}@${string}.${string}`;

export type Account = TurnkeyApiTypes['v1GetWalletAccountsResponse']['accounts'][number];

export type Wallet = TurnkeyApiTypes['v1GetWalletsResponse']['wallets'][number] & {
  accounts: Account[];
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

export type Authenticator =
  TurnkeyApiTypes['v1GetAuthenticatorsResponse']['authenticators'][number];

export type PreferredWallet = {
  userId: string;
  walletId: string;
};

export interface ReadOnlySession {
  session: string;
  sessionExpiry: number;
}

export type OauthProviderParams = TurnkeyApiTypes['v1OauthProviderParams'];

export enum LoginMethod {
  Passkey = 'PASSKEY',
  Email = 'EMAIL',
  OAuth = 'OAUTH',
}

export enum OtpType {
  Email = 'OTP_TYPE_EMAIL',
  Sms = 'OTP_TYPE_SMS',
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

export type SignRawPayloadResult = TurnkeyApiTypes['v1SignRawPayloadResult'];

export type GoogleIdTokenPayload = {
  email?: string;
  email_verified?: boolean;
};

export type SignInBody = {
  signinMethod: 'social' | 'passkey' | 'email';
  targetPublicKey: string;
  provider: 'google' | 'apple';
  oidcToken: string;
  userEmail?: string;
};
