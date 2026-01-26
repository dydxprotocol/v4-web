import { combineReducers } from '@reduxjs/toolkit';
import * as currentUser from './CurrentUser';

export const walletReducer = combineReducers({ currentUser: currentUser.reducer });
export type WalletThunkExtra = currentUser.CurrentUserThunkExtra;
