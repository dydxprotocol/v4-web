import type { Address, AssetId } from '../types';
import { address, assetId } from '../types';

export const ASSET_SYMBOLS = ['USDC', 'BTC', 'BNB', 'ETH'] as const;
export type AssetSymbol = (typeof ASSET_SYMBOLS)[number];

export const ASSET_SYMBOL_TO_CONTRACT_ID: Record<AssetSymbol, Address> = {
  USDC: address('0x5CDc3143D0bC1fFD896D025F0c88fC10593aa768D20416a151F6734430e78ad9'),
  BTC: address('0xE4c8C10b31D9De5D4333C389A7101E580630D053AF47467A40fb1D1DAd6B399c'),
  BNB: address('0xa0A76C0D74cDAd92f1282B8dFbF35C39F7a5434611A076Bb08E239EA4bb2B6E0'),
  ETH: address('0x5B6712bF3A0E877E3A97A5B903B97c34FDefE8526E40fD4F0f8A2FdB8b03E6eA'),
};

export const ASSET_SYMBOL_TO_ASSET_ID: Record<AssetSymbol, AssetId> = {
  USDC: assetId('0x02223454885e5de4e0d5dcbc19dc654bb2c5820b12955d716ee314b5cf0281a9'),
  BTC: assetId('0x304c09238b060a56c8e40c52cd6f3caea22e9acb0c465e2f022f7aab468b3aae'),
  BNB: assetId('0xcddbcaaf6fefe02a2f11d40c65e1939313211a4b821b11f80bc8994dc2930212'),
  ETH: assetId('0xaedd7f783e841380a9ff6bd8936a35daeb2b58ce71cdf925182befd9abd4fb39'),
};

export const CONTRACT_ID_TO_ASSET_SYMBOL: Record<Address, AssetSymbol> = {
  [address('0x5CDc3143D0bC1fFD896D025F0c88fC10593aa768D20416a151F6734430e78ad9')]: 'USDC',
  [address('0xE4c8C10b31D9De5D4333C389A7101E580630D053AF47467A40fb1D1DAd6B399c')]: 'BTC',
  [address('0xa0A76C0D74cDAd92f1282B8dFbF35C39F7a5434611A076Bb08E239EA4bb2B6E0')]: 'BNB',
  [address('0x5B6712bF3A0E877E3A97A5B903B97c34FDefE8526E40fD4F0f8A2FdB8b03E6eA')]: 'ETH',
};

export const ASSET_ID_TO_ASSET_SYMBOL: Record<AssetId, AssetSymbol> = {
  [assetId('0x02223454885e5de4e0d5dcbc19dc654bb2c5820b12955d716ee314b5cf0281a9')]: 'USDC',
  [assetId('0x304c09238b060a56c8e40c52cd6f3caea22e9acb0c465e2f022f7aab468b3aae')]: 'BTC',
  [assetId('0xcddbcaaf6fefe02a2f11d40c65e1939313211a4b821b11f80bc8994dc2930212')]: 'BNB',
  [assetId('0xaedd7f783e841380a9ff6bd8936a35daeb2b58ce71cdf925182befd9abd4fb39')]: 'ETH',
};
