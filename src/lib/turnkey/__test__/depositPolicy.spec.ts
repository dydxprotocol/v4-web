import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { hashTypedData, type Hex, recoverAddress, toHex } from 'viem';
import { generatePrivateKey, mnemonicToAccount, privateKeyToAccount, sign } from 'viem/accounts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type DepositPolicy,
  DepositPolicyError,
  DepositPolicyStatus,
  type DepositPolicyTurnkeyClient,
  fetchDepositPolicy,
  getPendingDepositPolicyActions,
  syncDepositPolicy,
} from '../depositPolicy';
import { DepositPolicyValidationError } from '../depositPolicyExpectations';
import response from './depositPolicyResponse.fixture.json';

const INDEXER_URL = 'https://indexer.example';
const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
// The user's key in the fixture is the first account of the phrase that Hardhat and other
// development tools use for their test accounts.
const USER_KEY = toHex(
  mnemonicToAccount('test test test test test test test test test test test junk').getHdKey()
    .privateKey!
);
const OTHER_KEY = generatePrivateKey();
const DYDX_ADDRESS = response.dydxAddress;
// The Injective account whose key the app holds, which the fixture was requested for.
const INJECTIVE_ADDRESS = response.injectiveAddress;
// What an indexer that derived the address from the dYdX address would answer for.
const INJECTIVE_ADDRESS_WITH_DYDX_BYTES = toBech32('inj', fromBech32(DYDX_ADDRESS).data);

const getPolicy = (): DepositPolicy => structuredClone(response) as DepositPolicy;

/** A Turnkey client that signs with a local key, giving the recovery value as Turnkey does. */
function createClient(privateKey: Hex = USER_KEY) {
  return {
    signRawPayload: vi.fn(async ({ payload }: { payload: string }) => {
      const { r, s, yParity } = await sign({ hash: payload as Hex, privateKey });
      return { r: r.slice(2), s: s.slice(2), v: `0${yParity}` };
    }),
    createPolicy: vi.fn(async () => ({ policyId: 'new-policy' })),
    deletePolicy: vi.fn(async () => ({ policyId: 'deleted-policy' })),
  };
}

