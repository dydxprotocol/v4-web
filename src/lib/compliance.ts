import { Secp256k1, sha256 } from '@cosmjs/crypto';

import { Hdkey } from '@/constants/account';
import { BLOCKED_COUNTRIES, CountryCodes, OFAC_SANCTIONED_COUNTRIES } from '@/constants/geo';

export const signCompliancePayload = async (
  message: string,
  action: string,
  status: string,
  hdkey: Hdkey
): Promise<{ signedMessage: string; timestamp: number }> => {
  if (!hdkey?.privateKey || !hdkey?.publicKey) {
    throw new Error('Missing hdkey');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const messageToSign: string = `${message}:${action}"${status || ''}:${timestamp}`;
  const messageHash = sha256(Buffer.from(messageToSign));

  const signed = await Secp256k1.createSignature(messageHash, hdkey.privateKey);
  const signedMessage = signed.toFixedLength();
  return {
    signedMessage: Buffer.from(signedMessage).toString('base64'),
    timestamp,
  };
};

export const isBlockedGeo = (geo: string): boolean => {
  return [...BLOCKED_COUNTRIES, ...OFAC_SANCTIONED_COUNTRIES].includes(geo as CountryCodes);
};
