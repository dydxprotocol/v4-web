import { logAbacusTsError } from '@/abacus-ts/logs';
import typia from 'typia';

import { timeUnits } from '@/constants/time';

import { assertNever } from '@/lib/assertNever';
import { isTruthy } from '@/lib/isTruthy';

import { ReconnectingWebSocket } from './reconnectingWebsocket';

const NO_ID_SPECIAL_STRING_ID = '______EMPTY_ID______';
const CHANNEL_RETRY_COOLDOWN_MS = timeUnits.minute;

export class IndexerWebsocket {
  private socket: ReconnectingWebSocket | null = null;

  private subscriptions: {
    [channel: string]: {
      [id: string]: {
        channel: string;
        id: string | undefined;
        batched: boolean;
        handleBaseData: (data: any, fullMessage: any) => void;
        handleUpdates: (updates: any[], fullMessage: any) => void;
        sentSubMessage: boolean;
      };
    };
  } = {};

  private lastRetryTimeMsByChannel: { [channel: string]: number } = {};

  constructor(url: string) {
    this.socket = new ReconnectingWebSocket({
      url,
      handleFreshConnect: this._handleFreshConnect,
      handleMessage: this._handleMessage,
    });
  }

  restart(): void {
    this.socket?.restart();
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
    handleBaseData: (data: any, fullMessage: any) => void;
    handleUpdates: (data: any[], fullMessage: any) => void;
  }): () => void {
    this._addSub({ channel, id, batched, handleUpdates, handleBaseData });
    return () => {
      this._performUnsub({ channel, id });
    };
  }

  private _addSub = ({
    channel,
    id,
    batched = true,
    handleUpdates,
    handleBaseData,
  }: {
    channel: string;
    id: string | undefined;
    batched?: boolean;
    handleBaseData: (data: any, fullMessage: any) => void;
    handleUpdates: (data: any[], fullMessage: any) => void;
  }) => {
    this.subscriptions[channel] ??= {};
    if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] != null) {
      logAbacusTsError('IndexerWebsocket', 'this subscription already exists', `${channel}/${id}`);
      throw new Error(`IndexerWebsocket error: this subscription already exists. ${channel}/${id}`);
    }
    this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] = {
      channel,
      id,
      batched,
      handleBaseData,
      handleUpdates,
      sentSubMessage: false,
    };
    if (this.socket != null && this.socket.isActive()) {
      this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.sentSubMessage = true;
      this.socket.send({
        batched,
        channel,
        id,
        type: 'subscribe',
      });
    }
  };

  private _performUnsub = ({ channel, id }: { channel: string; id: string | undefined }) => {
    if (this.subscriptions[channel] == null) {
      logAbacusTsError(
        'IndexerWebsocket',
        'unsubbing from nonexistent or already unsubbed channel',
        channel
      );
      return;
    }
    if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] == null) {
      logAbacusTsError(
        'IndexerWebsocket',
        'unsubbing from nonexistent or already unsubbed channel',
        channel,
        id
      );
      return;
    }
    if (
      this.socket != null &&
      this.socket.isActive() &&
      this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.sentSubMessage
    ) {
      this.socket.send({
        channel,
        id,
        type: 'unsubscribe',
      });
    }
    delete this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID];
  };

  private _refreshChannelSubs = (channel: string) => {
    const allSubs = Object.values(this.subscriptions[channel] ?? {});
    allSubs.forEach((sub) => {
      this._performUnsub(sub);
      this._addSub(sub);
    });
  };

  // if we get a "coud not fetch data" error, we retry once as long as this channel is not on cooldown
  // TODO: when backend adds the channel and id to the error message, use that to retry only one subscription
  private _handleErrorReceived = (message: string) => {
    if (message.startsWith('Internal error, could not fetch data for subscription: ')) {
      const maybeChannel = message
        .trim()
        .split(/[\s,.]/)
        .at(-2);
      if (maybeChannel != null && maybeChannel.startsWith('v4_')) {
        const lastRefresh = this.lastRetryTimeMsByChannel[maybeChannel] ?? 0;
        if (new Date().valueOf() - lastRefresh > CHANNEL_RETRY_COOLDOWN_MS) {
          this.lastRetryTimeMsByChannel[maybeChannel] = new Date().valueOf();
          this._refreshChannelSubs(maybeChannel);
          logAbacusTsError(
            'IndexerWebsocket',
            'error fetching data for channel, refetching',
            maybeChannel
          );
          return;
        }
        logAbacusTsError('IndexerWebsocket', 'hit max retries for channel:', maybeChannel);
        return;
      }
    }
    logAbacusTsError('IndexerWebsocket', 'encountered server side error:', message);
  };

  private _handleMessage = (messagePre: any) => {
    try {
      const message = isWsMessage(messagePre);
      if (message.type === 'error') {
        this._handleErrorReceived(message.message);
      } else if (message.type === 'connected' || message.type === 'unsubscribed') {
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
          // hide error for channel we expect to see it on
          if (channel !== 'v4_orderbook') {
            logAbacusTsError(
              'IndexerWebsocket',
              'encountered message with unknown target',
              channel,
              id
            );
          }
          return;
        }
        if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] == null) {
          // hide error for channel we expect to see it on
          if (channel !== 'v4_orderbook') {
            logAbacusTsError(
              'IndexerWebsocket',
              'encountered message with unknown target',
              channel,
              id
            );
          }
          return;
        }
        if (message.type === 'subscribed') {
          this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.handleBaseData(
            message.contents,
            message
          );
        } else if (message.type === 'channel_data') {
          this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.handleUpdates(
            [message.contents],
            message
          );
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (message.type === 'channel_batch_data') {
          this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID]!.handleUpdates(
            message.contents,
            message
          );
        } else {
          assertNever(message);
        }
      } else {
        assertNever(message);
      }
    } catch (e) {
      logAbacusTsError('IndexerWebsocket', 'Error handling websocket message', messagePre, e);
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
          this.subscriptions[channel]![id ?? NO_ID_SPECIAL_STRING_ID]!.sentSubMessage = true;
          this.socket!.send({
            batched,
            channel,
            id,
            type: 'subscribe',
          });
        });
    } else {
      logAbacusTsError(
        'IndexerWebsocket',
        "handle fresh connect called when websocket isn't ready."
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
      subaccountNumber?: number;
      contents: any[];
    }
  | {
      type: 'channel_data';
      channel: string;
      id: string | undefined;
      version: string;
      subaccountNumber?: number;
      contents: any;
    }
  | { type: 'subscribed'; channel: string; id: string | undefined; contents: any }
  | { type: 'unsubscribed'; channel: string; id: string | undefined; contents: any };

export const isWsMessage = typia.createAssert<IndexerWebsocketMessageType>();
