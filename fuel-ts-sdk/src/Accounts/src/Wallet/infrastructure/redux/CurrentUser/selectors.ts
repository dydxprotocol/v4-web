import type { RootState } from '@sdk/shared/lib/redux';
import type { CurrentUserState } from './types';

export const selectCurrentUserState = (state: RootState): CurrentUserState =>
  state.accounts.wallet.currentUser;
