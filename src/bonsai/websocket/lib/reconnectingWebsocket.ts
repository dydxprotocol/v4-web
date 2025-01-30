/* eslint-disable max-classes-per-file */
import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';

interface ReconnectingWebSocketConfig {
  url: string;
  handleMessage: (data: any) => void;
  handleFreshConnect: () => void;
  initialReconnectInterval?: number;
  connectionTimeToConsiderLive?: number;
  maxReconnectInterval?: number;
  backoffMultiplier?: number;
}

export class ReconnectingWebSocket {
  public readonly url: string;

  private readonly handleMessage: (data: any) => void;

  private readonly handleFreshConnect: () => void;

  private readonly initialReconnectInterval: number;

  private readonly maxReconnectInterval: number;

  private readonly backoffMultiplier: number;

  private readonly connectionTimeToConsiderLive: number;

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
    this.connectionTimeToConsiderLive = config.connectionTimeToConsiderLive ?? 5000;

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

    // after x seconds, reset our failure counter if we're still alive
    setTimeout(() => {
      if (id !== this.currentId || this.isDead || !this.isActive()) return;
      this.numberOfFailedAttempts = 0;
    }, this.connectionTimeToConsiderLive);

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
      logBonsaiError(
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
      logBonsaiError('WebSocketConnection', 'error connecting', { error });
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
        logBonsaiError('WebSocketConnection', 'error in handler', { error: e, data: event.data });
        this.close();
      }
    };

    this.ws.onopen = () => {
      if (this.isClosed) return;
      // eslint-disable-next-line no-console
      console.log(`WebSocket ${this.id}: Connected to websocket`);
      try {
        this.handleConnected(this.id);
      } catch (e) {
        logBonsaiError('WebSocketConnection', 'error in handleConnected', { error: e });
        this.close();
      }
    };

    this.ws.onerror = () => {
      this.close();
    };

    this.ws.onclose = (close) => {
      const allowedCodes = new Set([
        // normal
        1000,
        // going away (nav or graceful server shutdown)
        1001,
        // normal but no code
        1005,
        // supposedly abnormal tcp failure but super super common
        1006,
      ]);
      if (!allowedCodes.has(close.code)) {
        logBonsaiError('WebSocketConnection', `socket ${this.id} closed abnormally`, {
          code: close.code,
          reason: close.reason,
          clean: close.wasClean,
        });
      } else {
        logBonsaiInfo('WebSocketConnection', `socket ${this.id} closed`, {
          code: close.code,
          reason: close.reason,
          clean: close.wasClean,
        });
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
      logBonsaiError('WebSocketConnection', 'error closing socket', { error: e });
    }
  }

  public isActive(): boolean {
    return !this.isClosed && this.ws != null && this.ws.readyState === WebSocket.OPEN;
  }

  public send(data: any): void {
    if (!this.isActive()) {
      logBonsaiError(
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
      logBonsaiError('WebSocketConnection', 'error sending data', { error: e, data });
    }
  }
}
