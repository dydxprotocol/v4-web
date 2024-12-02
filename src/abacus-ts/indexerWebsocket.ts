import { assertNever } from '@/lib/assertNever';
import { isTruthy } from '@/lib/isTruthy';

import { ReconnectingWebSocket } from './reconnectingWebsocket';

const NO_ID_SPECIAL_STRING_ID = '____EMPTY_ID______';
export class IndexerWebsocket {
  private socket: ReconnectingWebSocket | null = null;

  private subscriptions: {
    [channel: string]: {
      [id: string]: {
        channel: string;
        id: string | undefined;
        batched: boolean;
        handleBaseData: (data: any) => void;
        handleUpdates: (updates: any[]) => void;
      };
    };
  } = {};

  constructor(url: string) {
    this.socket = new ReconnectingWebSocket({
      url,
      handleFreshConnect: this._handleFreshConnect,
      handleMessage: this._handleMessage,
    });
  }

  teardown(): void {
    this.socket?.teardown();
    this.socket = null;
  }

  // returns the unsubscribe function
  addChannelSubscription({
    channel,
    id,
    batched = true,
    handleUpdates,
    handleBaseData,
  }: {
    channel: string;
    id: string | undefined;
    batched?: boolean;
    handleBaseData: (data: any) => void;
    handleUpdates: (data: any[]) => void;
  }): () => void {
    this.subscriptions[channel] ??= {};
    if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] != null) {
      throw new Error(`IndexerWebsocket error: this subscription already exists. ${channel}/${id}`);
    }
    this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] = {
      channel,
      id,
      batched,
      handleBaseData,
      handleUpdates,
    };
    if (this.socket != null && this.socket.isActive()) {
      this.socket.send({
        batched,
        channel,
        id,
        type: 'subscribe',
      });
    }

    return () => {
      if (this.subscriptions[channel] == null) {
        return;
      }
      if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] == null) {
        return;
      }
      if (this.socket != null && this.socket.isActive()) {
        this.socket.send({
          channel,
          id,
          type: 'unsubscribe',
        });
      }
      delete this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID];
    };
  }

  private _handleMessage = (message: IndexerWebsocketMessageType) => {
    if (message.type === 'error') {
      // eslint-disable-next-line no-console
      console.error('IndexerWebsocket encountered server side error:', message.message);
    } else if (message.type === 'connected') {
      // do nothing
    } else if (
      message.type === 'subscribed' ||
      message.type === 'channel_batch_data' ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      message.type === 'channel_data'
    ) {
      const channel = message.channel;
      const id = message.id;
      if (this.subscriptions[channel] == null) {
        // eslint-disable-next-line no-console
        console.error('IndexerWebsocket encountered message with unknown target', channel, id);
        return;
      }
      if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] == null) {
        // eslint-disable-next-line no-console
        console.error('IndexerWebsocket encountered message with unknown target', channel, id);
        return;
      }
      if (message.type === 'subscribed') {
        this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.handleBaseData(
          message.contents
        );
      } else if (message.type === 'channel_data') {
        this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.handleUpdates([
          message.contents,
        ]);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (message.type === 'channel_batch_data') {
        this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.handleUpdates(message.contents);
      } else {
        assertNever(message);
      }
    } else {
      assertNever(message);
    }
  };

  // when websocket churns, reconnect all known subscribers
  private _handleFreshConnect = () => {
    if (this.socket != null && this.socket.isActive()) {
      Object.values(this.subscriptions)
        .filter(isTruthy)
        .flatMap((o) => Object.values(o))
        .filter(isTruthy)
        .forEach(({ batched, channel, id }) => {
          this.socket!.send({
            batched,
            channel,
            id,
            type: 'subscribe',
          });
        });
    } else {
      // eslint-disable-next-line no-console
      console.error(
        "IndexerWebsocket error: handle fresh connect called when websocket isn't ready."
      );
    }
  };
}

type IndexerWebsocketMessageType =
  | { type: 'error'; message: string }
  | { type: 'connected' }
  | {
      type: 'channel_batch_data';
      channel: string;
      id: string | undefined;
      version: string;
      contents: any[];
    }
  | {
      type: 'channel_data';
      channel: string;
      id: string | undefined;
      version: string;
      contents: any;
    }
  | { type: 'subscribed'; channel: string; id: string | undefined; contents: any };
