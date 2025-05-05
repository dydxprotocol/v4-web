import { useEffect } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { ComplianceStatus, OrderStatus, SubaccountFillType } from '@/bonsai/types/summaryTypes';
import { SelectedHomeTab, useAccountModal } from '@funkit/connect';
import { groupBy, max, pick } from 'lodash';
import { shallowEqual } from 'react-redux';
import tw from 'twin.macro';

import { AMOUNT_RESERVED_FOR_GAS_USDC, AMOUNT_USDC_BEFORE_REBALANCE } from '@/constants/account';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { ErrorStatuses } from '@/constants/funkit';
import { STRING_KEYS } from '@/constants/localization';
import {
  CosmosWalletNotificationTypes,
  DEFAULT_TOAST_AUTO_CLOSE_MS,
  FeedbackRequestNotificationIds,
  NotificationDisplayData,
  NotificationType,
  type NotificationTypeConfig,
} from '@/constants/notifications';
import { EMPTY_ARR } from '@/constants/objects';
import { StatsigDynamicConfigs } from '@/constants/statsig';
import { PlaceOrderStatuses } from '@/constants/trade';
import { IndexerOrderSide, IndexerOrderType } from '@/types/indexer/indexerApiGen';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
// eslint-disable-next-line import/no-cycle
import { Notification } from '@/components/Notification';
import { formatNumberOutput, OutputType } from '@/components/Output';
// eslint-disable-next-line import/no-cycle
import { BlockRewardNotification } from '@/views/notifications/BlockRewardNotification';
import { CancelAllNotification } from '@/views/notifications/CancelAllNotification';
import { CloseAllPositionsNotification } from '@/views/notifications/CloseAllPositionsNotification';
import { FunkitDepositNotification } from '@/views/notifications/FunkitDepositNotification';
import { OrderCancelNotification } from '@/views/notifications/OrderCancelNotification';
import { OrderStatusNotification } from '@/views/notifications/OrderStatusNotification';
import { TradeNotification } from '@/views/notifications/TradeNotification';
import {
  getIndexerOrderSideStringKey,
  getIndexerOrderTypeStringKey,
} from '@/views/tables/enumToStringKeyHelpers';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getFunkitDeposits } from '@/state/funkitDepositsSelector';
import {
  getLocalCancelAlls,
  getLocalCancelOrders,
  getLocalCloseAllPositions,
  getLocalPlaceOrders,
} from '@/state/localOrdersSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import {
  getCosmosWalletNotifications,
  getCustomNotifications,
} from '@/state/notificationsSelectors';
import { selectTransfersByAddress } from '@/state/transfersSelectors';
import { selectIsKeplrConnected } from '@/state/walletSelectors';

import { assertNever } from '@/lib/assertNever';
import { calc } from '@/lib/do';
import { MustBigNumber } from '@/lib/numbers';
import { getAverageFillPrice } from '@/lib/orders';
import { orEmptyRecord } from '@/lib/typeUtils';

