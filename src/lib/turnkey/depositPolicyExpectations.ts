import { fromBech32, toBech32 } from '@cosmjs/encoding';
import {
  concat,
  decodeAbiParameters,
  encodeAbiParameters,
  type Hex,
  isAddress,
  isAddressEqual,
  isHex,
  pad,
  size,
  slice,
  toHex,
  zeroAddress,
} from 'viem';
import { arbitrum, avalanche, base, mainnet, optimism } from 'viem/chains';

import { INJECTIVE_BECH32_PREFIX } from '@/constants/graz';
import { USDC_ADDRESSES } from '@/constants/tokens';

/**
 * What a Turnkey account is asked to approve so that the indexer can bridge its deposits, and
 * the checks that a request to approve it is exactly that and nothing more.
 *
 * The approvals are made without asking the user, so the app must not sign whatever the indexer
 * returns. It builds the policy it expects from the user's own dYdX address and refuses anything
 * that differs. The values here mirror the policy the indexer builds (`call-policies.ts` and
 * `policy-engine.ts` in comlink) and must change together with it.
 */

export class DepositPolicyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DepositPolicyValidationError';
  }
}

const BECH32_PREFIX_DYDX = 'dydx';
const ACCOUNT_ADDRESS_BYTE_LENGTH = 20;

/* ----------------------------- EVM ----------------------------- */

// The chains deposits are bridged from, and the version of the smart account used on each.
const KERNEL_VERSION_BY_CHAIN_ID: Record<number, string> = {
  [mainnet.id]: '0.3.3',
  [arbitrum.id]: '0.3.3',
  [base.id]: '0.3.3',
  [optimism.id]: '0.3.3',
  // Avalanche has no EIP-7702, so the user has a separate smart account there.
  [avalanche.id]: '0.3.1',
};
const KERNEL_DOMAIN_NAME = 'Kernel';

// Skip's CCTP v2 relayer, which has the same address on every chain, and the two calls of a
// deposit: `approve(address,uint256)` on USDC and `requestCCTPTransferWithCaller(...)` on it.
const SKIP_CCTP_V2_RELAYER_ADDRESS = '0x400BB58033a7763A834199190B68F66A2661aE73';
const APPROVE_SELECTOR = '0x095ea7b3';
const REQUEST_CCTP_TRANSFER_SELECTOR = '0xd1cc447d';
// The CCTP domain of Injective.
const INJECTIVE_CCTP_DOMAIN = 29;
// The most USDC, in its smallest unit, that a bridge call may leave with the relayer as its fee.
const MAX_RELAY_FEE = BigInt(5_000_000);

// ZeroDev's call policy and ECDSA signer contracts, and the flag that applies a policy to every
// kind of validation.
const CALL_POLICY_ADDRESS = '0x85770b902D1e503D5f5141d9eaC16d0d08eEaDd2';
const ECDSA_SIGNER_ADDRESS = '0x6A6F069E2a08c2468e7724Ab3250CdBFBA14D4FF';
const POLICY_FLAG_FOR_ALL_VALIDATION = '0x0000';
const CALL_TYPE_CALL = '0x00';
const CONDITION_EQUAL = 0;
const CONDITION_LESS_THAN_OR_EQUAL = 4;

// What the session key is enabled for: the account's own `execute(bytes32,bytes)`, with no
// action contract and no hook.
const ENABLE_SELECTOR_DATA = concat([
  '0xe9ae5c53',
  zeroAddress,
  zeroAddress,
  encodeAbiParameters([{ type: 'bytes' }, { type: 'bytes' }], ['0xff', '0x0000']),
]);

const ENABLE_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  Enable: [
    { name: 'validationId', type: 'bytes21' },
    { name: 'nonce', type: 'uint32' },
    { name: 'hook', type: 'address' },
    { name: 'validatorData', type: 'bytes' },
    { name: 'hookData', type: 'bytes' },
    { name: 'selectorData', type: 'bytes' },
  ],
};

