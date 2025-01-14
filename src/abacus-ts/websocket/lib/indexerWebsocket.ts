import { logAbacusTsError, logAbacusTsInfo } from '@/abacus-ts/logs';
import typia from 'typia';

import { timeUnits } from '@/constants/time';

import { assertNever } from '@/lib/assertNever';
import { isTruthy } from '@/lib/isTruthy';

import { ReconnectingWebSocket } from './reconnectingWebsocket';

const NO_ID_SPECIAL_STRING_ID = '______EMPTY_ID______';
const CHANNEL_ID_SAFE_DIVIDER = '//////////';
const CHANNEL_RETRY_COOLDOWN_MS = timeUnits.minute;

export class IndexerWebsocket {
  private socket: ReconnectingWebSocket | null = null;

  // for logging purposes, to differentiate when user has many tabs open
  private indexerWsId = crypto.randomUUID();

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

  private lastRetryTimeMsByChannelAndId: { [channelAndId: string]: number } = {};

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
      logAbacusTsError('IndexerWebsocket', 'this subscription already exists', {
        id: `${channel}/${id}`,
        wsId: this.indexerWsId,
      });
      throw new Error(`IndexerWebsocket error: this subscription already exists. ${channel}/${id}`);
    }
    logAbacusTsInfo('IndexerWebsocket', 'adding subscription', {
      channel,
      id,
      socketNonNull: this.socket != null,
      socketActive: this.socket?.isActive(),
      wsId: this.indexerWsId,
    });
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
        { channel, wsId: this.indexerWsId }
      );
      return;
    }
    if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] == null) {
      logAbacusTsError(
        'IndexerWebsocket',
        'unsubbing from nonexistent or already unsubbed channel',
        { channel, id, wsId: this.indexerWsId }
      );
      return;
    }
    logAbacusTsInfo('IndexerWebsocket', 'removing subscription', {
      channel,
      id,
      socketNonNull: this.socket != null,
      socketActive: this.socket?.isActive(),
      wsId: this.indexerWsId,
    });
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

  private _refreshSub = (channel: string, id: string | undefined) => {
    const sub = this.subscriptions[channel]?.[id ?? NO_ID_SPECIAL_STRING_ID];
    if (sub == null) {
      return;
    }
    this._performUnsub(sub);
    this._addSub(sub);
  };

  // if we get a "could not fetch data" error, we retry once as long as this channel+id is not on cooldown
  // TODO: remove this entirely when backend is more reliable
  private _handleErrorReceived = (message: IndexerWebsocketErrorMessage) => {
    if (message.message.startsWith('Internal error, could not fetch data for subscription: ')) {
      const maybeChannel = message.channel;
      const maybeId = message.id;
      if (maybeChannel != null && maybeChannel.startsWith('v4_')) {
        const channelAndId = `${maybeChannel}${CHANNEL_ID_SAFE_DIVIDER}${maybeId ?? NO_ID_SPECIAL_STRING_ID}`;
        const lastRefresh = this.lastRetryTimeMsByChannelAndId[channelAndId] ?? 0;
        if (Date.now() - lastRefresh > CHANNEL_RETRY_COOLDOWN_MS) {
          this.lastRetryTimeMsByChannelAndId[channelAndId] = Date.now();
          this._refreshSub(maybeChannel, maybeId);
          logAbacusTsInfo('IndexerWebsocket', 'error fetching data for channel, refetching', {
            maybeChannel,
            maybeId,
            wsId: this.indexerWsId,
          });
          return;
        }
        logAbacusTsError('IndexerWebsocket', 'hit max retries for channel:', {
          maybeChannel,
          maybeId,
          wsId: this.indexerWsId,
        });
        return;
      }
    }
    logAbacusTsError('IndexerWebsocket', 'encountered server side error:', {
      message,
      wsId: this.indexerWsId,
    });
  };

  private _handleMessage = (messagePre: any) => {
    try {
      const message = isWsMessage(messagePre);
      if (message.type === 'error') {
        this._handleErrorReceived(message);
      } else if (message.type === 'connected') {
        // do nothing
      } else if (message.type === 'unsubscribed') {
        logAbacusTsInfo('IndexerWebsocket', `unsubscribe confirmed`, {
          channel: message.channel,
          id: message.id,
          wsId: this.indexerWsId,
        });
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
            logAbacusTsError('IndexerWebsocket', 'encountered message with unknown target', {
              channel,
              id,
              wsId: this.indexerWsId,
            });
          }
          return;
        }
        if (this.subscriptions[channel][id ?? NO_ID_SPECIAL_STRING_ID] == null) {
          // hide error for channel we expect to see it on
          if (channel !== 'v4_orderbook') {
            logAbacusTsError('IndexerWebsocket', 'encountered message with unknown target', {
              channel,
              id,
              wsId: this.indexerWsId,
            });
          }
          return;
        }
        if (message.type === 'subscribed') {
          logAbacusTsInfo('IndexerWebsocket', `subscription confirmed`, {
            channel,
            id,
            wsId: this.indexerWsId,
          });
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
      logAbacusTsError('IndexerWebsocket', 'Error handling websocket message', {
        messagePre,
        wsId: this.indexerWsId,
        error: e,
      });
    }
  };

  // when websocket churns, reconnect all known subscribers
  private _handleFreshConnect = () => {
    logAbacusTsInfo('IndexerWebsocket', 'freshly connected', {
      socketUrl: this.socket?.url,
      wsId: this.indexerWsId,
      socketNonNull: this.socket != null,
      socketActive: this.socket?.isActive(),
      subs: Object.values(this.subscriptions)
        .flatMap((o) => Object.values(o))
        .filter(isTruthy)
        .map((o) => `${o.channel}///${o.id}`),
    });
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
        "handle fresh connect called when websocket isn't ready.",
        { wsId: this.indexerWsId }
      );
    }
  };
}

type IndexerWebsocketErrorMessage = {
  type: 'error';
  message: string;
  channel?: string;
  id?: string;
};
type IndexerWebsocketMessageType =
  | IndexerWebsocketErrorMessage
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
