import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';

// Serverside data formats
export interface ITrollboxServerDataConnected {
  type: 'connected';
  connectionId: string;
  timestamp: number;
}

export interface ITrollboxServerDataMessageHistory {
  type: 'message_history';
  connectionId: string;
  timestamp: number;
  messages: Array<{ from: string; message: string; timestamp: number; connectionId: string }>;
}

export interface ITrollboxServerDataMessage {
  type: 'message';
  connectionId: string;
  timestamp: number;
  from: string;
  message: string;
}

export interface ITrollboxServerDataError {
  type: 'error';
  connectionId: string;
  timestamp: number;
  error: string;
}

export type ITrollboxServerData =
  | ITrollboxServerDataConnected
  | ITrollboxServerDataMessageHistory
  | ITrollboxServerDataMessage
  | ITrollboxServerDataError;

export interface TrollboxChatMessage {
  id: string;
  from: string;
  message: string;
  timestamp: number;
}

export interface TrollboxUserMessage {
  message: string;
  signature: string;
  address: string;
  timestamp: number;
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
}

export type TrollboxUpdate = TrollboxUpdateHistory | TrollboxUpdateMessage | TrollboxUpdateError;

// -- IDs --

let messageIdCounter = 0;
export function nextMessageId(): string {
  messageIdCounter += 1;
  return `trollbox-${messageIdCounter}`;
}

// -- Signing --

export async function signTrollboxMessage(
  message: string,
  address: string,
  privateKey: Uint8Array
): Promise<TrollboxUserMessage> {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ message, address, timestamp });
  const digest = sha256(new TextEncoder().encode(payload));
  const sig = await Secp256k1.createSignature(digest, privateKey);
  const signature = toHex(sig.toFixedLength());
  return { message, signature, address, timestamp };
}
