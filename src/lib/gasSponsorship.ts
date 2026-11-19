import { timeUnits } from '@/constants/time';

import { isSimpleFetchError, simpleFetch } from './simpleFetch';
import { removeTrailingSlash } from './stringifyHelpers';
import { sleep } from './timeUtils';

export enum GasSponsorshipStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
}

export enum GasSponsorshipErrorCode {
  DISABLED = 'GAS_SPONSORSHIP_DISABLED',
  INVALID_ADDRESS = 'GAS_SPONSORSHIP_INVALID_ADDRESS',
  INSUFFICIENT_USDC_BALANCE = 'GAS_SPONSORSHIP_INSUFFICIENT_USDC_BALANCE',
  ALREADY_HAS_GAS = 'GAS_SPONSORSHIP_ALREADY_HAS_GAS',
  COOLDOWN = 'GAS_SPONSORSHIP_COOLDOWN',
  BUDGET_EXHAUSTED = 'GAS_SPONSORSHIP_BUDGET_EXHAUSTED',
  BASE_FEE_TOO_HIGH = 'GAS_SPONSORSHIP_BASE_FEE_TOO_HIGH',
  DEPOSITS_CLOSED = 'GAS_SPONSORSHIP_DEPOSITS_CLOSED',
  SPONSOR_UNDERFUNDED = 'GAS_SPONSORSHIP_SPONSOR_UNDERFUNDED',
  BUSY = 'GAS_SPONSORSHIP_BUSY',
  CHAIN_UNAVAILABLE = 'GAS_SPONSORSHIP_CHAIN_UNAVAILABLE',
  GRANT_FAILED = 'GAS_SPONSORSHIP_GRANT_FAILED',
}

export type GasSponsorshipGrant = {
  chainId: string;
  // The address to set as the fee granter of the sponsored transaction
  granter: string;
  grantee: string;
  feeDenom: string;
  // What the grantee may still spend on fees, in the smallest unit of feeDenom
  spendLimit: string;
  expiresAt: string;
  allowedMessages: string[];
  status: GasSponsorshipStatus;
  transactionHash?: string;
  // A transaction whose fee is at most gasLimit * gasPrice fits within the allowance
  gasLimit: string;
  gasPrice: string;
};

export class GasSponsorshipError extends Error {
  constructor(
    message: string,
    public code?: GasSponsorshipErrorCode
  ) {
    super(message);
    this.name = 'GasSponsorshipError';
  }
}

// The endpoint already waits for the grant to confirm before answering PENDING, and is rate
// limited to 5 requests a minute, so a few spaced-out attempts are enough
const MAX_REQUEST_ATTEMPTS = 4;
const PENDING_RETRY_DELAY = 5 * timeUnits.second;

async function postGasSponsorship(
  indexerUrl: string,
  body: { address: string; injectiveAddress: string }
): Promise<GasSponsorshipGrant> {
  try {
    return await simpleFetch<GasSponsorshipGrant>(
      `${removeTrailingSlash(indexerUrl)}/v4/gasSponsorship`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  } catch (error) {
    if (!isSimpleFetchError(error)) throw error;
    const errorBody = await error.response.json().catch(() => undefined);
    const firstError = errorBody?.errors?.[0];
    throw new GasSponsorshipError(firstError?.msg ?? error.message, firstError?.code);
  }
}

/**
 * Requests a fee allowance for `injectiveAddress` and resolves once it can be used.
 *
 * @throws GasSponsorshipError if the address is refused or the allowance is still not confirmed
 * after a few attempts.
 */
export async function requestGasSponsorship({
  indexerUrl,
  dydxAddress,
  injectiveAddress,
}: {
  indexerUrl: string;
  dydxAddress: string;
  injectiveAddress: string;
}): Promise<GasSponsorshipGrant> {
  for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const grant = await postGasSponsorship(indexerUrl, {
      address: dydxAddress,
      injectiveAddress,
    });
    if (grant.status === GasSponsorshipStatus.CONFIRMED) return grant;

    // eslint-disable-next-line no-await-in-loop
    if (attempt < MAX_REQUEST_ATTEMPTS) await sleep(PENDING_RETRY_DELAY);
  }

  throw new GasSponsorshipError('Gas sponsorship is taking longer than expected. Please retry.');
}
