import { useEffect, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { OrderStatus, SubaccountFillType } from '@/bonsai/types/summaryTypes';
import { useQuery } from '@tanstack/react-query';
import { groupBy, isNumber, max, pick } from 'lodash';
import { shallowEqual } from 'react-redux';
import tw from 'twin.macro';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import {
  CosmosWalletNotificationTypes,
  DEFAULT_TOAST_AUTO_CLOSE_MS,
  FeedbackRequestNotificationIds,
  NotificationStatus,
  NotificationType,
  type NotificationTypeConfig,
} from '@/constants/notifications';
import { USD_DECIMALS } from '@/constants/numbers';
import { EMPTY_ARR } from '@/constants/objects';
import { StatsigDynamicConfigs } from '@/constants/statsig';
import { timeUnits } from '@/constants/time';
import { PlaceOrderStatuses } from '@/constants/trade';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import {
  CURRENT_REWARDS_SEASON,
  CURRENT_REWARDS_SEASON_AMOUNT,
  CURRENT_REWARDS_SEASON_EXPIRATION,
} from '@/hooks/surgeRewards';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { formatNumberOutput, Output, OutputType } from '@/components/Output';
import { FillWithNoOrderNotificationRow } from '@/views/Lists/Alerts/FillWithNoOrderNotificationRow';
import { OrderCancelNotificationRow } from '@/views/Lists/Alerts/OrderCancelNotificationRow';
import { OrderNotificationRow } from '@/views/Lists/Alerts/OrderNotificationRow';
import { OrderStatusNotificationRow } from '@/views/Lists/Alerts/OrderStatusNotificationRow';
import { SkipTransferNotificationRow } from '@/views/Lists/Alerts/SkipTransferNotificationRow';
// eslint-disable-next-line import/no-cycle
import { CancelAllNotification } from '@/views/notifications/CancelAllNotification';
import { CloseAllPositionsNotification } from '@/views/notifications/CloseAllPositionsNotification';
import { OrderCancelNotification } from '@/views/notifications/OrderCancelNotification';
import { OrderStatusNotification } from '@/views/notifications/OrderStatusNotification';
import { TradeNotification } from '@/views/notifications/TradeNotification';

import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import {
  selectOrphanedTriggerOrders,
  selectReclaimableChildSubaccountFunds,
  selectShouldAccountRebalanceUsdc,
} from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import {
  getLocalCancelAlls,
  getLocalCancelOrders,
  getLocalCloseAllPositions,
  getLocalPlaceOrders,
} from '@/state/localOrdersSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCustomNotifications } from '@/state/notificationsSelectors';
import { selectTransfersByAddress } from '@/state/transfersSelectors';
import { selectIsKeplrConnected } from '@/state/walletSelectors';

import { assertNever } from '@/lib/assertNever';
import { calc, mapIfPresent } from '@/lib/do';
// eslint-disable-next-line import/no-cycle
import {
  getIndexerOrderSideStringKey,
  getIndexerOrderTypeStringKey,
} from '@/lib/enumToStringKeyHelpers';
import { BIG_NUMBERS } from '@/lib/numbers';
import { getAverageFillPrice } from '@/lib/orders';
import { sleep } from '@/lib/timeUtils';
import { isPresent, orEmptyRecord } from '@/lib/typeUtils';

import { useAccounts } from './useAccounts';
import { useAffiliateMetadata } from './useAffiliatesInfo';
import { useApiState } from './useApiState';
import { useLocaleSeparators } from './useLocaleSeparators';
import { useAppSelectorWithArgs } from './useParameterizedSelector';
import { useAllStatsigDynamicConfigValues } from './useStatsig';
import { useStringGetter } from './useStringGetter';
import { useURLConfigs } from './useURLConfigs';

export const notificationTypes: NotificationTypeConfig[] = [
  {
    type: NotificationType.Order,
    useTrigger: ({ trigger, appInitializedTime }) => {
      const fills = useAppSelector(BonsaiCore.account.fills.data);
      const orders = useAppSelector(BonsaiCore.account.allOrders.data);
      const localPlaceOrders = useAppSelector(getLocalPlaceOrders, shallowEqual);
      const localCancelOrders = useAppSelector(getLocalCancelOrders, shallowEqual);
      const allMarkets = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));

      const stringGetter = useStringGetter();
      useEffect(() => {
        const fillsByOrderId = groupBy(
          fills.filter((f) => f.orderId != null),
          (f) => f.orderId
        );
        orders.forEach((order) => {
          const relevantFills = fillsByOrderId[order.id] ?? EMPTY_ARR;
          const relevantPlaceOrder =
            order.clientId != null ? localPlaceOrders[order.clientId] : undefined;
          const relevantLocalCancels = Object.values(localCancelOrders).filter(
            (c) => c.orderId === order.id
          );

          const marketInfo = allMarkets[order.marketId];
          const orderTypeKey = getIndexerOrderTypeStringKey(order.type);
          const latestUpdateMs = max([
            ...relevantFills.map((f) =>
              f.createdAt == null ? 0 : new Date(f.createdAt).getTime()
            ),
            order.updatedAtMilliseconds,
          ]);
          if (latestUpdateMs == null || latestUpdateMs <= appInitializedTime) {
            return;
          }

          const [titleKey, textKey] = calc((): [string, string | undefined] => {
            const status = order.status;
            if (status == null) {
              return [STRING_KEYS.ORDER_STATUS, undefined];
            }
            switch (status) {
              case OrderStatus.Open:
              case OrderStatus.Pending:
              case OrderStatus.Untriggered:
              case OrderStatus.Canceling:
                if (
                  [
                    IndexerOrderType.STOPLIMIT,
                    IndexerOrderType.STOPMARKET,
                    IndexerOrderType.TAKEPROFIT,
                    IndexerOrderType.TAKEPROFITMARKET,
                  ].indexOf(order.type) >= 0
                ) {
                  return [STRING_KEYS.ORDER_TRIGGERED_TITLE, STRING_KEYS.ORDER_TRIGGERED_BODY];
                }
                return [STRING_KEYS.ORDER_STATUS, undefined];
              case OrderStatus.Canceled:
                return [STRING_KEYS.ORDER_CANCEL_TITLE, STRING_KEYS.ORDER_CANCEL_BODY];
              case OrderStatus.PartiallyCanceled:
                return [
                  STRING_KEYS.ORDER_CANCEL_WITH_PARTIAL_FILL_TITLE,
                  STRING_KEYS.ORDER_CANCEL_WITH_PARTIAL_FILL_BODY,
                ];
              case OrderStatus.PartiallyFilled:
                return [STRING_KEYS.ORDER_PARTIAL_FILL_TITLE, STRING_KEYS.ORDER_PARTIAL_FILL_BODY];
              case OrderStatus.Filled:
                return [STRING_KEYS.ORDER_FILL_TITLE, STRING_KEYS.ORDER_FILL_BODY];
              default:
                assertNever(status);
                return [STRING_KEYS.ORDER_STATUS, undefined];
            }
          });

          trigger({
            id: `order:${order.id}`,
            displayData: {
              icon: marketInfo != null ? <$Icon src={marketInfo.logo ?? undefined} /> : undefined,
              title: stringGetter({ key: titleKey }),
              updatedTime: latestUpdateMs,
              body:
                textKey != null
                  ? stringGetter({
                      key: textKey,
                      params: {
                        SIDE: getIndexerOrderSideStringKey(order.side),
                        AMOUNT: order.size.toString(10),
                        MARKET: marketInfo?.displayableAsset ?? '',
                        FILLED_AMOUNT: order.totalFilled?.toString(10) ?? '0',
                        TOTAL_FILLED: order.totalFilled?.toString(10) ?? '0',
                        AVERAGE_PRICE: getAverageFillPrice(relevantFills)?.toString(10) ?? '',
                      },
                    })
                  : undefined,
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              toastSensitivity: 'foreground',
              groupKey: `orders`,
              searchableContent: `${marketInfo?.displayableAsset}|${marketInfo?.displayableTicker}|${stringGetter({ key: orderTypeKey })}`,
              renderCustomBody: ({ isToast, notification }) => (
                <TradeNotification
                  isToast={isToast}
                  notification={notification}
                  fills={relevantFills}
                  order={order}
                />
              ),
              renderSimpleAlert: ({ className, notification }) => (
                <OrderNotificationRow
                  className={className}
                  timestamp={
                    notification.timestamps[NotificationStatus.Updated] ??
                    notification.timestamps[NotificationStatus.Triggered]!
                  }
                  isUnseen={notification.status <= NotificationStatus.Unseen}
                  subaccountOrder={order}
                  relevantFills={relevantFills}
                />
              ),
            },
            updateKey: [latestUpdateMs, order.status, order.totalFilled?.toNumber()],
            isNew: !(relevantPlaceOrder != null || relevantLocalCancels.length > 0),
            keepCleared: true,
          });
        });
      }, [
        trigger,
        appInitializedTime,
        stringGetter,
        fills,
        orders,
        localPlaceOrders,
        localCancelOrders,
        allMarkets,
      ]);
    },
  },
  {
    type: NotificationType.FillWithNoOrder,
    useTrigger: ({ trigger, appInitializedTime }) => {
      const fills = useAppSelector(BonsaiCore.account.fills.data);
      const allMarkets = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));
      const stringGetter = useStringGetter();

      useEffect(() => {
        fills
          .filter((f) => f.orderId == null)
          .forEach((fill) => {
            const createdAt = mapIfPresent(fill.createdAt, (c) => new Date(c).getTime());
            if (createdAt == null || createdAt <= appInitializedTime) {
              return;
            }
            const type = fill.type;
            if (
              type == null ||
              type === SubaccountFillType.LIMIT ||
              type === SubaccountFillType.MARKET
            ) {
              return;
            }
            const titleKey = calc(() => {
              if (type === SubaccountFillType.DELEVERAGED) {
                return STRING_KEYS.DELEVERAGED_TITLE;
              }
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (type === SubaccountFillType.LIQUIDATED) {
                return STRING_KEYS.LIQUIDATION_TITLE;
              }
              assertNever(type);
              return STRING_KEYS.LIQUIDATION_TITLE;
            });
            const bodyKey = calc(() => {
              if (type === SubaccountFillType.DELEVERAGED) {
                return STRING_KEYS.DELEVERAGED_BODY;
              }
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (type === SubaccountFillType.LIQUIDATED) {
                return STRING_KEYS.LIQUIDATION_BODY;
              }
              assertNever(type);
              return STRING_KEYS.DELEVERAGED_BODY;
            });
            const marketInfo = fill.market != null ? allMarkets[fill.market] : undefined;
            // opposite because these notifications are all about positions, not the fill that triggered the notif.
            const side =
              fill.side === IndexerOrderSide.BUY ? IndexerOrderSide.SELL : IndexerOrderSide.BUY;
            trigger({
              id: `fill:${fill.id ?? ''}`,
              displayData: {
                icon: <$Icon src={marketInfo?.logo ?? undefined} alt="" />,
                title: stringGetter({ key: titleKey }),
                updatedTime: createdAt,
                body: stringGetter({
                  key: bodyKey,
                  params: {
                    SIDE:
                      side === IndexerOrderSide.BUY
                        ? stringGetter({ key: STRING_KEYS.BUY })
                        : stringGetter({ key: STRING_KEYS.SELL }),
                    MARKET: marketInfo?.displayableAsset ?? fill.market ?? '',
                  },
                }),
                toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                toastSensitivity: 'foreground',
                groupKey: 'fill',
                renderSimpleAlert: ({ className, notification }) => (
                  <FillWithNoOrderNotificationRow
                    className={className}
                    fill={fill}
                    timestamp={
                      notification.timestamps[NotificationStatus.Updated] ??
                      notification.timestamps[NotificationStatus.Triggered]!
                    }
                    isUnseen={notification.status <= NotificationStatus.Unseen}
                  />
                ),
              },
              updateKey: [fill.id],
            });
          });
      }, [trigger, appInitializedTime, stringGetter, fills, allMarkets]);
    },
  },

  {
    type: NotificationType.SkipTransfer2,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { dydxAddress } = useAccounts();
      const userTransfers = useAppSelectorWithArgs(selectTransfersByAddress, dydxAddress);
      const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();
      const selectedLocale = useAppSelector(getSelectedLocale);

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const transfer of userTransfers) {
          const { type, status } = transfer;
          const id = transfer.id;

          const finalAmount = formatNumberOutput(
            transfer.finalAmountUsd ?? transfer.estimatedAmountUsd,
            OutputType.Fiat,
            { decimalSeparator, groupSeparator, selectedLocale }
          );

          const isSuccess = status === 'success';
          let body: string = '';
          let title: string = '';

          if (type === 'withdraw') {
            title = stringGetter({
              key: isSuccess ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS,
            });

            body = isSuccess
              ? stringGetter({
                  key: STRING_KEYS.WITHDRAW_COMPLETE,
                  params: { AMOUNT_USD: finalAmount },
                })
              : stringGetter({ key: STRING_KEYS.PENDING, params: { AMOUNT_USD: finalAmount } });
          } else {
            // Deposit
            title = stringGetter({
              key: isSuccess ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS,
            });

            body = isSuccess
              ? stringGetter({
                  key: STRING_KEYS.DEPOSIT_AVAILABLE,
                  params: { AMOUNT_USD: finalAmount },
                })
              : stringGetter({
                  key: STRING_KEYS.DEPOSIT_PENDING,
                  params: { AMOUNT_USD: finalAmount },
                });
          }

          trigger({
            id,
            displayData: {
              title,
              icon: <Icon iconName={isSuccess ? IconName.Transfer : IconName.Clock} />,
              body,
              toastSensitivity: 'foreground',
              groupKey: NotificationType.SkipTransfer,
              renderSimpleAlert: ({ className, notification }) => (
                <SkipTransferNotificationRow
                  className={className}
                  transfer={transfer}
                  isUnseen={notification.status <= NotificationStatus.Unseen}
                />
              ),
            },
            updateKey: [isSuccess],
          });
        }
      }, [decimalSeparator, groupSeparator, selectedLocale, stringGetter, trigger, userTransfers]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();

      return (transferId: string) => {
        dispatch(openDialog(DialogTypes.TransferStatus({ transferId })));
      };
    },
  },

  {
    type: NotificationType.ReleaseUpdates,
    useTrigger: ({ trigger: _trigger }) => {},
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.MarketUpdate,
    useTrigger: ({ trigger: _trigger }) => {},
    useNotificationAction: () => {
      return (_id) => {};
    },
  },
  {
    type: NotificationType.MarketWindDown,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { contractLossMechanismLearnMore } = useURLConfigs();

      const currentMarket = useAppSelector(BonsaiCore.markets.currentMarketId);
      const positions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
      const openOrders = useAppSelector(BonsaiCore.account.openOrders.data);
      const windDownNotifDuration = timeUnits.week * 2;

      const marketsRelevantToAccount = useMemo(
        () =>
          new Set(
            [
              currentMarket,
              ...(positions?.map((p) => p.market) ?? []),
              ...openOrders.map((o) => o.marketId),
            ].filter(isPresent)
          ),
        [currentMarket, openOrders, positions]
      );

      const windDownObjects = useMemo(
        (): Array<{
          market: string;
          windDownProposalLink?: string;
          // date when proposal passes and final settlement happens
          windDownDate: string;
        }> => [
          {
            market: 'SKITTEN-USD',
            windDownProposalLink: 'https://www.mintscan.io/dydx/proposals/247',
            windDownDate: '2025-05-23T07:25:00.000Z',
          },
          {
            market: 'EOS-USD',
            windDownProposalLink: 'https://www.mintscan.io/dydx/proposals/247',
            windDownDate: '2025-05-23T07:25:00.000Z',
          },
          {
            market: 'BTRUMP-USD',
            windDownProposalLink: 'https://www.mintscan.io/dydx/proposals/247',
            windDownDate: '2025-05-23T07:25:00.000Z',
          },
        ],
        []
      );

      useEffect(() => {
        windDownObjects.forEach((obj) => {
          const { market, windDownProposalLink, windDownDate } = obj;

          const notificationProposalId = `market-wind-down-proposal-${market}`;
          if (marketsRelevantToAccount.has(market) && new Date() <= new Date(windDownDate)) {
            const outputDate = (
              <Output tw="inline-block" type={OutputType.DateTime} value={windDownDate} />
            );

            trigger({
              id: notificationProposalId,
              displayData: {
                title: stringGetter({
                  key: 'NOTIFICATIONS.MARKET_WIND_DOWN_PROPOSAL.TITLE',
                  params: {
                    MARKET: market,
                  },
                }),
                body: stringGetter({
                  key: 'NOTIFICATIONS.MARKET_WIND_DOWN_PROPOSAL.BODY',
                  params: {
                    MARKET: market,
                    DATE: outputDate,
                    HERE_LINK:
                      windDownProposalLink != null && windDownProposalLink !== '' ? (
                        <Link isInline isAccent href={windDownProposalLink}>
                          {stringGetter({ key: STRING_KEYS.HERE })}
                        </Link>
                      ) : (
                        <span />
                      ),
                  },
                }),
                toastSensitivity: 'foreground',
                groupKey: notificationProposalId,
              },
              updateKey: [],
              shouldUnhide: market === currentMarket,
            });
          }
        });
      }, [currentMarket, marketsRelevantToAccount, stringGetter, trigger, windDownObjects]);

      useEffect(() => {
        windDownObjects.forEach((obj) => {
          const { market, windDownDate } = obj;

          const notificationWindDownId = `market-wind-down-${market}`;
          const learnMoreLink = contractLossMechanismLearnMore;
          const windDownExpirationDate = new Date(
            new Date(windDownDate).getTime() + windDownNotifDuration
          );
          if (
            marketsRelevantToAccount.has(market) &&
            learnMoreLink &&
            new Date() >= new Date(windDownDate) &&
            new Date() <= new Date(windDownExpirationDate)
          ) {
            const outputDate = (
              <Output tw="inline-block" type={OutputType.DateTime} value={windDownDate} />
            );

            trigger({
              id: notificationWindDownId,
              displayData: {
                title: stringGetter({
                  key: 'NOTIFICATIONS.MARKET_WIND_DOWN.TITLE',
                  params: {
                    MARKET: market,
                  },
                }),
                body: stringGetter({
                  key: 'NOTIFICATIONS.MARKET_WIND_DOWN.BODY',
                  params: {
                    MARKET: market,
                    DATE: outputDate,
                    HERE_LINK: (
                      <Link isInline isAccent href={learnMoreLink}>
                        {stringGetter({ key: STRING_KEYS.HERE })}
                      </Link>
                    ),
                  },
                }),
                groupKey: notificationWindDownId,
                toastSensitivity: 'foreground',
              },
              updateKey: [],
              shouldUnhide: market === currentMarket,
            });
          }
        });
      }, [
        contractLossMechanismLearnMore,
        currentMarket,
        marketsRelevantToAccount,
        stringGetter,
        trigger,
        windDownNotifDuration,
        windDownObjects,
      ]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.RewardsProgramUpdates,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const dydxAddress = useAppSelector(getUserWalletAddress);
      const currentSeason = CURRENT_REWARDS_SEASON;

      const { data: rewards } = useQuery({
        queryKey: ['dydx-surge-rewards', currentSeason, dydxAddress],
        enabled:
          dydxAddress != null &&
          new Date().getTime() < new Date(CURRENT_REWARDS_SEASON_EXPIRATION).getTime(),
        retry: false,
        queryFn: async () => {
          try {
            // don't take up bandwidth during sensitive loading time
            await sleep(1500);
            const data = await fetch(
              `https://cloud.chaoslabs.co/query/api/dydx/reward-distribution?season=${currentSeason - 1}`
            );
            const result = await data.json();
            const maybeNumber = result.find((f: any) => f.address === dydxAddress).rewards;
            if (isNumber(maybeNumber)) {
              return maybeNumber;
            }
            return null;
          } catch (e) {
            return null;
          }
        },
      });

      useEffect(() => {
        const now = new Date().getTime();
        const seasonEnd = new Date(CURRENT_REWARDS_SEASON_EXPIRATION).getTime();
        if (now < seasonEnd && rewards != null && rewards > 5) {
          trigger({
            id: `rewards-program-surge-s${currentSeason - 1}-payout`,
            displayData: {
              icon: <Icon iconName={IconName.Sparkles} />,
              title: stringGetter({
                key: STRING_KEYS.SURGE_PAYOUT_TITLE,
                params: { SEASON_NUMBER: currentSeason - 1, DYDX_REWARDS: rewards },
              }),
              body: stringGetter({
                key: STRING_KEYS.SURGE_PAYOUT_BODY,
                params: {
                  SEASON_NUMBER: currentSeason - 1,
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.RewardsProgramUpdates,
              actionAltText: stringGetter({ key: STRING_KEYS.LEARN_MORE }),
              renderActionSlot: () => (
                <Link href="https://www.dydx.xyz/surge" isAccent>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                </Link>
              ),
            },
            updateKey: [`rewards-program-surge-s${currentSeason - 1}-payout`],
          });
        }
      }, [currentSeason, rewards, stringGetter, trigger]);

      useEffect(() => {
        const now = new Date().getTime();
        const seasonEnd = new Date(CURRENT_REWARDS_SEASON_EXPIRATION).getTime();
        const endingSoon = seasonEnd - timeUnits.day * 3;

        if (now <= endingSoon) {
          trigger({
            id: `rewards-program-surge-s${currentSeason}-start`,
            displayData: {
              icon: <Icon iconName={IconName.Trophy} />,
              title: stringGetter({
                key: STRING_KEYS.SURGE_BASIC_SEASON_TITLE,
                params: {
                  SEASON_NUMBER: currentSeason,
                  AMOUNT_MILLIONS: CURRENT_REWARDS_SEASON_AMOUNT,
                },
              }),
              body: stringGetter({
                key: STRING_KEYS.SURGE_BASIC_SEASON_BODY,
                params: {
                  SEASON_NUMBER: currentSeason,
                  AMOUNT_MILLIONS: CURRENT_REWARDS_SEASON_AMOUNT,
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.RewardsProgramUpdates,
              actionAltText: stringGetter({ key: STRING_KEYS.LEARN_MORE }),
              renderActionSlot: () => (
                <Link href="https://www.dydx.xyz/surge" isAccent>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                </Link>
              ),
            },
            updateKey: [`rewards-program-surge-s${currentSeason}-start`],
          });
        } else if (now < seasonEnd) {
          let daysLeft = Math.floor((seasonEnd - now) / timeUnits.day);
          // oops, we don't want to show 1 days left or 0 days left
          if (daysLeft < 2) {
            daysLeft = 2;
          }
          trigger({
            id: `rewards-program-surge-s${currentSeason}-ending`,
            displayData: {
              icon: <Icon iconName={IconName.Clock} />,
              title: stringGetter({
                key: STRING_KEYS.SURGE_SEASON_ENDING_TITLE,
                params: { SEASON_NUMBER: currentSeason, DAYS_LEFT: daysLeft },
              }),
              body: stringGetter({
                key: STRING_KEYS.SURGE_SEASON_ENDING_BODY,
                params: {
                  SEASON_NUMBER: currentSeason,
                  DAYS_LEFT: daysLeft,
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.RewardsProgramUpdates,
              actionAltText: stringGetter({ key: STRING_KEYS.LEARN_MORE }),
              renderActionSlot: () => (
                <Link href="https://www.dydx.xyz/surge" isAccent>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                </Link>
              ),
            },
            updateKey: [`rewards-program-surge-s${currentSeason}-ending`],
          });
        }
      }, [currentSeason, stringGetter, trigger]);

      const PUMP_COMPETITION_EXPIRATION = '2025-07-29T00:00:00.000Z';
      useEffect(() => {
        if (new Date().getTime() < new Date(PUMP_COMPETITION_EXPIRATION).getTime())
          trigger({
            id: `pump-trading-competition-base`,
            displayData: {
              icon: <Icon iconName={IconName.Sparkles} />,
              title: stringGetter({
                key: STRING_KEYS.PUMP_COMPETITION_TITLE,
              }),
              body: stringGetter({
                key: STRING_KEYS.PUMP_COMPETITION_BODY,
              }),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.RewardsProgramUpdates,
              actionAltText: stringGetter({ key: STRING_KEYS.LEARN_MORE }),
              renderActionSlot: () => (
                <Link href="https://www.dydx.xyz/blog/pump-trading-competition" isAccent>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
                </Link>
              ),
            },
            updateKey: [`pump-trading-competition-base`],
          });
      }, [stringGetter, trigger]);
    },
  },
  {
    type: NotificationType.ApiError,
    useTrigger: ({ trigger, hideNotification }) => {
      const stringGetter = useStringGetter();
      const { statusErrorMessage } = useApiState();
      const { statusPage } = useURLConfigs();
      const hasErrorMesage = !!statusErrorMessage;

      useEffect(() => {
        if (hasErrorMesage) {
          trigger({
            id: NotificationType.ApiError,
            displayData: {
              icon: <$WarningIcon iconName={IconName.Warning} />,
              title: statusErrorMessage.title,
              body: statusErrorMessage.body,
              toastSensitivity: 'foreground',
              groupKey: NotificationType.ApiError,
              withClose: false,
              actionAltText: stringGetter({ key: STRING_KEYS.STATUS_PAGE }),
              renderActionSlot: () => (
                <Link href={statusPage}>{stringGetter({ key: STRING_KEYS.STATUS_PAGE })} →</Link>
              ),
            },
            updateKey: [],
            shouldUnhide: true, // unhide on new error (i.e. normal -> not normal api status)
          });
        } else {
          // hide/expire existing notification if no error
          hideNotification({
            type: NotificationType.ApiError,
            id: NotificationType.ApiError,
          });
        }
      }, [
        stringGetter,
        statusErrorMessage?.body,
        statusErrorMessage?.title,
        hasErrorMesage,
        hideNotification,
        trigger,
        statusPage,
      ]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.AffiliatesAlert,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { data } = useAffiliateMetadata();
      const isAffiliate = !!data?.metadata?.isAffiliate;

      useEffect(() => {
        if (isAffiliate) {
          trigger({
            id: NotificationType.AffiliatesAlert,
            displayData: {
              title: stringGetter({ key: STRING_KEYS.AFFILIATE_BOOSTER_TITLE }),
              body: stringGetter({
                key: STRING_KEYS.AFFILIATE_BOOSTER_BODY,
                params: {
                  HERE_LINK: (
                    <Link
                      isInline
                      isAccent
                      href="https://www.dydx.xyz/blog/introducing-the-dydx-affiliate-booster-program"
                    >
                      {stringGetter({ key: STRING_KEYS.HERE })}
                    </Link>
                  ),
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.AffiliatesAlert,
            },
            updateKey: ['boosted-affiliates-june-2025'],
          });
        }
      }, [isAffiliate, stringGetter, trigger]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.OrderStatus,
    useTrigger: ({ trigger }) => {
      const localPlaceOrders = useAppSelector(getLocalPlaceOrders, shallowEqual);
      const localCancelOrders = useAppSelector(getLocalCancelOrders, shallowEqual);
      const localCancelAlls = useAppSelector(getLocalCancelAlls, shallowEqual);
      const localCloseAllPositions = useAppSelector(getLocalCloseAllPositions, shallowEqual);

      const allOrders = useAppSelector(BonsaiCore.account.allOrders.data);
      const stringGetter = useStringGetter();

      useEffect(() => {
        Object.values(localPlaceOrders).forEach((localPlace) => {
          const key = localPlace.clientId;
          // hide if it's a closeAll
          if (localPlace.submittedThroughCloseAll && localPlace.errorParams == null) {
            return;
          }
          // hide if it was cancelled locally
          if (
            localPlace.submissionStatus === PlaceOrderStatuses.Canceled &&
            localPlace.orderId != null &&
            Object.values(localCancelOrders).find((c) => c.orderId === localPlace.orderId) != null
          ) {
            return;
          }
          trigger({
            id: key,
            displayData: {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.ORDER_STATUS }),
              toastSensitivity: 'background',
              groupKey: key, // do not collapse
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              searchableContent: `${localPlace.cachedData.marketId}|${localPlace.cachedData.orderType}`,
              renderCustomBody: ({ isToast, notification }) => (
                <OrderStatusNotification
                  isToast={isToast}
                  localOrder={localPlace}
                  notification={notification}
                />
              ),
              renderSimpleAlert: ({ className, notification }) => (
                <OrderStatusNotificationRow
                  className={className}
                  timestamp={
                    notification.timestamps[NotificationStatus.Updated] ??
                    notification.timestamps[NotificationStatus.Triggered]!
                  }
                  localPlaceOrder={localPlace}
                  isUnseen={notification.status <= NotificationStatus.Unseen}
                />
              ),
            },
            updateKey: [localPlace.submissionStatus, localPlace.errorParams],
          });
        });
      }, [localCancelOrders, localPlaceOrders, stringGetter, trigger]);

      useEffect(() => {
        Object.values(localCancelOrders).forEach((localCancel) => {
          // skip if this is from a cancel all operation and isn't an error
          if (localCancel.isSubmittedThroughCancelAll && localCancel.errorParams == null) {
            return;
          }
          const existingOrder = allOrders.find((order) => order.id === localCancel.orderId);

          const key = localCancel.operationUuid;
          trigger({
            id: key,
            displayData: {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.ORDER_STATUS }),
              toastSensitivity: 'background',
              groupKey: key,
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              searchableContent: `${existingOrder?.displayId}|${existingOrder?.marketId}|${localCancel.cachedData.marketId}|${localCancel.cachedData.orderType}`,
              renderCustomBody: ({ isToast, notification }) => (
                <OrderCancelNotification
                  isToast={isToast}
                  localCancel={localCancel}
                  notification={notification}
                />
              ),
              renderSimpleAlert: ({ className, notification }) => (
                <OrderCancelNotificationRow
                  className={className}
                  timestamp={
                    notification.timestamps[NotificationStatus.Updated] ??
                    notification.timestamps[NotificationStatus.Triggered]!
                  }
                  localCancel={localCancel}
                  isUnseen={notification.status <= NotificationStatus.Unseen}
                />
              ),
            },
            updateKey: [localCancel.submissionStatus, localCancel.errorParams],
          });
        });
      }, [allOrders, localCancelOrders, stringGetter, trigger]);

      useEffect(() => {
        Object.values(localCancelAlls).forEach((cancelAll) => {
          trigger({
            id: cancelAll.operationUuid,
            displayData: {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.CANCEL_ALL_ORDERS }),
              toastSensitivity: 'background',
              groupKey: cancelAll.operationUuid,
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              renderCustomBody: ({ isToast, notification }) => (
                <CancelAllNotification
                  isToast={isToast}
                  localCancelAll={cancelAll}
                  notification={notification}
                />
              ),
            },
            updateKey: [cancelAll, pick(localCancelOrders, cancelAll.cancelOrderOperationUuids)],
          });
        });
      }, [localCancelAlls, localCancelOrders, stringGetter, trigger]);

      useEffect(() => {
        Object.values(localCloseAllPositions).forEach((localCloseAll) => {
          const localCloseAllKey = localCloseAll.operationUuid;
          const clientIds = localCloseAll.clientIds;
          trigger({
            id: localCloseAllKey,
            displayData: {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.CLOSE_ALL_POSITIONS }),
              toastSensitivity: 'background',
              groupKey: localCloseAllKey,
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              renderCustomBody: ({ isToast, notification }) => (
                <CloseAllPositionsNotification
                  isToast={isToast}
                  localCloseAllPositions={localCloseAll}
                  notification={notification}
                />
              ),
            },
            updateKey: [localCloseAll, pick(localPlaceOrders, clientIds)],
          });
        });
      }, [localCloseAllPositions, localPlaceOrders, stringGetter, trigger]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();
      const orders = useAppSelector(BonsaiCore.account.allOrders.data);

      return (orderClientId: string) => {
        const order = orders.find((o) => o.clientId?.toString() === orderClientId);
        if (order) {
          dispatch(openDialog(DialogTypes.OrderDetails({ orderId: order.id })));
        }
      };
    },
  },
  {
    type: NotificationType.FeedbackRequest,
    useTrigger: ({ trigger }) => {
      const { dydxAddress } = useAccounts();
      const { getInTouch } = useURLConfigs();
      const stringGetter = useStringGetter();

      const dynamicConfigs = useAllStatsigDynamicConfigValues();
      const feedbackRequestWalletAddresses =
        dynamicConfigs[StatsigDynamicConfigs.dcHighestVolumeUsers];

      useEffect(() => {
        if (dydxAddress && feedbackRequestWalletAddresses?.includes(dydxAddress) && getInTouch) {
          trigger({
            id: FeedbackRequestNotificationIds.Top100UserSupport,
            displayData: {
              icon: <Icon iconName={IconName.SpeechBubble} />,
              title: stringGetter({ key: STRING_KEYS.TOP_100_WALLET_ADDRESSES_TITLE }),
              body: stringGetter({ key: STRING_KEYS.TOP_100_WALLET_ADDRESSES_BODY }),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.FeedbackRequest,
              toastDuration: Infinity,
              withClose: false,
              // our generate script only knows to generate string keys for title and body
              actionAltText: stringGetter({ key: 'NOTIFICATIONS.TOP_100_WALLET_ADDRESSES.ACTION' }),
              renderActionSlot: () => (
                <Link href={getInTouch} isAccent>
                  {stringGetter({ key: 'NOTIFICATIONS.TOP_100_WALLET_ADDRESSES.ACTION' })}
                </Link>
              ),
            },
            updateKey: ['feedback'],
          });
        }
      }, [dydxAddress, feedbackRequestWalletAddresses, getInTouch, stringGetter, trigger]);
    },

    useNotificationAction: () => {
      const { getInTouch } = useURLConfigs();
      return () => {
        window.open(getInTouch, '_blank', 'noopener, noreferrer');
      };
    },
  },
  {
    type: NotificationType.Custom,
    useTrigger: ({ trigger }) => {
      const customNotifications = useAppSelector(getCustomNotifications);
      useEffect(() => {
        customNotifications.forEach((notification) => {
          trigger({ id: notification.id, displayData: notification.displayData });
        });
      }, [customNotifications, trigger]);
    },
  },
  {
    type: NotificationType.CosmosWalletLifecycle,
    useTrigger: ({ trigger, hideNotification }) => {
      const dispatch = useAppDispatch();
      const stringGetter = useStringGetter();
      const isKeplr = useAppSelector(selectIsKeplrConnected);
      const reclaimableChildSubaccountFunds = useAppSelector(selectReclaimableChildSubaccountFunds);
      const ordersToCancel = useAppSelector(selectOrphanedTriggerOrders);
      const maybeRebalanceAction = useAppSelector(selectShouldAccountRebalanceUsdc);

      useEffect(() => {
        if (!isKeplr) return;

        if (reclaimableChildSubaccountFunds && reclaimableChildSubaccountFunds.length > 0) {
          const amountBN = reclaimableChildSubaccountFunds.reduce(
            (acc, curr) => acc.plus(curr.usdcBalance),
            BIG_NUMBERS.ZERO
          );

          const amountUsdc = amountBN.toFixed(USD_DECIMALS);

          trigger({
            id: CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds,
            updateKey: [amountUsdc],
            displayData: {
              icon: <Icon iconName={IconName.CurrencySign} />,
              title: stringGetter({ key: STRING_KEYS.RECLAIM_FUNDS }),
              body: stringGetter({
                key: STRING_KEYS.RECLAIM_FUNDS_DESCRIPTION,
                params: {
                  RECLAIM_AMOUNT: amountUsdc,
                },
              }),
              toastSensitivity: 'background',
              groupKey: CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds,
              toastDuration: Infinity,
            },
          });
        } else {
          hideNotification({
            type: NotificationType.CosmosWalletLifecycle,
            id: CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds,
          });
        }
      }, [
        isKeplr,
        dispatch,
        trigger,
        hideNotification,
        stringGetter,
        reclaimableChildSubaccountFunds,
      ]);

      useEffect(() => {
        if (!isKeplr) return;

        if (ordersToCancel && ordersToCancel.length > 0) {
          trigger({
            id: CosmosWalletNotificationTypes.CancelOrphanedTriggers,
            updateKey: [ordersToCancel],
            displayData: {
              icon: <Icon iconName={IconName.Viewfinder} />,
              title: stringGetter({ key: STRING_KEYS.CANCEL_OLD_TRIGGERS }),
              body: stringGetter({
                key: STRING_KEYS.CANCEL_OLD_TRIGGERS_BODY,
              }),
              toastSensitivity: 'background',
              groupKey: CosmosWalletNotificationTypes.CancelOrphanedTriggers,
              toastDuration: Infinity,
              renderActionSlot: () => (
                <Link
                  isAccent
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {stringGetter({ key: STRING_KEYS.CANCEL_EXTRA_ORDERS })} →
                </Link>
              ),
            },
          });
        } else {
          hideNotification({
            type: NotificationType.CosmosWalletLifecycle,
            id: CosmosWalletNotificationTypes.CancelOrphanedTriggers,
          });
        }
      }, [ordersToCancel, isKeplr, dispatch, trigger, hideNotification, stringGetter]);

      useEffect(() => {
        if (!isKeplr) return;

        if (maybeRebalanceAction?.requiredAction === 'withdraw') {
          trigger({
            id: CosmosWalletNotificationTypes.GasRebalance,
            updateKey: [maybeRebalanceAction.amountToWithdraw],
            displayData: {
              icon: <Icon iconName={IconName.Lightning} />,
              title: stringGetter({ key: STRING_KEYS.LOW_ON_GAS_TITLE }),
              body: stringGetter({
                key: STRING_KEYS.LOW_ON_GAS_BODY,
                params: {
                  MIN_RANGE: AMOUNT_USDC_BEFORE_REBALANCE,
                  MAX_RANGE: AMOUNT_RESERVED_FOR_GAS_USDC,
                },
              }),
              toastSensitivity: 'background',
              groupKey: CosmosWalletNotificationTypes.GasRebalance,
              toastDuration: Infinity,
              renderActionSlot: () => (
                <Link
                  isAccent
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(openDialog(DialogTypes.WithdrawFromSubaccount()));
                  }}
                >
                  {stringGetter({ key: STRING_KEYS.TRANSFER })} →
                </Link>
              ),
            },
          });
        } else {
          hideNotification({
            type: NotificationType.CosmosWalletLifecycle,
            id: CosmosWalletNotificationTypes.GasRebalance,
          });
        }
      }, [isKeplr, dispatch, trigger, hideNotification, stringGetter, maybeRebalanceAction]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();
      return (id: string) => {
        const notificationId = id; // CosmosWalletNotificationType

        if (notificationId === CosmosWalletNotificationTypes.GasRebalance) {
          dispatch(openDialog(DialogTypes.WithdrawFromSubaccount()));
        }

        if (notificationId === CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds) {
          dispatch(openDialog(DialogTypes.ReclaimChildSubaccountFunds()));
        }

        if (notificationId === CosmosWalletNotificationTypes.CancelOrphanedTriggers) {
          dispatch(openDialog(DialogTypes.CancelOrphanedTriggers()));
        }
      };
    },
  },
];

const $Icon = tw.img`h-1.5 w-1.5`;

const $WarningIcon = tw(Icon)`text-color-warning`;
