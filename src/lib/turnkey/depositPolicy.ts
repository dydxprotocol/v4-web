import type { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import {
  getAddress,
  hashTypedData,
  type Hex,
  isAddress,
  isAddressEqual,
  recoverAddress,
} from 'viem';

import { HashFunction, PayloadEncoding } from '@/types/turnkey';

import { isSimpleFetchError, simpleFetch } from '../simpleFetch';
import { removeTrailingSlash } from '../stringifyHelpers';
import {
  assertExpectedEnableTypedData,
  assertExpectedSolanaPolicy,
  DepositPolicyValidationError,
  getInjectiveMintRecipient,
} from './depositPolicyExpectations';

/**
 * The deposit policy of a Turnkey account: what the indexer may sign for the account in order to
 * bridge deposits made to its deposit addresses.
 *
 * Deposits are bridged over CCTP to the Injective account whose key the app holds, and sent on
 * to dYdX from there. The indexer cannot work that account out, so the app names it, and only
 * the account's user can permit bridging to it: for each EVM chain by signing typed data that
 * the indexer then stores, and for Solana by creating a policy in their Turnkey organization.
 * This is needed once for a new account, for an account set up for an earlier route, and again
 * if the app's Injective account were ever to change.
 */

export enum DepositPolicyStatus {
  UP_TO_DATE = 'UP_TO_DATE',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export type DepositPolicyEvmApproval = {
  chainId: string;
  status: DepositPolicyStatus;
  // Present when status is ACTION_REQUIRED
  typedData?: unknown;
};

export type DepositPolicy = {
  dydxAddress: string;
  // Where deposits arrive on Injective once the policy is approved: the account that was named
  // when the policy was fetched
  injectiveAddress: string;
  evm: {
    // The address of the key that signs the typed data
    address: string;
    approvals: DepositPolicyEvmApproval[];
  };
  solana: {
    status: DepositPolicyStatus;
    // Present when status is ACTION_REQUIRED
    policy?: unknown;
    // Policies for the earlier deposit route or for another Injective account
    obsoletePolicyIds: string[];
  };
};

export type DepositPolicySignature = { chainId: string; signature: Hex };

export class DepositPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DepositPolicyError';
  }
}

/** The parts of the Turnkey client of a signed-in user that syncing the policy needs. */
export type DepositPolicyTurnkeyClient = Pick<
  TurnkeyIndexedDbClient,
  'signRawPayload' | 'createPolicy' | 'deletePolicy'
>;

export type DepositPolicyTurnkeySession = {
  // The user's own Turnkey organization
  organizationId: string;
  client: DepositPolicyTurnkeyClient;
};

const POLICY_ID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

function isStatus(value: unknown): value is DepositPolicyStatus {
  return Object.values(DepositPolicyStatus).includes(value as DepositPolicyStatus);
}

function parseDepositPolicy(body: any): DepositPolicy {
  const approvals = body?.evm?.approvals;
  const obsoletePolicyIds = body?.solana?.obsoletePolicyIds;
  if (
    typeof body?.dydxAddress !== 'string' ||
    typeof body.injectiveAddress !== 'string' ||
    typeof body.evm?.address !== 'string' ||
    !Array.isArray(approvals) ||
    !approvals.every((a) => typeof a?.chainId === 'string' && isStatus(a.status)) ||
    !isStatus(body.solana?.status) ||
    !Array.isArray(obsoletePolicyIds) ||
    !obsoletePolicyIds.every((id) => typeof id === 'string')
  ) {
    throw new DepositPolicyError('unexpected deposit policy response');
  }
  return body;
}

async function toDepositPolicyError(error: unknown): Promise<DepositPolicyError> {
  if (!isSimpleFetchError(error)) {
    return new DepositPolicyError(error instanceof Error ? error.message : String(error));
  }
  const errorBody = await error.response.json().catch(() => undefined);
  return new DepositPolicyError(errorBody?.errors?.[0]?.msg ?? error.message);
}

/**
 * Fetches what the account still has to approve before its deposits are bridged to
 * `injectiveAddress`.
 *
 * @returns undefined if the indexer has no Turnkey account for the address, which is the case
 * until a new account has uploaded its address, or does not serve deposit policies.
 * @throws DepositPolicyError if the request fails otherwise.
 */
export async function fetchDepositPolicy({
  indexerUrl,
  dydxAddress,
  injectiveAddress,
}: {
  indexerUrl: string;
  dydxAddress: string;
  injectiveAddress: string;
}): Promise<DepositPolicy | undefined> {
  try {
    const query = new URLSearchParams({ injectiveAddress });
    return parseDepositPolicy(
      await simpleFetch(
        `${removeTrailingSlash(indexerUrl)}/v4/turnkey/depositPolicy/${dydxAddress}?${query}`
      )
    );
  } catch (error) {
    if (isSimpleFetchError(error) && error.response.status === 404) return undefined;
    if (error instanceof DepositPolicyError) throw error;
    throw await toDepositPolicyError(error);
  }
}