const asTurnkey = (client: ReturnType<typeof createClient>) => ({
  organizationId: ORGANIZATION_ID,
  client: client as unknown as DepositPolicyTurnkeyClient,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('deposit policy', () => {
  const fetchMock = vi.fn();

  it('has the key of the user in the fixture', () => {
    expect(privateKeyToAccount(USER_KEY).address).toBe(response.evm.address);
  });

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchDepositPolicy', () => {
    const fetchPolicy = (indexerUrl = INDEXER_URL) =>
      fetchDepositPolicy({
        indexerUrl,
        dydxAddress: DYDX_ADDRESS,
        injectiveAddress: INJECTIVE_ADDRESS,
      });

    it('fetches the policy of the account for the Injective account it names', async () => {
      fetchMock.mockResolvedValue(jsonResponse(response));
      const policy = await fetchPolicy(`${INDEXER_URL}/`);
      expect(policy).toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        `${INDEXER_URL}/v4/turnkey/depositPolicy/${DYDX_ADDRESS}?injectiveAddress=${INJECTIVE_ADDRESS}`,
        {}
      );
    });

    it('returns undefined for an account the indexer does not know', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ errors: [{ msg: 'not found' }] }, 404));
      expect(await fetchPolicy()).toBeUndefined();
    });

    it('fails with the message of the indexer', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ errors: [{ msg: 'Too many requests' }] }, 429));
      await expect(fetchPolicy()).rejects.toThrow(new DepositPolicyError('Too many requests'));
    });

    it('fails on a response of another shape', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ dydxAddress: DYDX_ADDRESS }));
      await expect(fetchPolicy()).rejects.toThrow(DepositPolicyError);
    });
  });

  describe('getPendingDepositPolicyActions', () => {
    it('lists what the user has to approve', () => {
      const pending = getPendingDepositPolicyActions(getPolicy());
      expect(pending.evmApprovals.map((a) => a.chainId)).toEqual([
        '42161',
        '1',
        '10',
        '8453',
        '43114',
      ]);
      expect(pending.needsSolanaPolicy).toBe(true);
      expect(pending.isActionRequired).toBe(true);
      expect(pending.hasObsoletePolicies).toBe(true);
    });

    it('requires nothing of an account that is up to date', () => {
      const policy = getPolicy();
      policy.evm.approvals = policy.evm.approvals.map(({ chainId }) => ({
        chainId,
        status: DepositPolicyStatus.UP_TO_DATE,
      }));
      policy.solana = { status: DepositPolicyStatus.UP_TO_DATE, obsoletePolicyIds: [] };
      expect(getPendingDepositPolicyActions(policy)).toEqual({
        evmApprovals: [],
        needsSolanaPolicy: false,
        isActionRequired: false,
        hasObsoletePolicies: false,
      });
    });

    it('does not count chains the indexer cannot check', () => {
      const policy = getPolicy();
      policy.evm.approvals = policy.evm.approvals.map(({ chainId }) => ({
        chainId,
        status: DepositPolicyStatus.UNAVAILABLE,
      }));
      policy.solana = { status: DepositPolicyStatus.UNAVAILABLE, obsoletePolicyIds: [] };
      expect(getPendingDepositPolicyActions(policy).isActionRequired).toBe(false);
    });
  });

  describe('syncDepositPolicy', () => {
    const sync = (
      client: ReturnType<typeof createClient>,
      policy: DepositPolicy = getPolicy(),
      expectedEvmAddress: string | undefined = response.evm.address,
      injectiveAddress: string = INJECTIVE_ADDRESS
    ) =>
      syncDepositPolicy({
        indexerUrl: INDEXER_URL,
        dydxAddress: DYDX_ADDRESS,
        injectiveAddress,
        policy,
        turnkey: asTurnkey(client),
        expectedEvmAddress,
      });

    const expectNothingDone = (client: ReturnType<typeof createClient>) => {
      expect(client.signRawPayload).not.toHaveBeenCalled();
      expect(client.createPolicy).not.toHaveBeenCalled();
      expect(client.deletePolicy).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    };

    it('signs every approval, stores them and updates the Solana policies', async () => {
      const client = createClient();
      fetchMock.mockResolvedValue(
        jsonResponse({ approvedChainIds: ['42161', '1', '10', '8453', '43114'] })
      );

      expect(await sync(client)).toEqual({
        approvedChainIds: ['42161', '1', '10', '8453', '43114'],
        solanaPolicyCreated: true,
        deletedPolicyIds: response.solana.obsoletePolicyIds,
      });

      // Each chain's typed data was signed as a digest, with the user's EVM key.
      expect(client.signRawPayload).toHaveBeenCalledTimes(5);
      response.evm.approvals.forEach(({ typedData }, i) => {
        expect(client.signRawPayload.mock.calls[i]![0]).toMatchObject({
          signWith: response.evm.address,
          organizationId: ORGANIZATION_ID,
          payload: hashTypedData(typedData as any),
          encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
          hashFunction: 'HASH_FUNCTION_NO_OP',
        });
      });

      // The signatures were handed to the indexer, in the form the smart account accepts.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe(`${INDEXER_URL}/v4/turnkey/depositPolicy`);
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.dydxAddress).toBe(DYDX_ADDRESS);
      // The indexer bridges the account's deposits to this address from now on.
      expect(body.injectiveAddress).toBe(INJECTIVE_ADDRESS);
      expect(Object.keys(body).sort()).toEqual(['dydxAddress', 'injectiveAddress', 'signatures']);
      expect(body.signatures.map((s: any) => s.chainId)).toEqual([
        '42161',
        '1',
        '10',
        '8453',
        '43114',
      ]);
      await Promise.all(
        body.signatures.map(async ({ signature }: { signature: Hex }, i: number) => {
          expect(signature).toMatch(/^0x[0-9a-f]{128}(1b|1c)$/);
          expect(
            await recoverAddress({
              hash: hashTypedData(response.evm.approvals[i]!.typedData as any),
              signature,
            })
          ).toBe(response.evm.address);
        })
      );

      // The new Solana policy was created in the user's organization, and the earlier removed.
      expect(client.createPolicy).toHaveBeenCalledTimes(1);
      expect(client.createPolicy).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        ...response.solana.policy,
      });
      expect(client.deletePolicy).toHaveBeenCalledTimes(1);
      expect(client.deletePolicy).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        policyId: response.solana.obsoletePolicyIds[0],
      });
    });

    it('only signs for the chains that need it', async () => {
      const client = createClient();
      const policy = getPolicy();
      policy.evm.approvals = policy.evm.approvals.map((approval) =>
        approval.chainId === '8453'
          ? approval
          : { chainId: approval.chainId, status: DepositPolicyStatus.UP_TO_DATE }
      );
      policy.solana = { status: DepositPolicyStatus.UP_TO_DATE, obsoletePolicyIds: [] };
      fetchMock.mockResolvedValue(jsonResponse({ approvedChainIds: ['8453'] }));

      expect(await sync(client, policy)).toEqual({
        approvedChainIds: ['8453'],
        solanaPolicyCreated: false,
        deletedPolicyIds: [],
      });
      expect(client.signRawPayload).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0]![1].body).signatures).toHaveLength(1);
      expect(client.createPolicy).not.toHaveBeenCalled();
      expect(client.deletePolicy).not.toHaveBeenCalled();
    });

    it('only tidies up when just the earlier Solana policy is left', async () => {
      const client = createClient();
      const policy = getPolicy();
      policy.evm.approvals = [];
      policy.solana = {
        status: DepositPolicyStatus.UP_TO_DATE,
        obsoletePolicyIds: response.solana.obsoletePolicyIds,
      };

      expect(await sync(client, policy)).toEqual({
        approvedChainIds: [],
        solanaPolicyCreated: false,
        deletedPolicyIds: response.solana.obsoletePolicyIds,
      });
      expect(client.signRawPayload).not.toHaveBeenCalled();
      expect(client.createPolicy).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('keeps the earlier Solana policy when the new one is not known to be in place', async () => {
      const client = createClient();
      const policy = getPolicy();
      policy.evm.approvals = [];
      policy.solana = {
        status: DepositPolicyStatus.UNAVAILABLE,
        obsoletePolicyIds: response.solana.obsoletePolicyIds,
      };

      await sync(client, policy);
      expectNothingDone(client);
    });

    it('succeeds when an earlier policy cannot be removed', async () => {
      const client = createClient();
      client.deletePolicy.mockRejectedValue(new Error('not allowed'));
      fetchMock.mockResolvedValue(jsonResponse({ approvedChainIds: ['42161'] }));

      const result = await sync(client);
      expect(result.solanaPolicyCreated).toBe(true);
      expect(result.deletedPolicyIds).toEqual([]);
    });

    it('does not ask Turnkey to delete something that is not a policy id', async () => {
      const client = createClient();
      const policy = getPolicy();
      policy.evm.approvals = [];
      policy.solana = {
        status: DepositPolicyStatus.UP_TO_DATE,
        obsoletePolicyIds: ['../users/someone'],
      };
      await sync(client, policy);
      expect(client.deletePolicy).not.toHaveBeenCalled();
    });

    describe('refuses the whole sync, before anything is signed or created, when', () => {
      it('one chain asks for something unexpected', async () => {
        const client = createClient();
        const policy = getPolicy();
        // The last chain, so that the ones before it would already have been signed for.
        (policy.evm.approvals[4]!.typedData as any).message.hook =
          '0x00000000000000000000000000000000DeaDBeef';

        await expect(sync(client, policy)).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });

      it('typed data is offered for another chain', async () => {
        const client = createClient();
        const policy = getPolicy();
        policy.evm.approvals[0]!.typedData = policy.evm.approvals[1]!.typedData;

        await expect(sync(client, policy)).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });

      it('typed data is missing', async () => {
        const client = createClient();
        const policy = getPolicy();
        delete policy.evm.approvals[2]!.typedData;

        await expect(sync(client, policy)).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });

      it('the Solana policy is unexpected', async () => {
        const client = createClient();
        const policy = getPolicy();
        (policy.solana.policy as any).condition = 'true';

        await expect(sync(client, policy)).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });

      it('the policy is for another account', async () => {
        const otherAccount = getPolicy();
        otherAccount.dydxAddress = 'dydx1someoneelse';
        const client = createClient();
        await expect(sync(client, otherAccount)).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });

      it('the indexer answers for another Injective account than the one named', async () => {
        // As an indexer would that derived the address from the dYdX address.
        const otherDestination = getPolicy();
        otherDestination.injectiveAddress = INJECTIVE_ADDRESS_WITH_DYDX_BYTES;
        const client = createClient();
        await expect(sync(client, otherDestination)).rejects.toThrow(
          new DepositPolicyValidationError('deposit policy is for another account')
        );
        expectNothingDone(client);
      });

      it('the policy is for another Injective account than the one the app holds', async () => {
        // The response says the right address, but what it asks to approve is for another.
        const client = createClient();
        const policy = getPolicy();
        policy.injectiveAddress = INJECTIVE_ADDRESS_WITH_DYDX_BYTES;
        await expect(
          sync(client, policy, response.evm.address, INJECTIVE_ADDRESS_WITH_DYDX_BYTES)
        ).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });

      it('the app names something that is not an Injective account', async () => {
        const client = createClient();
        const policy = getPolicy();
        policy.injectiveAddress = DYDX_ADDRESS;
        await expect(sync(client, policy, response.evm.address, DYDX_ADDRESS)).rejects.toThrow(
          new DepositPolicyValidationError('not an Injective address')
        );
        expectNothingDone(client);
      });

      it('the policy is for another wallet than the one in Turnkey', async () => {
        const client = createClient();
        await expect(
          sync(client, getPolicy(), privateKeyToAccount(OTHER_KEY).address)
        ).rejects.toThrow(DepositPolicyValidationError);
        expectNothingDone(client);
      });
    });

    it('does not hand over a signature by another key', async () => {
      const client = createClient(OTHER_KEY);
      const policy = getPolicy();
      policy.solana = { status: DepositPolicyStatus.UP_TO_DATE, obsoletePolicyIds: [] };

      await expect(sync(client, policy, undefined)).rejects.toThrow(
        new DepositPolicyError('signature is not by the expected key')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails with the message of the indexer when it does not accept the signatures', async () => {
      const client = createClient();
      fetchMock.mockResolvedValue(
        jsonResponse({ errors: [{ msg: 'Signature does not match', code: 'TURNKEY_ERROR' }] }, 400)
      );
      await expect(sync(client)).rejects.toThrow(
        new DepositPolicyError('Signature does not match')
      );
      // Solana does not depend on the EVM chains.
      expect(client.createPolicy).toHaveBeenCalledTimes(1);
    });

    it('fails when Turnkey does not sign', async () => {
      const client = createClient();
      client.signRawPayload.mockRejectedValue(new Error('session expired'));
      await expect(sync(client)).rejects.toThrow(new DepositPolicyError('session expired'));
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
