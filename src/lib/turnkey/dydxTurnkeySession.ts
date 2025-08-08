import { ApiKeyStamper } from '@turnkey/api-key-stamper';
import { TurnkeyApi, TurnkeyClient } from '@turnkey/http';
import { hashTypedData } from 'viem/utils';

export type TurnkeyConfigs = {
  googleClientId: string;
  appScheme: string;
  turnkeyUrl: string;
  turnkeyOrgId: string;
  backendApiUrl: string;
  theme: 'light' | 'dark' | 'classicDark' | undefined;
  strings: Record<string, string>;
};

export class DydxTurnkeySession {
  private stamper: ApiKeyStamper;

  private client: TurnkeyClient;

  private organizationId: string;

  private userId: string;

  walletAccounts: TurnkeyApi.TGetWalletAccountsResponse | null = null;

  constructor(
    privateKey: string,
    publicKey: string,
    configs: TurnkeyConfigs,
    organizationId: string,
    userId: string
  ) {
    this.stamper = new ApiKeyStamper({
      apiPublicKey: publicKey,
      apiPrivateKey: privateKey,
    });

    this.client = new TurnkeyClient({ baseUrl: configs.turnkeyUrl }, this.stamper);

    this.organizationId = organizationId;
    this.userId = userId;
  }

  static createFromSession = (
    privateKey: string,
    jwtToken: string,
    configs: TurnkeyConfigs
  ): DydxTurnkeySession => {
    const decodedSession = decodeSessionJwt(jwtToken);
    if (!decodedSession.publicKey || !decodedSession.organizationId || !decodedSession.userId) {
      throw new Error('Invalid session JWT: Missing public key organizationId userId');
    }

    // Create a new instance of DydxTurnkeySession with the provided private key and decoded public key
    return new DydxTurnkeySession(
      privateKey,
      decodedSession.publicKey,
      configs,
      decodedSession.organizationId,
      decodedSession.userId
    );
  };

  loadWalletAccounts = async (): Promise<TurnkeyApi.TGetWalletAccountsResponse> => {
    if (this.walletAccounts) {
      return Promise.resolve(this.walletAccounts);
    }

    const wallets = await this.getWallets();
    if (wallets.wallets.length === 0 || wallets.wallets[0] == null) {
      throw new Error('No wallets found for the user.');
    }
    const response = await this.getWalletAccounts(wallets.wallets[0].walletId);
    if (response.accounts.length === 0) {
      throw new Error('No wallet accounts found for the user.');
    }

    this.walletAccounts = response;
    return Promise.resolve(response);
  };

  signOnboardingMessage = async (walletAccountAddress: string, salt: string): Promise<string> => {
    const onboardingTypedData = {
      primaryType: 'dYdX' as const,
      domain: {
        name: 'dYdX Chain',
      },
      types: {
        dYdX: [
          { name: 'action', type: 'string' },
          { name: 'salt', type: 'string' },
        ],
      },
      message: {
        action: 'dYdX Chain Onboarding',
        salt,
      },
    };

    // Hash the typed message, keccak256 encoded
    const digest = hashTypedData(onboardingTypedData);

    const response = await this.client.signRawPayload({
      type: 'ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2',
      /** @description Timestamp (in milliseconds) of the request, used to verify liveness of user requests. */
      timestampMs: Date.now().toString(),
      organizationId: this.organizationId,
      parameters: {
        signWith: walletAccountAddress,
        payload: digest,
        encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
        hashFunction: 'HASH_FUNCTION_NO_OP',
      },
    });

    if (!response.activity.result.signRawPayloadResult) {
      throw new Error('Failed to sign onboarding message');
    }

    const signature = response.activity.result.signRawPayloadResult;

    return Promise.resolve(signature.r + signature.s + signature.v); // Concatenate r, s, and v to form the full signature=
  };

  private getUser = async (): Promise<TurnkeyApi.TGetWhoamiResponse> => {
    const response = await this.client.getWhoami({
      organizationId: this.organizationId,
    });

    return Promise.resolve(response);
  };

  private getWallets = async (): Promise<TurnkeyApi.TGetWalletsResponse> => {
    const response = await this.client.getWallets({
      organizationId: this.organizationId,
    });

    return Promise.resolve(response);
  };

  private getWalletAccounts = async (
    walletId: string
  ): Promise<TurnkeyApi.TGetWalletAccountsResponse> => {
    const response = await this.client.getWalletAccounts({
      organizationId: this.organizationId,
      walletId,
    });

    return Promise.resolve(response);
  };
}

const decodeSessionJwt = (token: string) => {
  const [, payload] = token.split('.');
  if (!payload) {
    throw new Error('Invalid JWT: Missing payload');
  }

  const decoded = JSON.parse(atob(payload));
  const {
    exp,
    public_key: publicKey,
    session_type: sessionType,
    user_id: userId,
    organization_id: organizationId,
  } = decoded;

  if (!exp || !publicKey || !sessionType || !userId || !organizationId) {
    throw new Error('JWT payload missing required fields');
  }

  return {
    sessionType,
    userId,
    organizationId,
    expiry: exp,
    publicKey,
  };
};
