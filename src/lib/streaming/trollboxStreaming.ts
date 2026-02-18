import {
  type ITrollboxServerData,
  type TrollboxUpdate,
  type TrollboxUserMessage,
} from '@/lib/trollboxUtils';

import { BaseSocketIOManager } from './BaseSocketIOManager';

const TROLLBOX_URL = import.meta.env.VITE_TROLLBOX_URL;
const TROLLBOX_CHANNEL = 'trollbox';

class TrollboxSocketManager extends BaseSocketIOManager {
  constructor() {
    super(TROLLBOX_URL);
  }

  protected setupEventListeners(): void {
    this.socket!.on('message', (data: ITrollboxServerData) => {
      switch (data.type) {
        case 'message_history':
          this.notifyHandlers(TROLLBOX_CHANNEL, {
            type: 'history',
            messages: data.messages.map((m) => ({
              id: m.id,
              from: m.from,
              message: m.message,
              timestamp: m.timestamp,
            })),
          } satisfies TrollboxUpdate);
          break;
        case 'message':
          this.notifyHandlers(TROLLBOX_CHANNEL, {
            type: 'message',
            message: {
              id: data.id,
              from: data.from,
              message: data.message,
              timestamp: data.timestamp,
            },
          } satisfies TrollboxUpdate);
          break;
        case 'error':
          this.notifyHandlers(TROLLBOX_CHANNEL, {
            type: 'error',
            error: data.error,
          } satisfies TrollboxUpdate);
          break;
        case 'connected':
          break;
        default:
          break;
      }
    });
  }

  // No-op: trollbox server auto-subscribes all clients on connect
  protected sendSubscription(_channel: string): void {}

  // No-op: trollbox server auto-unsubscribes on disconnect
  protected sendUnsubscription(_channel: string): void {}

  send(payload: TrollboxUserMessage): void {
    if (this.socket == null || !this.socket.connected) {
      this.notifyHandlers(TROLLBOX_CHANNEL, {
        type: 'error',
        error: 'Not connected to trollbox server',
      } satisfies TrollboxUpdate);
      return;
    }

    this.socket.emit('message', payload);
  }
}

let trollboxManager: TrollboxSocketManager | null = null;

export const subscribeToTrollbox = (onUpdate: (data: TrollboxUpdate) => void): (() => void) => {
  if (trollboxManager == null) trollboxManager = new TrollboxSocketManager();

  return trollboxManager.subscribe(TROLLBOX_CHANNEL, onUpdate);
};

export const sendTrollboxMessage = (payload: TrollboxUserMessage): void => {
  trollboxManager?.send(payload);
};
