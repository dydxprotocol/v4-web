import { kollections } from '@dydxprotocol/v4-abacus';
import { fromPairs } from 'lodash';

import type {
  AbacusApiState,
  AbacusNotification,
  AbacusStateNotificationProtocol,
  AccountBalance,
  Asset,
  Nullable,
  ParsingErrors,
  PerpetualMarket,
  PerpetualState,
  PerpetualStateChanges,
  SubaccountOrder,
} from '@/constants/abacus';
import { Changes } from '@/constants/abacus';
import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';

import { type RootStore } from '@/state/_store';
import {
  setBalances,
  setChildSubaccount,
  setCompliance,
  setFills,
  setFundingPayments,
  setHistoricalPnl,
  setLatestOrder,
  setRestrictionType,
  setStakingBalances,
  setStakingDelegations,
  setSubaccount,
  setTradingRewards,
  setTransfers,
  setWallet,
} from '@/state/account';
import { setApiState } from '@/state/app';
import { setAssets } from '@/state/assets';
import { setConfigs } from '@/state/configs';
import { setInputs } from '@/state/inputs';
import { updateNotifications } from '@/state/notifications';
import { setHistoricalFundings, setLiveTrades, setMarkets, setOrderbook } from '@/state/perpetuals';

import { isTruthy } from '../isTruthy';
import { testFlags } from '../testFlags';

class AbacusStateNotifier implements AbacusStateNotificationProtocol {
  private store: RootStore | undefined;

  constructor() {
    this.store = undefined;
  }

  environmentsChanged(): void {}

  notificationsChanged(notifications: kollections.List<AbacusNotification>): void {
    this.store?.dispatch(updateNotifications(notifications.toArray()));
  }

  stateChanged(
    updatedState: Nullable<PerpetualState>,
    incomingChanges: Nullable<PerpetualStateChanges>
  ): void {
    if (!this.store) return;
    const { dispatch } = this.store;
    const changes = new Set(incomingChanges?.changes.toArray() ?? []);
    const marketIds = incomingChanges?.markets?.toArray();
    const subaccountNumbers = incomingChanges?.subaccountNumbers?.toArray();

    if (updatedState) {
      if (changes.has(Changes.assets)) {
        dispatch(
          setAssets(
            Object.fromEntries(
              (updatedState?.assetIds()?.toArray() ?? []).map((assetId: string) => {
                const assetData = updatedState?.asset(assetId);
                return [assetId, assetData];
              })
            ) as Record<string, Asset>
          )
        );
      }

      if (changes.has(Changes.accountBalances)) {
        if (updatedState.account?.balances) {
          const balances: Record<string, AccountBalance> = fromPairs(
            updatedState.account.balances.toArray().map(({ k, v }) => [k, v])
          );
          dispatch(setBalances(balances));
        }
        if (updatedState.account?.stakingBalances) {
          const stakingBalances: Record<string, AccountBalance> = fromPairs(
            updatedState.account.stakingBalances.toArray().map(({ k, v }) => [k, v])
          );
          dispatch(setStakingBalances(stakingBalances));
        }
        if (updatedState.account?.stakingDelegations) {
          dispatch(setStakingDelegations(updatedState.account.stakingDelegations.toArray()));
        }
      }

      if (changes.has(Changes.tradingRewards)) {
        if (updatedState.account?.tradingRewards) {
          dispatch(setTradingRewards(updatedState.account?.tradingRewards));
        }
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
              (marketIds ?? updatedState.marketIds()?.toArray() ?? [])
                .map((marketId: string) => {
                  const marketData = updatedState.market(marketId);
                  return [marketId, marketData];
                })
                .filter(isTruthy)
            ) as Record<string, PerpetualMarket>,
            update: !!marketIds,
          })
        );
      }

      if (changes.has(Changes.restriction)) {
        dispatch(setRestrictionType(updatedState.restriction));
      }

      if (
        changes.has(Changes.compliance) &&
        updatedState.compliance &&
        testFlags.enableComplianceApi
      ) {
        dispatch(setCompliance(updatedState.compliance));
      }

      subaccountNumbers?.forEach((subaccountId: number) => {
        const isChildSubaccount = subaccountId >= NUM_PARENT_SUBACCOUNTS;
        const childSubaccountUpdate: Parameters<typeof setChildSubaccount>['0']['data'] = {};

        if (changes.has(Changes.subaccount)) {
          const subaccountData = updatedState.subaccount(subaccountId);

          if (isChildSubaccount) {
            childSubaccountUpdate[subaccountId] = subaccountData;
          } else {
            dispatch(setSubaccount(subaccountData));
          }
        }

        if (changes.has(Changes.fills)) {
          const fills = updatedState.subaccountFills(subaccountId)?.toArray() ?? [];
          if (isChildSubaccount) {
            childSubaccountUpdate[subaccountId] = { ...childSubaccountUpdate[subaccountId], fills };
          } else {
            dispatch(setFills(fills));
          }
        }

        if (changes.has(Changes.fundingPayments)) {
          const fundingPayments =
            updatedState.subaccountFundingPayments(subaccountId)?.toArray() ?? [];

          if (isChildSubaccount) {
            childSubaccountUpdate[subaccountId] = {
              ...childSubaccountUpdate[subaccountId],
              fundingPayments,
            };
          } else {
            dispatch(setFundingPayments(fundingPayments));
          }
        }

        if (changes.has(Changes.transfers)) {
          const transfers = updatedState.subaccountTransfers(subaccountId)?.toArray() ?? [];

          if (isChildSubaccount) {
            childSubaccountUpdate[subaccountId] = {
              ...childSubaccountUpdate[subaccountId],
              transfers,
            };
          } else {
            dispatch(setTransfers(transfers));
          }
        }

        if (changes.has(Changes.historicalPnl)) {
          const historicalPnl = updatedState.subaccountHistoricalPnl(subaccountId)?.toArray() ?? [];

          if (isChildSubaccount) {
            childSubaccountUpdate[subaccountId] = {
              ...childSubaccountUpdate[subaccountId],
              historicalPnl,
            };
          } else {
            dispatch(setHistoricalPnl(historicalPnl));
          }
        }

        if (isChildSubaccount) {
          dispatch(
            setChildSubaccount({ data: childSubaccountUpdate, subaccountNumber: subaccountId })
          );
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
          const trades = updatedState.marketTrades(market)?.toArray() ?? [];
          dispatch(setLiveTrades({ trades, marketId: market }));
        }

        if (changes.has(Changes.historicalFundings)) {
          const historicalFundings = updatedState.historicalFunding(market)?.toArray() ?? [];

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

  lastOrderChanged(order: SubaccountOrder) {
    this.store?.dispatch(setLatestOrder(order));
  }

  errorsEmitted(errors: ParsingErrors) {
    // eslint-disable-next-line no-console
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