const PERMISSIONS_ABI = [
  {
    type: 'tuple[]',
    components: [
      { name: 'callType', type: 'bytes1' },
      { name: 'target', type: 'address' },
      { name: 'selector', type: 'bytes4' },
      { name: 'valueLimit', type: 'uint256' },
      {
        name: 'rules',
        type: 'tuple[]',
        components: [
          { name: 'condition', type: 'uint8' },
          { name: 'offset', type: 'uint64' },
          { name: 'params', type: 'bytes32[]' },
        ],
      },
    ],
  },
] as const;

const POLICY_AND_SIGNER_ABI = [{ type: 'bytes[]' }] as const;

/**
 * Where an account's deposits are bridged to: the Injective account that shares its 20 address
 * bytes with the dYdX account, as an `inj` address and as the 32-byte CCTP mint recipient.
 */
export function getInjectiveDepositRecipient(dydxAddress: string): {
  injectiveAddress: string;
  mintRecipient: Hex;
} {
  const { prefix, data } = fromBech32(dydxAddress);
  if (prefix !== BECH32_PREFIX_DYDX || data.length !== ACCOUNT_ADDRESS_BYTE_LENGTH) {
    throw new DepositPolicyValidationError('not a dYdX address');
  }
  return {
    injectiveAddress: toBech32(INJECTIVE_BECH32_PREFIX, data),
    mintRecipient: pad(toHex(data), { size: 32 }),
  };
}

function getUsdcAddress(chainId: number): Hex {
  const usdc = (USDC_ADDRESSES as Record<string, string>)[chainId];
  if (KERNEL_VERSION_BY_CHAIN_ID[chainId] == null || usdc == null || !isAddress(usdc)) {
    throw new DepositPolicyValidationError(`deposits are not bridged from chain ${chainId}`);
  }
  return usdc;
}

const equalTo = (value: Hex, offset: number) => ({
  condition: CONDITION_EQUAL,
  offset: BigInt(offset),
  params: [pad(value, { size: 32 })],
});

/**
 * The only permissions the bridge session key may be given on `chainId`: approving the relayer
 * to spend USDC, and bridging USDC through it to the account's own Injective address, with the
 * relayer's fee capped. Encoded the way the call policy contract stores them.
 */
function encodeExpectedPermissions(chainId: number, mintRecipient: Hex): Hex {
  const usdc = getUsdcAddress(chainId);
  return encodeAbiParameters(PERMISSIONS_ABI, [
    [
      {
        callType: CALL_TYPE_CALL,
        target: usdc,
        selector: APPROVE_SELECTOR,
        valueLimit: BigInt(0),
        // The spender is the relayer.
        rules: [equalTo(SKIP_CCTP_V2_RELAYER_ADDRESS, 0)],
      },
      {
        callType: CALL_TYPE_CALL,
        target: SKIP_CCTP_V2_RELAYER_ADDRESS,
        selector: REQUEST_CCTP_TRANSFER_SELECTOR,
        valueLimit: BigInt(0),
        rules: [
          // The destination chain is Injective, the recipient is the account's own address
          // there, and the token is USDC.
          equalTo(toHex(INJECTIVE_CCTP_DOMAIN), 32),
          equalTo(mintRecipient, 64),
          equalTo(usdc, 96),
          {
            condition: CONDITION_LESS_THAN_OR_EQUAL,
            offset: BigInt(128),
            params: [pad(toHex(MAX_RELAY_FEE), { size: 32 })],
          },
        ],
      },
    ],
  ]);
}

/**
 * Checks the data that says who is enabled and for what. It must hold exactly one policy, the
 * expected one, and one ECDSA session key. The key itself is the indexer's to choose: whoever
 * holds it can do no more than the policy allows.
 */
