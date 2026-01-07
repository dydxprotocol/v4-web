import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { io, Socket } from 'socket.io-client';

export abstract class BaseSocketIOManager {
  protected socket: Socket | null = null;

  protected subscriptions = new Map<string, Array<{ id: string; callback: (data: any) => void }>>();

  private isConnecting = false;

  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    protected url: string,
    protected heartbeatConfig?: { interval: number; event: string }
  ) {}

  protected connect(): void {
    if (this.isConnecting || (this.socket && this.socket.connected)) return;
    if (!this.url) return;

    this.isConnecting = true;

    this.socket = io(this.url, {
      autoConnect: true,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      logBonsaiInfo(this.constructor.name, 'connected');
      this.isConnecting = false;
      this.onConnect();
    });

    this.socket.on('disconnect', (reason) => {
      logBonsaiInfo(this.constructor.name, 'disconnected', { reason });
      this.isConnecting = false;
      this.onDisconnect();
    });

    this.socket.on('connect_error', (error) => {
      logBonsaiError(this.constructor.name, 'connection error', { error });
      this.isConnecting = false;
    });

    this.setupEventListeners();
  }

  protected abstract setupEventListeners(): void;

  protected onConnect(): void {
    this.startHeartbeat();
    this.resubscribeAll();
  }

  protected onDisconnect(): void {
    this.stopHeartbeat();
  }

  subscribe(channel: string, callback: (data: any) => void, subscriberUID?: string): () => void {
    const uid = subscriberUID ?? crypto.randomUUID();

    let handlers = this.subscriptions.get(channel);
    if (!handlers) {
      handlers = [];
      this.subscriptions.set(channel, handlers);

      if (this.socket?.connected) {
        this.sendSubscription(channel);
      }
    }

    handlers.push({ id: uid, callback });

    if (!this.socket) {
      this.connect();
    }

    return () => this.unsubscribe(uid);
  }

  unsubscribe(subscriberUID: string): void {
    const subscriptionEntries = Array.from(this.subscriptions.entries());

    subscriptionEntries.find(([channel, handlers]) => {
      const index = handlers.findIndex((h) => h.id === subscriberUID);
      if (index !== -1) {
        handlers.splice(index, 1);

        if (handlers.length === 0) {
          this.subscriptions.delete(channel);
          if (this.socket?.connected) {
            this.sendUnsubscription(channel);
          }
        }
        return true;
      }
      return false;
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.subscriptions.clear();
    this.isConnecting = false;
  }

  protected notifyHandlers(channel: string, data: any): void {
    const handlers = this.subscriptions.get(channel);
    if (!handlers) return;

    handlers.forEach((handler) => {
      try {
        handler.callback(data);
      } catch (error) {
        logBonsaiError(this.constructor.name, 'handler error', { error });
      }
    });
  }

  protected abstract sendSubscription(channel: string): void;

  protected abstract sendUnsubscription(channel: string): void;

  private resubscribeAll(): void {
    Array.from(this.subscriptions.keys()).forEach((channel) => {
      this.sendSubscription(channel);
    });
  }

  private startHeartbeat(): void {
    if (!this.heartbeatConfig) return;

    this.heartbeatInterval = setInterval(() => {
      this.socket?.emit(this.heartbeatConfig!.event);
    }, this.heartbeatConfig.interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  get urlValue() {
    return this.url;
  }
}
