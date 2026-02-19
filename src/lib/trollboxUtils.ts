import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';

import type { TrollboxUserMessage } from '@/types/trollbox';

export async function signTrollboxMessage(
  message: string,
  address: string,
  privateKey: Uint8Array
): Promise<TrollboxUserMessage> {
  const timestamp = Math.floor(Date.now() / 1000); // Server expects timestamp in seconds
  const payload = JSON.stringify({ message, address, timestamp });
  const digest = sha256(new TextEncoder().encode(payload));
  const sig = await Secp256k1.createSignature(digest, privateKey);
  const signature = toHex(sig.toFixedLength());

  return { message, signature, address, timestamp };
}
