interface WebSocketConfig {
  url: string;
  handleMessage: (data: any) => void;
  handleFreshConnect: () => void;
  initialReconnectInterval?: number;
  maxReconnectInterval?: number;
  backoffMultiplier?: number;
}

export class ReconnectingWebSocket {
  private ws: WebSocket | null = null;

  private readonly url: string;

  private readonly handleMessage: (data: any) => void;

  private readonly handleFreshConnect: () => void;

  private readonly initialReconnectInterval: number;

  private readonly maxReconnectInterval: number;

  private readonly backoffMultiplier: number;

  private isDead: boolean = false;

  private currentReconnectInterval: number;

  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.handleMessage = config.handleMessage;
    this.handleFreshConnect = config.handleFreshConnect;

    this.initialReconnectInterval = config.initialReconnectInterval ?? 1_000;
    this.maxReconnectInterval = config.maxReconnectInterval ?? 60_000;
    this.backoffMultiplier = config.backoffMultiplier ?? 1.5;
    this.currentReconnectInterval = this.initialReconnectInterval;

    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('ReconnectingWebSocket: error in handler', e);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        // eslint-disable-next-line no-console
        console.error('ReconnectingWebSocket error:', error);
        this.ws?.close();
      };

      this.ws.onopen = () => {
        this.currentReconnectInterval = this.initialReconnectInterval;
        // eslint-disable-next-line no-console
        console.log('ReconnectingWebsocket: Connected to ', this.url);

        this.handleFreshConnect();
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('ReconnectingWebSocket connection error:', error);
      this.ws?.close();
      this.ws = null;
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.isDead) {
      return;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(
        `ReconnectingWebSocket: Attempting to reconnect after ${this.currentReconnectInterval / 1000}s...`
      );

      // Calculate next interval with exponential backoff
      this.currentReconnectInterval = Math.min(
        this.currentReconnectInterval * this.backoffMultiplier,
        this.maxReconnectInterval
      );

      this.connect();
    }, this.currentReconnectInterval);
  }

  public isActive(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('ReconnectingWebSocket: WebSocket is not connected');
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(message);
  }

  public teardown(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isDead = true;
    this.ws?.close();
    this.ws = null;
  }
}