async function submitDepositPolicySignatures({
  indexerUrl,
  dydxAddress,
  injectiveAddress,
  signatures,
}: {
  indexerUrl: string;
  dydxAddress: string;
  injectiveAddress: string;
  signatures: DepositPolicySignature[];
}): Promise<string[]> {
  try {
    const response = await simpleFetch<{ approvedChainIds?: string[] }>(
      `${removeTrailingSlash(indexerUrl)}/v4/turnkey/depositPolicy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dydxAddress, injectiveAddress, signatures }),
      }
    );
    return response.approvedChainIds ?? [];
  } catch (error) {
    throw await toDepositPolicyError(error);
  }
}

/**
 * What the user still has to do. Removing policies for the earlier route is not required for
 * deposits to work, so it is reported separately.
 */
export function getPendingDepositPolicyActions(policy: DepositPolicy) {
  const evmApprovals = policy.evm.approvals.filter(
    (approval) => approval.status === DepositPolicyStatus.ACTION_REQUIRED
  );
  const needsSolanaPolicy = policy.solana.status === DepositPolicyStatus.ACTION_REQUIRED;
  return {
    evmApprovals,
    needsSolanaPolicy,
    isActionRequired: evmApprovals.length > 0 || needsSolanaPolicy,
    hasObsoletePolicies: policy.solana.obsoletePolicyIds.length > 0,
  };
}

/**
 * Signs a digest with the user's EVM key in Turnkey.
 *
 * Turnkey gives the recovery value as 0 or 1. The signature is stored by the indexer and later
 * checked by the user's smart account, which only accepts 27 or 28, so it is converted here.
 */
async function signDigest({
  client,
  organizationId,
  evmAddress,
  digest,
}: {
  client: DepositPolicyTurnkeyClient;
  organizationId: string;
  evmAddress: Hex;
  digest: Hex;
}): Promise<Hex> {
  const { r, s, v } = await client.signRawPayload({
    signWith: evmAddress,
    organizationId,
    payload: digest,
    encoding: PayloadEncoding.Hexadecimal,
    hashFunction: HashFunction.NoOp,
    timestampMs: Date.now().toString(),
  });
  const recovery = parseInt(v, 16);
  if (![0, 1, 27, 28].includes(recovery)) {
    throw new DepositPolicyError('unexpected signature from Turnkey');
  }
  const signature: Hex = `0x${r.padStart(64, '0')}${s.padStart(64, '0')}${(recovery < 27
    ? recovery + 27
    : recovery
  ).toString(16)}`;

  // The key in Turnkey must be the one the indexer will check the signature against.
  if (!isAddressEqual(await recoverAddress({ hash: digest, signature }), evmAddress)) {
    throw new DepositPolicyError('signature is not by the expected key');
  }
  return signature;
}

async function syncEvmApprovals({
  indexerUrl,
  dydxAddress,
  injectiveAddress,
  policy,
  evmAddress,
  turnkey,
}: {
  indexerUrl: string;
  dydxAddress: string;
  injectiveAddress: string;
  policy: DepositPolicy;
  evmAddress: Hex;
  turnkey: DepositPolicyTurnkeySession;
}): Promise<string[]> {
  const { evmApprovals } = getPendingDepositPolicyActions(policy);
  if (evmApprovals.length === 0) return [];

  // Checked here as well as up front, so that nothing is ever hashed without having been checked.
  const digests = evmApprovals.map(({ chainId, typedData }) => {
    assertExpectedEnableTypedData({
      typedData,
      chainId: Number(chainId),
      injectiveAddress,
      evmAddress,
    });
    return { chainId, digest: hashTypedData(typedData as Parameters<typeof hashTypedData>[0]) };
  });

  const signatures: DepositPolicySignature[] = [];
  // One at a time: each is a signing request to Turnkey.
  // eslint-disable-next-line no-restricted-syntax
  for (const { chainId, digest } of digests) {
    signatures.push({
      chainId,
      // eslint-disable-next-line no-await-in-loop
      signature: await signDigest({ ...turnkey, evmAddress, digest }),
    });
  }
  // The indexer checks the signatures against the same address, and from then on bridges the
  // account's deposits to it.
  return submitDepositPolicySignatures({ indexerUrl, dydxAddress, injectiveAddress, signatures });
}

async function syncSolanaPolicy({
  injectiveAddress,
  policy,
  turnkey: { client, organizationId },
}: {
  injectiveAddress: string;
  policy: DepositPolicy;
  turnkey: DepositPolicyTurnkeySession;
}): Promise<{ created: boolean; deletedPolicyIds: string[] }> {
  const { needsSolanaPolicy } = getPendingDepositPolicyActions(policy);
  if (needsSolanaPolicy) {
    await client.createPolicy({
      organizationId,
      ...assertExpectedSolanaPolicy({ policy: policy.solana.policy, injectiveAddress }),
    });
  } else if (policy.solana.status !== DepositPolicyStatus.UP_TO_DATE) {
    // Without the new policy in place, leave the account as it is.
    return { created: false, deletedPolicyIds: [] };
  }

  // The policies for the earlier route or for another Injective account are no longer needed.
  // Removing one only ever takes a permission away, and failing to is harmless, so it does not
  // fail the sync.
  const deletedPolicyIds: string[] = [];
  const obsoletePolicyIds = policy.solana.obsoletePolicyIds.filter((id) =>
    POLICY_ID_PATTERN.test(id)
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const policyId of obsoletePolicyIds) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await client.deletePolicy({ organizationId, policyId });
      deletedPolicyIds.push(policyId);
    } catch (error) {
      // Left in place; it is reported again the next time the policy is fetched.
    }
  }
  return { created: needsSolanaPolicy, deletedPolicyIds };
}

/**
 * Checks that everything a deposit policy asks the user to approve is exactly what is expected
 * for bridging the deposits of `dydxAddress` to `injectiveAddress`.
 *
 * @param expectedEvmAddress the address of the user's EVM key in Turnkey, if it is known.
 * @returns the address of the key that signs the approvals.
 * @throws DepositPolicyValidationError if the policy is for another account or asks for
 * anything unexpected. Nothing in it must then be signed or created.
 */
export function assertExpectedDepositPolicy({
  policy,
  dydxAddress,
  injectiveAddress,
  expectedEvmAddress,
}: {
  policy: DepositPolicy;
  dydxAddress: string;
  injectiveAddress: string;
  expectedEvmAddress?: string;
}): { evmAddress: Hex } {
  // Throws if it is not the address of an Injective account.
  getInjectiveMintRecipient(injectiveAddress);
  // An indexer that does not take the address the app names answers for another one.
  if (policy.dydxAddress !== dydxAddress || policy.injectiveAddress !== injectiveAddress) {
    throw new DepositPolicyValidationError('deposit policy is for another account');
  }
  if (
    !isAddress(policy.evm.address) ||
    (expectedEvmAddress != null &&
      (!isAddress(expectedEvmAddress) || !isAddressEqual(policy.evm.address, expectedEvmAddress)))
  ) {
    throw new DepositPolicyValidationError('deposit policy is for another wallet');
  }
  const evmAddress = getAddress(policy.evm.address);

  const { evmApprovals, needsSolanaPolicy } = getPendingDepositPolicyActions(policy);
  evmApprovals.forEach(({ chainId, typedData }) =>
    assertExpectedEnableTypedData({
      typedData,
      chainId: Number(chainId),
      injectiveAddress,
      evmAddress,
    })
  );
  if (needsSolanaPolicy) {
    assertExpectedSolanaPolicy({ policy: policy.solana.policy, injectiveAddress });
  }
  return { evmAddress };
}

export type DepositPolicySyncResult = {
  approvedChainIds: string[];
  solanaPolicyCreated: boolean;
  deletedPolicyIds: string[];
};

/**
 * Brings the account's deposit policy up to date, using the Turnkey session of its signed-in
 * user: signs the approvals the indexer asks for and hands them over, creates the Solana policy,
 * and removes the policies that are no longer needed.
 *
 * Nothing the indexer sends is signed or created as it is. Each request is checked to be exactly
 * the policy expected for bridging to `injectiveAddress`, and the whole sync is refused if
 * anything differs.
 *
 * @param injectiveAddress the Injective account whose key the app holds, which was named when
 * `policy` was fetched. Deposits are bridged to it from then on.
 * @param expectedEvmAddress the address of the user's EVM key in Turnkey, if it is known.
 * @throws DepositPolicyValidationError if the indexer asks for anything unexpected.
 * @throws DepositPolicyError if signing, storing or creating fails. The EVM chains and Solana
 * are synced independently, so one may have succeeded.
 */
export async function syncDepositPolicy({
  indexerUrl,
  dydxAddress,
  injectiveAddress,
  policy,
  turnkey,
  expectedEvmAddress,
}: {
  indexerUrl: string;
  dydxAddress: string;
  injectiveAddress: string;
  policy: DepositPolicy;
  turnkey: DepositPolicyTurnkeySession;
  expectedEvmAddress?: string;
}): Promise<DepositPolicySyncResult> {
  // Everything is checked up front, so that an unexpected request stops the sync before
  // anything is signed or created.
  const { evmAddress } = assertExpectedDepositPolicy({
    policy,
    dydxAddress,
    injectiveAddress,
    expectedEvmAddress,
  });

  const [evm, solana] = await Promise.allSettled([
    syncEvmApprovals({ indexerUrl, dydxAddress, injectiveAddress, policy, evmAddress, turnkey }),
    syncSolanaPolicy({ injectiveAddress, policy, turnkey }),
  ]);
  const failure = [evm, solana].find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected') {
    const { reason } = failure;
    throw reason instanceof DepositPolicyError || reason instanceof DepositPolicyValidationError
      ? reason
      : new DepositPolicyError(reason instanceof Error ? reason.message : String(reason));
  }
  return {
    approvedChainIds: evm.status === 'fulfilled' ? evm.value : [],
    solanaPolicyCreated: solana.status === 'fulfilled' && solana.value.created,
    deletedPolicyIds: solana.status === 'fulfilled' ? solana.value.deletedPolicyIds : [],
  };
}