import { useAccounts } from './useAccounts';
import { useApiState } from './useApiState';
import { useComplianceState } from './useComplianceState';
import { useLocaleSeparators } from './useLocaleSeparators';
import { useAppSelectorWithArgs } from './useParameterizedSelector';
import { useAllStatsigDynamicConfigValues } from './useStatsig';
import { useStringGetter } from './useStringGetter';
import { useTokenConfigs } from './useTokenConfigs';
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

          trigger(
            `order:${order.id}`,
            {
              icon: marketInfo != null ? <$Icon src={marketInfo.logo} /> : undefined,
              title: stringGetter({ key: titleKey }),
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
            },
            [latestUpdateMs, order.status, order.totalFilled?.toNumber()],
            !(relevantPlaceOrder != null || relevantLocalCancels.length > 0),
            false,
            true
          );
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
            if (
              fill.createdAt == null ||
              new Date(fill.createdAt).getTime() <= appInitializedTime
            ) {
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
            trigger(
              `fill:${fill.id ?? ''}`,
              {
                icon: <$Icon src={marketInfo?.logo} alt="" />,
                title: stringGetter({ key: titleKey }),
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
              },
              [fill, marketInfo?.displayableAsset, marketInfo?.logo]
            );
          });
      }, [trigger, appInitializedTime, stringGetter, fills, allMarkets]);
    },
  },
  {
    type: NotificationType.BlockTradingReward,
    useTrigger: ({ trigger, appInitializedTime }) => {
      const blockTradingRewards = useAppSelector(BonsaiCore.account.blockTradingRewards.data);
      const stringGetter = useStringGetter();
      const tokenName = useTokenConfigs().chainTokenLabel;
      useEffect(() => {
        blockTradingRewards.forEach((reward) => {
          if (new Date(reward.createdAt).getTime() <= appInitializedTime) {
            return;
          }
          const amount = MustBigNumber(reward.tradingReward).toString(10);
          trigger(
            `blockReward:${reward.createdAtHeight}`,
            {
              title: stringGetter({ key: STRING_KEYS.BLOCK_REWARD_TITLE }),
              body: stringGetter({
                key: STRING_KEYS.BLOCK_REWARD_BODY,
                params: {
                  BLOCK_REWARD_AMOUNT: amount,
                  TOKEN_NAME: tokenName,
                },
              }),
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              toastSensitivity: 'foreground',
              groupKey: 'blockReward',
              renderCustomBody: ({ isToast, notification }) => (
                <BlockRewardNotification
                  isToast={isToast}
                  amount={amount}
                  tokenName={tokenName}
                  notification={notification}
                />
              ),
            },
            [reward.createdAtHeight, reward.tradingReward],
            true
          );
        });
      }, [trigger, blockTradingRewards, appInitializedTime, stringGetter, tokenName]);
    },
  },
  {
    type: NotificationType.FunkitDeposit,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const funkitDeposits = useAppSelector(getFunkitDeposits, shallowEqual);
      const { openAccountModal } = useAccountModal();

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const deposit of Object.values(funkitDeposits)) {
          const { checkoutId, status } = deposit;
          trigger(
            checkoutId,
            {
              icon: <Icon iconName={IconName.FunkitInstant} tw="text-color-accent" />,
              title:
                status === 'COMPLETED' || !ErrorStatuses.includes(status ?? '')
                  ? stringGetter({ key: STRING_KEYS.INSTANT_DEPOSIT })
                  : stringGetter({ key: STRING_KEYS.INSTANT_DEPOSIT_IN_PROGRESS }),
              body:
                status === 'COMPLETED'
                  ? stringGetter({ key: STRING_KEYS.DEPOSIT_COMPLETED })
                  : ErrorStatuses.includes(status ?? '')
                    ? stringGetter({ key: STRING_KEYS.DEPOSIT_FAILD })
                    : stringGetter({ key: STRING_KEYS.DEPOSIT_SHORTLY }),
              toastSensitivity: 'foreground',
              renderCustomBody:
                status !== 'COMPLETED' && !ErrorStatuses.includes(status ?? '')
                  ? ({ isToast, notification }) => (
                      <FunkitDepositNotification
                        isToast={isToast}
                        notification={notification}
                        deposit={deposit}
                      />
                    )
                  : undefined,
              groupKey: NotificationType.FunkitDeposit,
              renderActionSlot: () => (
                <Link onClick={() => openAccountModal?.(SelectedHomeTab.CHECKOUTS)} isAccent>
                  {stringGetter({ key: STRING_KEYS.VIEW_INSTANT_DEPOSIT_HISTORY })} →
                </Link>
              ),
            },
            []
          );
        }
      }, [funkitDeposits, stringGetter, trigger, openAccountModal]);
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

          trigger(
            id,
            {
              title,
              icon: <Icon iconName={isSuccess ? IconName.Transfer : IconName.Clock} />,
              body,
              toastSensitivity: 'foreground',
              groupKey: NotificationType.SkipTransfer,
            },
            [isSuccess]
          );
        }
      }, [decimalSeparator, groupSeparator, selectedLocale, stringGetter, userTransfers]);
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
    useTrigger: ({ trigger: _trigger }) => {},
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.ApiError,
    useTrigger: ({ trigger, hideNotification }) => {
      const stringGetter = useStringGetter();
      const { statusErrorMessage } = useApiState();
      const { statusPage } = useURLConfigs();

      useEffect(() => {
        if (statusErrorMessage) {
          trigger(
            NotificationType.ApiError,
            {
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
            [],
            true,
            true // unhide on new error (i.e. normal -> not normal api status)
          );
        } else {
          // hide/expire existing notification if no error
          hideNotification({
            type: NotificationType.ApiError,
            id: NotificationType.ApiError,
          });
        }
      }, [stringGetter, statusErrorMessage?.body, statusErrorMessage?.title, hideNotification]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.ComplianceAlert,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { complianceMessage, complianceState, complianceStatus } = useComplianceState();

      useEffect(() => {
        if (complianceState !== ComplianceStates.FULL_ACCESS) {
          const displayData: NotificationDisplayData = {
            icon: <$WarningIcon iconName={IconName.Warning} />,
            title: stringGetter({ key: STRING_KEYS.COMPLIANCE_WARNING }),
            renderCustomBody: ({ isToast, notification }) => (
              <Notification
                isToast={isToast}
                notification={notification}
                slotDescription={complianceMessage}
              />
            ),
            toastSensitivity: 'foreground',
            groupKey: NotificationType.ComplianceAlert,
            withClose: false,
          };

          trigger(`${NotificationType.ComplianceAlert}-${complianceStatus}`, displayData, []);
        }
      }, [stringGetter, complianceMessage, complianceState, complianceStatus]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();
      const { complianceStatus } = useComplianceState();

      return () => {
        if (complianceStatus === ComplianceStatus.FIRST_STRIKE_CLOSE_ONLY) {
          dispatch(openDialog(DialogTypes.GeoCompliance()));
        }
      };
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
          trigger(
            key,
            {
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
            },
            [localPlace.submissionStatus, localPlace.errorParams],
            true
          );
        });
      }, [localPlaceOrders]);

      useEffect(() => {
        Object.values(localCancelOrders).forEach((localCancel) => {
          // skip if this is from a cancel all operation and isn't an error
          if (localCancel.isSubmittedThroughCancelAll && localCancel.errorParams == null) {
            return;
          }
          const existingOrder = allOrders.find((order) => order.id === localCancel.orderId);

          const key = localCancel.operationUuid;
          trigger(
            key,
            {
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
            },
            [localCancel.submissionStatus, localCancel.errorParams],
            true
          );
        });
      }, [localCancelOrders]);

      useEffect(() => {
        Object.values(localCancelAlls).forEach((cancelAll) => {
          trigger(
            cancelAll.operationUuid,
            {
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
            [cancelAll, pick(localCancelOrders, cancelAll.cancelOrderOperationUuids)],
            true
          );
        });
      }, [localCancelAlls, localCancelOrders, stringGetter]);

      useEffect(() => {
        Object.values(localCloseAllPositions).forEach((localCloseAll) => {
          const localCloseAllKey = localCloseAll.operationUuid;
          const clientIds = localCloseAll.clientIds;
          trigger(
            localCloseAllKey,
            {
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
            [localCloseAll, pick(localPlaceOrders, clientIds)],
            true
          );
        });
      }, [localCloseAllPositions, localPlaceOrders, stringGetter]);
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
          trigger(FeedbackRequestNotificationIds.Top100UserSupport, {
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
          });
        }
      }, [dydxAddress]);
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
          trigger(notification.id, notification.displayData);
        });
      }, [customNotifications, trigger]);
    },
  },
  {
    type: NotificationType.CosmosWalletLifecycle,
    useTrigger: ({ trigger, hideNotification }) => {
      const stringGetter = useStringGetter();
      const cosmosWalletNotifications = useAppSelector(getCosmosWalletNotifications);
      const isKeplr = useAppSelector(selectIsKeplrConnected);
      const dispatch = useAppDispatch();

      useEffect(() => {
        if (isKeplr) {
          [
            CosmosWalletNotificationTypes.GasRebalance,
            CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds,
            CosmosWalletNotificationTypes.CancelOrphanedTriggers,
          ].forEach((notificationId: CosmosWalletNotificationTypes) => {
            const cosmosNotif = cosmosWalletNotifications[notificationId];

            switch (notificationId) {
              case CosmosWalletNotificationTypes.GasRebalance:
                if (cosmosNotif) {
                  trigger(notificationId, {
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
                    groupKey: notificationId,
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
                  });
                } else {
                  hideNotification({
                    type: NotificationType.CosmosWalletLifecycle,
                    id: notificationId,
                  });
                }
                break;

              case CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds:
                if (cosmosNotif) {
                  trigger(notificationId, {
                    icon: <Icon iconName={IconName.CurrencySign} />,
                    title: stringGetter({ key: STRING_KEYS.RECLAIM_FUNDS }),
                    body: stringGetter({
                      key: STRING_KEYS.RECLAIM_FUNDS_DESCRIPTION,
                      params: {
                        RECLAIM_AMOUNT: AMOUNT_USDC_BEFORE_REBALANCE,
                      },
                    }),
                    toastSensitivity: 'background',
                    groupKey: notificationId,
                    toastDuration: Infinity,
                    renderActionSlot: () => (
                      <Link
                        isAccent
                        onClick={(e) => {
                          e.preventDefault();
                          dispatch(openDialog(DialogTypes.ReclaimChildSubaccountFunds()));
                        }}
                      >
                        {stringGetter({ key: STRING_KEYS.RECLAIM_FUNDS })} →
                      </Link>
                    ),
                  });
                } else {
                  hideNotification({
                    type: NotificationType.CosmosWalletLifecycle,
                    id: notificationId,
                  });
                }
                break;

              case CosmosWalletNotificationTypes.CancelOrphanedTriggers:
                if (cosmosNotif) {
                  trigger(notificationId, {
                    icon: <Icon iconName={IconName.Viewfinder} />,
                    title: stringGetter({ key: STRING_KEYS.CANCEL_OLD_TRIGGERS }),
                    body: stringGetter({
                      key: STRING_KEYS.CANCEL_OLD_TRIGGERS_BODY,
                    }),
                    toastSensitivity: 'background',
                    groupKey: notificationId,
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
                  });
                } else {
                  hideNotification({
                    type: NotificationType.CosmosWalletLifecycle,
                    id: notificationId,
                  });
                }
                break;
              default:
                assertNever(notificationId);
            }
          });
        }
      }, [cosmosWalletNotifications, dispatch, isKeplr, trigger, hideNotification, stringGetter]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();
      return (id: string) => {
        const notificationId = id as CosmosWalletNotificationTypes;

        switch (notificationId) {
          case CosmosWalletNotificationTypes.GasRebalance:
            dispatch(openDialog(DialogTypes.WithdrawFromSubaccount()));
            break;
          case CosmosWalletNotificationTypes.ReclaimChildSubaccountFunds:
            dispatch(openDialog(DialogTypes.ReclaimChildSubaccountFunds()));
            break;
          case CosmosWalletNotificationTypes.CancelOrphanedTriggers:
            dispatch(openDialog(DialogTypes.CancelOrphanedTriggers()));
            break;
          default:
            assertNever(notificationId);
        }
      };
    },
  },
];

const $Icon = tw.img`h-1.5 w-1.5`;

const $WarningIcon = tw(Icon)`text-color-warning`;
