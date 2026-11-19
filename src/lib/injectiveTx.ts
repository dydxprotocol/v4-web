import { fromBase64 } from '@cosmjs/encoding';
import type { OfflineSigner } from '@cosmjs/proto-signing';
import type { Account } from '@cosmjs/stargate';

import { INJECTIVE_USDC_DENOM } from '@/constants/tokens';

/**
 * Injective accounts use ethsecp256k1 keys, which cosmjs's signing client does not support: it
 * cannot parse Injective's EthAccount type and encodes the wrong public key type. The few
 * Injective-specific protobuf pieces are therefore encoded here by hand, and everything else is
 * left to cosmjs.
 */

const ETH_ACCOUNT_TYPE_URL = '/injective.types.v1beta1.EthAccount';
const ETH_SECP256K1_PUBKEY_TYPE_URL = '/injective.crypto.v1beta1.ethsecp256k1.PubKey';
const MSG_TRANSFER_TYPE_URL = '/ibc.applications.transfer.v1.MsgTransfer';
const TX_BODY_TYPE_URL = '/cosmos.tx.v1beta1.TxBody';

export const INJECTIVE_FEE_DENOM = 'inj';
// IBC channel on Injective (injective-1) that leads to the dYdX chain
export const INJECTIVE_TO_DYDX_IBC_CHANNEL = 'channel-258';
export const INJECTIVE_IBC_TRANSFER_GAS_LIMIT = BigInt(450_000);
// Price per unit of gas, in inj. Comfortably above the minimum base fee (1.6e8).
export const INJECTIVE_GAS_PRICE = BigInt(1_000_000_000);
// The timeout is set when the transfer is signed, so it only needs to cover IBC relaying
const IBC_TRANSFER_TIMEOUT_MS = 10 * 60 * 1000;

export const getInjectiveIbcTransferFee = (
  gasLimit = INJECTIVE_IBC_TRANSFER_GAS_LIMIT,
  gasPrice = INJECTIVE_GAS_PRICE
) => gasLimit * gasPrice;

// ------ Minimal protobuf encoding/decoding ------ //

function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  let remaining = value;
  while (remaining >= 0x80) {
    bytes.push((remaining % 0x80) + 0x80);
    remaining = Math.floor(remaining / 0x80);
  }
  bytes.push(remaining);
  return bytes;
}

function encodeBytesField(fieldNumber: number, bytes: Uint8Array): Uint8Array {
  return new Uint8Array([
    ...encodeVarint(fieldNumber * 8 + 2),
    ...encodeVarint(bytes.length),
    ...bytes,
  ]);
}

function readVarint(bytes: Uint8Array, offset: number): [value: number, nextOffset: number] {
  let value = 0;
  let multiplier = 1;
  let position = offset;
  for (;;) {
    const byte = bytes[position];
    if (byte === undefined) throw new Error('invalid protobuf: truncated varint');
    value += (byte % 0x80) * multiplier;
    position += 1;
    if (byte < 0x80) return [value, position];
    multiplier *= 0x80;
  }
}

/**
 * Reads the top-level varint and length-delimited fields of a protobuf message.
 */
function readFields(bytes: Uint8Array) {
  const varints: Record<number, number> = {};
  const lengthDelimited: Record<number, Uint8Array> = {};
  let offset = 0;
  while (offset < bytes.length) {
    const [tag, afterTag] = readVarint(bytes, offset);
    const fieldNumber = Math.floor(tag / 8);
    const wireType = tag % 8;
    if (wireType === 0) {
      const [value, next] = readVarint(bytes, afterTag);
      varints[fieldNumber] = value;
      offset = next;
    } else if (wireType === 2) {
      const [length, start] = readVarint(bytes, afterTag);
      lengthDelimited[fieldNumber] = bytes.slice(start, start + length);
      offset = start + length;
    } else {
      throw new Error(`invalid protobuf: unsupported wire type ${wireType}`);
    }
  }
  return { varints, lengthDelimited };
}

// ------ Accounts ------ //

/**
 * Parses an Injective EthAccount, which wraps a BaseAccount (address = 1, pub_key = 2,
 * account_number = 3, sequence = 4). The public key is left out: cosmjs cannot decode the
 * ethsecp256k1 type, and signing only needs the account number and sequence.
 */
function parseEthAccount(value: Uint8Array): Account {
  const baseAccount = readFields(value).lengthDelimited[1];
  if (!baseAccount) throw new Error('invalid EthAccount: missing base account');

  const { varints, lengthDelimited } = readFields(baseAccount);
  return {
    address: new TextDecoder().decode(lengthDelimited[1]),
    pubkey: null,
    accountNumber: varints[3] ?? 0,
    sequence: varints[4] ?? 0,
  };
}

