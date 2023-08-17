import { createSlice } from '@reduxjs/toolkit';

export interface NavigationState {
  tradeLocation: {
    hash: string;
    key: string;
    pathname: string;
    search: string;
    state: any;
  };
}

export const CLEAR_TRADE_LOCATION = {
  hash: '',
  key: '',
  pathname: '',
  search: '',
  state: null,
};

const initialState: NavigationState = {
  tradeLocation: {
    hash: '',
    key: '',
    pathname: '',
    search: '',
    state: null,
  },
};

export const navigationSlice = createSlice({
  name: 'Navigation',
  initialState,
  reducers: {
    setTradeLocation: (state, { payload }) => ({
      ...state,
      tradeLocation: payload,
    }),
  },
});

export const { setTradeLocation } = navigationSlice.actions;
