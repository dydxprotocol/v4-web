import { selectCurrentUserState } from '@sdk/Accounts/src/Wallet/infrastructure/redux/CurrentUser/selectors';
import {
  currentUserActions,
  reducer,
} from '@sdk/Accounts/src/Wallet/infrastructure/redux/CurrentUser/slice';
import {
  type CurrentUserState,
  nullCurrentUserState,
} from '@sdk/Accounts/src/Wallet/infrastructure/redux/CurrentUser/types';
import type { RootState } from '@sdk/shared/lib/redux';
import { describe, expect, it } from 'vitest';
import {
  TEST_ADDRESS,
  createTestCurrentUserState,
  createTestWalletEntity,
} from '../test-fixtures/wallet';

describe('CurrentUser Redux Slice', () => {
  describe('reducer', () => {
    describe('initial state', () => {
      it('should return the null state as initial state', () => {
        const state = reducer(undefined, { type: 'unknown' });

        expect(state).toEqual(nullCurrentUserState);
        expect(state.status).toBe('uninitialized');
        expect(state.data).toBeUndefined();
        expect(state.error).toBeUndefined();
      });
    });

    describe('invalidateCurrentUserDataFetch', () => {
      it('should set status to uninitialized', () => {
        const initialState: CurrentUserState = {
          data: createTestWalletEntity(),
          status: 'fulfilled',
          error: null,
        };

        const state = reducer(initialState, currentUserActions.invalidateCurrentUserDataFetch());

        expect(state.status).toBe('uninitialized');
        // Data should remain unchanged
        expect(state.data).toBe(initialState.data);
      });

      it('should work when already uninitialized', () => {
        const state = reducer(
          nullCurrentUserState,
          currentUserActions.invalidateCurrentUserDataFetch()
        );

        expect(state.status).toBe('uninitialized');
      });

      it('should work when in pending state', () => {
        const initialState: CurrentUserState = {
          data: undefined,
          status: 'pending',
          error: null,
        };

        const state = reducer(initialState, currentUserActions.invalidateCurrentUserDataFetch());

        expect(state.status).toBe('uninitialized');
      });

      it('should work when in rejected state', () => {
        const initialState: CurrentUserState = {
          data: null,
          status: 'rejected',
          error: 'Some error',
        };

        const state = reducer(initialState, currentUserActions.invalidateCurrentUserDataFetch());

        expect(state.status).toBe('uninitialized');
        // Error should remain unchanged
        expect(state.error).toBe('Some error');
      });
    });
  });

  describe('selectors', () => {
    describe('selectCurrentUserState', () => {
      it('should select the current user state', () => {
        const currentUserState = createTestCurrentUserState();
        const state = {
          accounts: {
            wallet: {
              currentUser: currentUserState,
            },
          },
        } as RootState;

        const result = selectCurrentUserState(state);

        expect(result).toBe(currentUserState);
        expect(result.data?.address).toBe(TEST_ADDRESS);
      });

      it('should select null state', () => {
        const state = {
          accounts: {
            wallet: {
              currentUser: nullCurrentUserState,
            },
          },
        } as RootState;

        const result = selectCurrentUserState(state);

        expect(result).toEqual(nullCurrentUserState);
        expect(result.status).toBe('uninitialized');
      });
    });
  });
});