async function connectInjectiveClient(rpcUrl: string) {
  const [{ StargateClient, accountFromAny }, { Comet38Client }] = await Promise.all([
    import('@cosmjs/stargate'),
    import('@cosmjs/tendermint-rpc'),
  ]);
  // Injective runs CometBFT 1.x. cosmjs only recognizes versions up to 0.38 and falls back to its
  // 0.34 client for anything else, which then fails to decode transaction results. 1.x is
  // compatible with the 0.38 client, so it is used directly.
  const cometClient = await Comet38Client.connect(rpcUrl);
  return StargateClient.create(cometClient, {
    accountParser: (any) =>
      any.typeUrl === ETH_ACCOUNT_TYPE_URL ? parseEthAccount(any.value) : accountFromAny(any),
  });
}

// ------ Transactions ------ //

/**
 * Sends USDC from an Injective account to the dYdX chain over IBC, signing with the account's
 * ethsecp256k1 key. When `feeGranter` is set, the fee is paid from that account's fee allowance.
 */
export async function sendInjectiveUsdcToDydx({
  rpcUrl,
  signer,
  injectiveAddress,
  dydxAddress,
  amount,
  feeGranter,
  gasLimit = INJECTIVE_IBC_TRANSFER_GAS_LIMIT,
  gasPrice = INJECTIVE_GAS_PRICE,
}: {
  rpcUrl: string;
  signer: OfflineSigner;
  injectiveAddress: string;
  dydxAddress: string;
  amount: string;
  feeGranter?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
}): Promise<string> {
  if (!('signDirect' in signer)) {
    throw new Error('Injective wallet does not support direct signing');
  }

  const [{ defaultRegistryTypes }, { makeAuthInfoBytes, makeSignDoc, Registry }] =
    await Promise.all([import('@cosmjs/stargate'), import('@cosmjs/proto-signing')]);

  const client = await connectInjectiveClient(rpcUrl);
  try {
    const [chainId, { accountNumber, sequence }, accounts] = await Promise.all([
      client.getChainId(),
      client.getSequence(injectiveAddress),
      signer.getAccounts(),
    ]);
    const account = accounts.find((a) => a.address === injectiveAddress);
    if (!account) throw new Error(`Injective wallet has no account ${injectiveAddress}`);

    const bodyBytes = new Registry(defaultRegistryTypes).encode({
      typeUrl: TX_BODY_TYPE_URL,
      value: {
        messages: [
          {
            typeUrl: MSG_TRANSFER_TYPE_URL,
            value: {
              sourcePort: 'transfer',
              sourceChannel: INJECTIVE_TO_DYDX_IBC_CHANNEL,
              token: { denom: INJECTIVE_USDC_DENOM, amount },
              sender: injectiveAddress,
              receiver: dydxAddress,
              timeoutHeight: { revisionNumber: BigInt(0), revisionHeight: BigInt(0) },
              timeoutTimestamp: BigInt(Date.now() + IBC_TRANSFER_TIMEOUT_MS) * BigInt(1_000_000),
              memo: '',
            },
          },
        ],
        memo: '',
      },
    });

    const authInfoBytes = makeAuthInfoBytes(
      [
        {
          pubkey: {
            typeUrl: ETH_SECP256K1_PUBKEY_TYPE_URL,
            value: encodeBytesField(1, account.pubkey),
          },
          sequence,
        },
      ],
      [
        {
          denom: INJECTIVE_FEE_DENOM,
          amount: getInjectiveIbcTransferFee(gasLimit, gasPrice).toString(),
        },
      ],
      Number(gasLimit),
      feeGranter,
      undefined
    );

    const { signed, signature } = await signer.signDirect(
      injectiveAddress,
      makeSignDoc(bodyBytes, authInfoBytes, chainId, accountNumber)
    );

    // TxRaw: body_bytes = 1, auth_info_bytes = 2, signatures = 3
    const txRaw = new Uint8Array([
      ...encodeBytesField(1, signed.bodyBytes),
      ...encodeBytesField(2, signed.authInfoBytes),
      ...encodeBytesField(3, fromBase64(signature.signature)),
    ]);

    const result = await client.broadcastTx(txRaw);
    if (result.code !== 0) {
      throw new Error(`Injective transfer failed (code ${result.code}): ${result.rawLog ?? ''}`);
    }
    return result.transactionHash;
  } finally {
    client.disconnect();
  }
}

export async function getInjectiveBalances(rpcUrl: string, injectiveAddress: string) {
  const client = await connectInjectiveClient(rpcUrl);
  try {
    const [usdc, inj] = await Promise.all([
      client.getBalance(injectiveAddress, INJECTIVE_USDC_DENOM),
      client.getBalance(injectiveAddress, INJECTIVE_FEE_DENOM),
    ]);
    return { usdc: BigInt(usdc.amount), inj: BigInt(inj.amount) };
  } finally {
    client.disconnect();
  }
}
