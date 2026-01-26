import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@sdk/shared/lib/redux';
import type { DecimalValueInstance } from '@sdk/shared/models/DecimalValue';
import { DecimalValue, createDecimalValueSchema } from '@sdk/shared/models/DecimalValue';
import type { Account } from 'fuels';
import { type WalletEntity, WalletEntitySchema } from '../../../domain';

export interface CurrentUserThunkExtra {
  walletGetter: () => Promise<Account | null>;
}

export const asyncFetchCurrentUserBalancesThunk = createAsyncThunk<
  WalletEntity,
  void,
  { extra: CurrentUserThunkExtra; rejectValue: string }
>('accounts/wallet/connectWallet', async (_arg, { extra, rejectWithValue, getState }) => {
  try {
    const userAccount = await extra.walletGetter();
    if (!userAccount) {
      return rejectWithValue('No account found after connection');
    }

    const getBalancesResult = await userAccount.getBalances();

    const balances = getBalancesResult.balances.reduce<Record<string, DecimalValueInstance>>(
      (acc, curr) => {
        const precision = selectAssetPrecision(getState() as RootState, curr.assetId);

        if (precision == null) {
          acc[curr.assetId] = DecimalValue.fromBigIntString(curr.amount.toString());
          return acc;
        }

        acc[curr.assetId] = createDecimalValueSchema(precision).fromBigIntString(
          curr.amount.toString()
        );
        return acc;
      },
      {}
    );

    return WalletEntitySchema.parse({
      address: userAccount.address.b256Address,
      balances,
    });
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to connect wallet');
  }
});

// TODO: Fix the boundary breaking
const selectAssetPrecision = (state: RootState, assetId: string) => {
  return state.trading.markets.assets.data.find((a) => a.assetId === assetId)?.decimals;
};
