import { zodDecimalValueSchema } from '@sdk/shared/lib/zod';
import { AddressSchema, AssetIdSchema } from '@sdk/shared/types';
import z from 'zod';

export type WalletBalancesEntity = z.infer<typeof WalletBalancesEntitySchema>;
export const WalletBalancesEntitySchema = z.record(AssetIdSchema, zodDecimalValueSchema());

export type WalletEntity = z.infer<typeof WalletEntitySchema>;
export const WalletEntitySchema = z.object({
  address: AddressSchema,
  balances: WalletBalancesEntitySchema,
});