function assertExpectedValidatorData(validatorData: unknown, chainId: number, mintRecipient: Hex) {
  if (!isHex(validatorData)) {
    throw new DepositPolicyValidationError('validator data is not hex');
  }
  let entries: readonly Hex[];
  try {
    [entries] = decodeAbiParameters(POLICY_AND_SIGNER_ABI, validatorData);
  } catch (error) {
    throw new DepositPolicyValidationError('validator data cannot be decoded');
  }
  const signerEntry = entries[1];
  const signerPrefix = concat([POLICY_FLAG_FOR_ALL_VALIDATION, ECDSA_SIGNER_ADDRESS]);
  if (
    entries.length !== 2 ||
    signerEntry == null ||
    size(signerEntry) !== size(signerPrefix) + ACCOUNT_ADDRESS_BYTE_LENGTH ||
    slice(signerEntry, 0, size(signerPrefix)).toLowerCase() !== signerPrefix.toLowerCase()
  ) {
    throw new DepositPolicyValidationError('unexpected policies or session key');
  }

  const expected = encodeAbiParameters(POLICY_AND_SIGNER_ABI, [
    [
      concat([
        POLICY_FLAG_FOR_ALL_VALIDATION,
        CALL_POLICY_ADDRESS,
        encodeExpectedPermissions(chainId, mintRecipient),
      ]),
      signerEntry,
    ],
  ]);
  // Byte for byte, so that nothing can ride along in a non-standard encoding.
  if (validatorData.toLowerCase() !== expected.toLowerCase()) {
    throw new DepositPolicyValidationError('unexpected permissions');
  }
}

/**
 * Checks that typed data from the indexer enables the bridge session key on the user's own
 * account on `chainId`, with the expected permissions and nothing else.
 *
 * @param evmAddress the address of the user's EVM key, which signs the typed data.
 * @throws DepositPolicyValidationError if anything is not as expected. The data must then not be
 * signed.
 */
export function assertExpectedEnableTypedData({
  typedData,
  chainId,
  dydxAddress,
  evmAddress,
}: {
  typedData: any;
  chainId: number;
  dydxAddress: string;
  evmAddress: string;
}) {
  const { mintRecipient } = getInjectiveDepositRecipient(dydxAddress);
  const expectedVersion = KERNEL_VERSION_BY_CHAIN_ID[chainId];
  if (expectedVersion == null) {
    throw new DepositPolicyValidationError(`deposits are not bridged from chain ${chainId}`);
  }

  if (typedData?.primaryType !== 'Enable') {
    throw new DepositPolicyValidationError('unexpected primary type');
  }
  // The types decide how everything else is hashed, so they must be exactly these.
  if (JSON.stringify(typedData.types) !== JSON.stringify(ENABLE_TYPES)) {
    throw new DepositPolicyValidationError('unexpected types');
  }

  const { domain, message } = typedData;
  if (
    domain?.name !== KERNEL_DOMAIN_NAME ||
    domain.version !== expectedVersion ||
    domain.chainId !== chainId ||
    typeof domain.verifyingContract !== 'string' ||
    !isAddress(domain.verifyingContract)
  ) {
    throw new DepositPolicyValidationError('unexpected domain');
  }
  // Where EIP-7702 is used the smart account is the user's own address. On Avalanche it is a
  // separate account, which only this key's signature can act on.
  if (
    chainId !== avalanche.id &&
    (!isAddress(evmAddress) || !isAddressEqual(domain.verifyingContract, evmAddress))
  ) {
    throw new DepositPolicyValidationError('typed data is for another account');
  }

  if (
    typeof message?.hook !== 'string' ||
    !isAddress(message.hook) ||
    !isAddressEqual(message.hook, zeroAddress) ||
    message.hookData !== '0x'
  ) {
    throw new DepositPolicyValidationError('unexpected hook');
  }
  if (
    typeof message.selectorData !== 'string' ||
    message.selectorData.toLowerCase() !== ENABLE_SELECTOR_DATA.toLowerCase()
  ) {
    throw new DepositPolicyValidationError('unexpected action');
  }
  if (
    typeof message.validationId !== 'string' ||
    !/^0x02[0-9a-fA-F]{40}$/.test(message.validationId)
  ) {
    throw new DepositPolicyValidationError('unexpected validation id');
  }
  if (!Number.isInteger(message.nonce) || message.nonce < 0 || message.nonce > 0xffffffff) {
    throw new DepositPolicyValidationError('unexpected nonce');
  }
  assertExpectedValidatorData(message.validatorData, chainId, mintRecipient);
}

