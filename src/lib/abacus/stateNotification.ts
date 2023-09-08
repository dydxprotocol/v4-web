import { kollections } from '@dydxprotocol/abacus';

import type {
  AbacusApiState,
  AbacusNotification,
  AbacusStateNotificationProtocol,
  Asset,
  Nullable,
  ParsingErrors,
  PerpetualMarket,
  PerpetualState,
  PerpetualStateChanges,
  SubaccountOrder,
} from '@/constants/abacus';

import { Changes } from '@/constants/abacus';

import type { RootStore } from '@/state/_store';

import {
  setFills,
  setFundingPayments,
  setHistoricalPnl,
  setSubaccount,
  setTransfers,
  setWallet,
} from '@/state/account';

import { setApiState } from '@/state/app';
import { setAssets } from '@/state/assets';
import { setConfigs } from '@/state/configs';
import { setInputs } from '@/state/inputs';
import { setHistoricalFundings, setLiveTrades, setMarkets, setOrderbook } from '@/state/perpetuals';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  private store: RootStore | undefined;

  constructor() {
    this.store = undefined;
  }

  environmentsChanged(): void {
    return;
  }

  notificationsChanged(notifications: kollections.List<AbacusNotification>): void {
    return;
  }

  stateChanged(
    updatedState: Nullable<PerpetualState>,
    incomingChanges: Nullable<PerpetualStateChanges>
  ): void {
    if (!this.store) return;
    const { dispatch } = this.store;
    const changes = new Set(incomingChanges?.changes.toArray() || []);
    const marketIds = incomingChanges?.markets?.toArray();
    const subaccountNumbers = incomingChanges?.subaccountNumbers?.toArray();

    if (updatedState) {
      if (changes.has(Changes.assets)) {
        dispatch(
          setAssets(
            Object.fromEntries(
              (updatedState?.assetIds()?.toArray() || []).map((assetId: string) => {
                const assetData = updatedState?.asset(assetId);
                return [assetId, assetData];
              })
            ) as Record<string, Asset>
          )
        );
      }

      if (changes.has(Changes.configs)) {
        dispatch(setConfigs(updatedState.configs));
      }

      if (changes.has(Changes.input)) {
        dispatch(setInputs(updatedState.input));
      }

      if (changes.has(Changes.wallet)) {
        dispatch(setWallet(updatedState.wallet));
      }

      if (changes.has(Changes.markets)) {
        dispatch(
          setMarkets({
            markets: Object.fromEntries(
              (marketIds || updatedState.marketIds()?.toArray() || []).map((marketId: string) => {
                const marketData = updatedState.market(marketId);
                return [marketId, marketData];
              })
            ) as Record<string, PerpetualMarket>,
            update: !!marketIds,
          })
        );
      }

      subaccountNumbers?.forEach((subaccountId: number) => {
        if (subaccountId !== null) {
          if (changes.has(Changes.subaccount)) {
            dispatch(setSubaccount(updatedState.subaccount(subaccountId)));
          }

          if (changes.has(Changes.fills)) {
            const fills = updatedState.subaccountFills(subaccountId)?.toArray() || [];
            dispatch(setFills(fills));
          }

          if (changes.has(Changes.fundingPayments)) {
            const fundingPayments =
              updatedState.subaccountFundingPayments(subaccountId)?.toArray() || [];
            dispatch(setFundingPayments(fundingPayments));
          }

          if (changes.has(Changes.transfers)) {
            const transfers = updatedState.subaccountTransfers(subaccountId)?.toArray() || [];
            dispatch(setTransfers(transfers));
          }

          if (changes.has(Changes.historicalPnl)) {
            const historicalPnl =
              updatedState.subaccountHistoricalPnl(subaccountId)?.toArray() || [];
            dispatch(setHistoricalPnl(historicalPnl));
          }
        }
      });

      marketIds?.forEach((market: string) => {
        if (changes.has(Changes.orderbook)) {
          const orderbook = updatedState.marketOrderbook(market);

          if (orderbook) {
            dispatch(setOrderbook({ orderbook, marketId: market }));
          }
        }

        if (changes.has(Changes.trades)) {
          const trades = updatedState.marketTrades(market)?.toArray() || [];
          dispatch(setLiveTrades({ trades, marketId: market }));
        }

        if (changes.has(Changes.historicalFundings)) {
          const historicalFundings = updatedState.historicalFunding(market)?.toArray() || [];

          dispatch(
            setHistoricalFundings({
              marketId: market,
              historicalFundings,
            })
          );
        }
      });
    }
  }

  lastOrderChanged(order: SubaccountOrder) {}

  errorsEmitted(errors: ParsingErrors) {
    console.error('parse errors', errors.toArray());
  }

  apiStateChanged(apiState: AbacusApiState) {
    this.store?.dispatch(setApiState(apiState));
  }

  setStore = (store: RootStore) => {
    this.store = store;
  };
}

export default AbacusStateNotifier;
