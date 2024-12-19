import { HeightResponse } from '@dydxprotocol/v4-client-js';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DydxNetwork } from '@/constants/networks';

// NOTE: This app slice is persisted via redux-persist. Changes to this type may require migrations.

export const ALL_MARKETS_STRING = '___ALL_MARKETS___';

// TODO: seen notifications belong in here too
export interface AccountUiMemoryBase {
  seenFills: { [marketIdOrAllMarkets: string]: HeightResponse };
  seenOpenOrders: { [marketIdOrAllMarkets: string]: HeightResponse };
  seenOrderHistory: { [marketIdOrAllMarkets: string]: HeightResponse };
}

type SeenHeightPayload = { height: HeightResponse; market: string | undefined };

export type AccountUiMemoryState = {
  [walletId: string]: {
    [networkId: string]: AccountUiMemoryBase;
  };
};

type AccountScope = {
  walletId: string;
  networkId: DydxNetwork;
};
type ScopePayload = { scope: AccountScope };

export const initialState: AccountUiMemoryState = {};

function ensureScopePresent(state: AccountUiMemoryState, scope: ScopePayload): AccountUiMemoryBase {
  state[scope.scope.walletId] ??= {};
  state[scope.scope.walletId]![scope.scope.networkId] ??= {
    seenFills: {},
    seenOpenOrders: {},
    seenOrderHistory: {},
  };
  return state[scope.scope.walletId]![scope.scope.networkId]!;
}

function setSeen(
  state: AccountUiMemoryBase,
  key: 'seenFills' | 'seenOpenOrders' | 'seenOrderHistory',
  payload: SeenHeightPayload
) {
  const maybeAll = state[key][ALL_MARKETS_STRING];
  const maybeUs = state[key][payload.market ?? ALL_MARKETS_STRING];
  // make sure we are more than existing and more than base
  if (
    (maybeAll == null || maybeAll.height < payload.height.height) &&
    (maybeUs == null || maybeUs.height < payload.height.height)
  ) {
    state[key][payload.market ?? ALL_MARKETS_STRING] = payload.height;
  }
  // if all markets, remove all smaller
  if (payload.market == null) {
    Object.keys(state[key]).forEach((marketOrAll) => {
      if (marketOrAll === ALL_MARKETS_STRING) {
        return;
      }
      if (state[key][marketOrAll]!.height < payload.height.height) {
        delete state[key][marketOrAll];
      }
    });
  }
}

export const accountUiMemorySlice = createSlice({
  name: 'accountUiMemory',
  initialState,
  reducers: {
    setSeenFills: (
      state: AccountUiMemoryState,
      { payload }: PayloadAction<SeenHeightPayload & ScopePayload>
    ) => {
      const thisState = ensureScopePresent(state, payload);
      setSeen(thisState, 'seenFills', payload);
    },
    setSeenOpenOrders: (
      state: AccountUiMemoryState,
      { payload }: PayloadAction<SeenHeightPayload & ScopePayload>
    ) => {
      const thisState = ensureScopePresent(state, payload);
      setSeen(thisState, 'seenOpenOrders', payload);
    },
    setSeenOrderHistory: (
      state: AccountUiMemoryState,
      { payload }: PayloadAction<SeenHeightPayload & ScopePayload>
    ) => {
      const thisState = ensureScopePresent(state, payload);
      setSeen(thisState, 'seenOrderHistory', payload);
    },
  },
});

export const { setSeenFills, setSeenOpenOrders, setSeenOrderHistory } =
  accountUiMemorySlice.actions;