/* ----------------------------- Solana ----------------------------- */

export const SOLANA_BRIDGE_POLICY_NAME = 'Injective Bridging Policy';
const SOLANA_CCTP_V2_PROGRAM = 'CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe';
const SOLANA_CCTP_V2_DEPOSIT_FOR_BURN_DISCRIMINATOR = 'd73c3d2e723780b0';
const SOLANA_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
// The most USDC, in its smallest unit, that the bridge transaction may pay the relayer.
const SOLANA_MAX_RELAY_FEE = 1_000_000;
// The policy applies to one member of the user's Turnkey organization, named by its id.
const SOLANA_POLICY_CONSENSUS =
  /^approvers\.any\(user, user\.id == '[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}'\)$/;
const MAX_POLICY_NOTES_LENGTH = 200;

/**
 * The only transaction the bridge API user may be allowed to sign with the user's Solana key:
 * a CCTP v2 burn for Injective with the account's own address as recipient, plus one token
 * transfer capped at the relayer's fee.
 */
function getExpectedSolanaPolicyCondition(dydxAddress: string): string {
  const { mintRecipient } = getInjectiveDepositRecipient(dydxAddress);
  // The destination domain as the instruction encodes it: 4 bytes, little-endian.
  const domain = pad(toHex(INJECTIVE_CCTP_DOMAIN), { size: 4, dir: 'right' }).slice(2);
  const burn = 'solana.tx.instructions[0]';
  return [
    'solana.tx.instructions.count() == 2',
    `${burn}.program_key == '${SOLANA_CCTP_V2_PROGRAM}'`,
    `${burn}.instruction_data_hex[0..16] == '${SOLANA_CCTP_V2_DEPOSIT_FOR_BURN_DISCRIMINATOR}'`,
    `${burn}.instruction_data_hex[32..40] == '${domain}'`,
    `${burn}.instruction_data_hex[40..104] == '${mintRecipient.slice(2).toLowerCase()}'`,
    `solana.tx.instructions[1].program_key == '${SOLANA_TOKEN_PROGRAM}'`,
    'solana.tx.spl_transfers.count() == 1',
    `solana.tx.spl_transfers[0].amount <= ${SOLANA_MAX_RELAY_FEE}`,
  ].join(' && ');
}

export type ExpectedSolanaPolicy = {
  policyName: string;
  effect: 'EFFECT_ALLOW';
  condition: string;
  consensus: string;
  notes: string;
};

/**
 * Checks that a Turnkey policy from the indexer allows the expected bridge transaction and
 * nothing else, and returns it with only the fields that were checked.
 *
 * @throws DepositPolicyValidationError if anything is not as expected. The policy must then not
 * be created.
 */
export function assertExpectedSolanaPolicy({
  policy,
  dydxAddress,
}: {
  policy: any;
  dydxAddress: string;
}): ExpectedSolanaPolicy {
  if (policy?.policyName !== SOLANA_BRIDGE_POLICY_NAME || policy.effect !== 'EFFECT_ALLOW') {
    throw new DepositPolicyValidationError('unexpected Solana policy');
  }
  if (policy.condition !== getExpectedSolanaPolicyCondition(dydxAddress)) {
    throw new DepositPolicyValidationError('unexpected Solana policy condition');
  }
  if (typeof policy.consensus !== 'string' || !SOLANA_POLICY_CONSENSUS.test(policy.consensus)) {
    throw new DepositPolicyValidationError('unexpected Solana policy consensus');
  }
  const notes = typeof policy.notes === 'string' ? policy.notes : '';
  return {
    policyName: policy.policyName,
    effect: policy.effect,
    condition: policy.condition,
    consensus: policy.consensus,
    notes: notes.slice(0, MAX_POLICY_NOTES_LENGTH),
  };
}
