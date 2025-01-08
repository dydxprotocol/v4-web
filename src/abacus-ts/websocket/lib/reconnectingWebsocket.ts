/* eslint-disable max-classes-per-file */
import { logAbacusTsError } from '@/abacus-ts/logs';

interface ReconnectingWebSocketConfig {
  url: string;
  handleMessage: (data: any) => void;
  handleFreshConnect: () => void;
  initialReconnectInterval?: number;
  maxReconnectInterval?: number;
  backoffMultiplier?: number;
}

export class ReconnectingWebSocket {
  private readonly url: string;

  private readonly handleMessage: (data: any) => void;

  private readonly handleFreshConnect: () => void;

  private readonly initialReconnectInterval: number;

  private readonly maxReconnectInterval: number;

  private readonly backoffMultiplier: number;

  private ws: WebSocketConnection | null = null;

  private currentId: number = 0;

  private isDead: boolean = false;

  private numberOfFailedAttempts: number = 0;

  private reconnectTimeout: NodeJS.Timeout | undefined = undefined;

  constructor(config: ReconnectingWebSocketConfig) {
    this.url = config.url;
    this.handleMessage = config.handleMessage;
    this.handleFreshConnect = config.handleFreshConnect;

    this.initialReconnectInterval = config.initialReconnectInterval ?? 1000;
    this.maxReconnectInterval = config.maxReconnectInterval ?? 120_000;
    this.backoffMultiplier = config.backoffMultiplier ?? 1.5;

    this.connect();
  }

  private connect(): void {
    this.currentId += 1;

    this.ws?.close();

    this.ws = new WebSocketConnection({
      id: this.currentId,
      url: this.url,
      handleClose: this.handleWsClosed,
      handleConnected: this.handleWsConnected,
      handleMessage: this.handleWsMessage,
    });
  }

  private handleWsClosed = (id: number) => {
    if (id !== this.currentId || this.isDead) return;
    // so we know this is the websocket we care about and it closed NOT in response to our action
    // so we should try to reconnect by spinning up a new websocket
    this.numberOfFailedAttempts += 1;

    const interval = Math.min(
      this.initialReconnectInterval * this.backoffMultiplier ** (this.numberOfFailedAttempts - 1),
      this.maxReconnectInterval
    );

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`ReconnectingWebSocket: Attempting to reconnect after ${interval / 1000}s...`);
      this.connect();
    }, interval);
  };

  private handleWsConnected = (id: number) => {
    // can happen if we rapidly switch websockets maybe ??
    if (id !== this.currentId || this.isDead) return;
    this.numberOfFailedAttempts = 0;
    this.handleFreshConnect();
  };

  private handleWsMessage = (id: number, data: any) => {
    if (id !== this.currentId || this.isDead) return;
    this.handleMessage(data);
  };

  public restart() {
    clearTimeout(this.reconnectTimeout);
    this.connect();
  }

  public isActive(): boolean {
    return this.ws != null && this.ws.isActive() && !this.isDead;
  }

  public send(data: any): void {
    if (!this.isActive()) {
      logAbacusTsError(
        'ReconnectingWebsocket',
        'Someone attempted to send data on socket in invalid state',
        this.url
      );
      throw new Error('ReconnectingWebSocket: WebSocket is not connected');
    }
    this.ws!.send(data);
  }

  public teardown(): void {
    clearTimeout(this.reconnectTimeout);
    this.isDead = true;
    this.currentId += 1;
    this.ws?.close();
    this.ws = null;
  }
}

interface WebSocketConnectionConfig {
  id: number;
  url: string;
  handleMessage: (id: number, data: any) => void;
  handleConnected: (id: number) => void;
  handleClose: (id: number) => void;
}

class WebSocketConnection {
  public readonly id: number;

  private ws: WebSocket | null = null;

  private isClosed: boolean = false;

  private readonly handleMessage: (id: number, data: any) => void;

  private readonly handleConnected: (id: number) => void;

  private readonly handleClose: (id: number) => void;

  constructor(config: WebSocketConnectionConfig) {
    this.id = config.id;
    this.handleMessage = config.handleMessage;
    this.handleConnected = config.handleConnected;
    this.handleClose = config.handleClose;
    this.connect(config.url);
  }

  private connect(url: string): void {
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      logAbacusTsError('WebSocketConnection', 'error connecting', error);
      this.close();
      // we don't rethrow because we instead call the handleClose method
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      if (this.isClosed) return;
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(this.id, data);
      } catch (e) {
        logAbacusTsError('WebSocketConnection', 'error in handler', e);
      }
    };

    this.ws.onopen = () => {
      if (this.isClosed) return;
      // eslint-disable-next-line no-console
      console.log(`WebSocket ${this.id}: Connected to websocket`);
      try {
        this.handleConnected(this.id);
      } catch (e) {
        logAbacusTsError('WebSocketConnection', 'error in handleConnected', e);
      }
    };

    this.ws.onerror = () => {
      this.close();
    };

    this.ws.onclose = (close) => {
      // 1000 is expected and 1001 is for browser navigating away, below that are unused
      if (close.code > 1001) {
        logAbacusTsError('WebSocketConnection', `socket ${this.id} closed`, close);
      }
      this.close();
    };
  }

  public close(): void {
    if (this.isClosed) return;
    try {
      this.isClosed = true;
      this.handleClose(this.id);
      this.ws?.close();
      this.ws = null;
    } catch (e) {
      logAbacusTsError('WebSocketConnection', 'error closing socket', e);
    }
  }

  public isActive(): boolean {
    return !this.isClosed && this.ws != null && this.ws.readyState === WebSocket.OPEN;
  }

  public send(data: any): void {
    if (!this.isActive()) {
      logAbacusTsError(
        'WebSocketConnection',
        `Socket ${this.id} attempted to send data in invalid state`,
        { closed: this.isClosed, nullWs: this.ws == null, readyState: this.ws?.readyState }
      );
      throw new Error(`WebSocket ${this.id} is not connected`);
    }
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws!.send(message);
    } catch (e) {
      logAbacusTsError('WebSocketConnection', 'error sending data', e, data);
    }
  }
}
