import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';

// Serverside data formats
export interface ITrollboxServerDataConnected {
  id: string;
  type: 'connected';
  connectionId: string;
  timestamp: number;
}

export interface ITrollboxServerDataMessageHistory {
  id: string;
  type: 'message_history';
  connectionId: string;
  timestamp: number;
  messages: ITrollboxServerDataMessage[];
}

export interface ITrollboxServerDataMessage {
  id: string;
  type: 'message';
  connectionId: string;
  timestamp: number;
  from: string;
  message: string;
}

export type ITrollboxErrorType =
  | 'message_too_large'
  | 'message_empty'
  | 'missing_field'
  | 'invalid_address'
  | 'invalid_signature'
  | 'invalid_timestamp'
  | 'rate_limit'
  | 'insufficient_volume'
  | 'validation_error';

export interface ITrollboxServerDataError {
  id: string;
  type: 'error';
  connectionId: string;
  timestamp: number;
  error: string;
  errorType: ITrollboxErrorType;
}

export type ITrollboxServerData =
  | ITrollboxServerDataConnected
  | ITrollboxServerDataMessageHistory
  | ITrollboxServerDataMessage
  | ITrollboxServerDataError;

// Parsed clientside data formats
export interface TrollboxChatMessage {
  id: string;
  from: string;
  message: string;
}

export interface TrollboxUpdateHistory {
  type: 'history';
  messages: TrollboxChatMessage[];
}

export interface TrollboxUpdateMessage {
  type: 'message';
  message: TrollboxChatMessage;
}

export interface TrollboxUpdateError {
  type: 'error';
  error: string;
  errorType?: ITrollboxErrorType;
}

export type TrollboxUpdate = TrollboxUpdateHistory | TrollboxUpdateMessage | TrollboxUpdateError;

// Signing
export interface TrollboxUserMessage {
  message: string;
  signature: string;
  address: string;
  timestamp: number;
}

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
