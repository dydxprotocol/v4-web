import { useEffect } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { ComplianceStatus } from '@/bonsai/types/summaryTypes';
import { SelectedHomeTab, useAccountModal } from '@funkit/connect';
import { groupBy, isEqual } from 'lodash';
import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import tw from 'twin.macro';

import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { ErrorStatuses } from '@/constants/funkit';
import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import {
  STRING_KEY_VALUES,
  STRING_KEYS,
  type StringGetterFunction,
  type StringKey,
} from '@/constants/localization';
import {
  DEFAULT_TOAST_AUTO_CLOSE_MS,
  FeedbackRequestNotificationIds,
  NotificationDisplayData,
  NotificationType,
  TransferNotificationTypes,
  type NotificationTypeConfig,
} from '@/constants/notifications';
import { AppRoute } from '@/constants/routes';
import { StatsigDynamicConfigs } from '@/constants/statsig';
import { DydxChainAsset } from '@/constants/wallets';

import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { AssetIcon } from '@/components/AssetIcon';
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
import { TransferStatusNotification } from '@/views/notifications/TransferStatusNotification';

import { getSubaccountFills, getSubaccountOrders } from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
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
import { getAbacusNotifications, getCustomNotifications } from '@/state/notificationsSelectors';
import { getMarketIds } from '@/state/perpetualsSelectors';
import { selectTransfersByAddress } from '@/state/transfersSelectors';

import { formatSeconds } from '@/lib/timeUtils';

import { useAccounts } from './useAccounts';
import { useApiState } from './useApiState';
import { useComplianceState } from './useComplianceState';
import { useLocaleSeparators } from './useLocaleSeparators';
import { useParameterizedSelector } from './useParameterizedSelector';
import { useAllStatsigDynamicConfigValues } from './useStatsig';
import { useStringGetter } from './useStringGetter';
import { useTokenConfigs } from './useTokenConfigs';
import { useURLConfigs } from './useURLConfigs';

const parseStringParamsForNotification = ({
  stringGetter,
  value,
}: {
  stringGetter: StringGetterFunction;
  value: unknown;
}) => {
  if (STRING_KEY_VALUES[value as StringKey]) {
    return stringGetter({ key: value as string });
  }

  return value as string;
};

export const notificationTypes: NotificationTypeConfig[] = [
  {
    type: NotificationType.AbacusGenerated,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const abacusNotifications = useAppSelector(getAbacusNotifications, isEqual);
      const orders = useAppSelector(getSubaccountOrders, shallowEqual);
      const ordersById = groupBy(orders, 'id');
      const localPlaceOrders = useAppSelector(getLocalPlaceOrders, shallowEqual);

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const abacusNotif of abacusNotifications) {
          const [abacusNotificationType = '', id = ''] = abacusNotif.id.split(':');
          const parsedData = abacusNotif.data ? JSON.parse(abacusNotif.data) : {};

          const params = Object.fromEntries(
            Object.entries(parsedData).map(([key, value]) => {
              return [key, parseStringParamsForNotification({ stringGetter, value })];
            })
          );

          switch (abacusNotificationType) {
            case 'order': {
              const order = ordersById[id]?.[0];
              const clientId: string | undefined = order?.clientId ?? undefined;
              const localOrderExists =
                clientId && localPlaceOrders.some((ordr) => ordr.clientId === clientId);

              if (localOrderExists) return; // already handled by OrderStatusNotification

              trigger(
                abacusNotif.id,
                {
                  icon: abacusNotif.image && <$Icon src={abacusNotif.image} alt="" />,
                  title: stringGetter({ key: abacusNotif.title }),
                  body: abacusNotif.text ? stringGetter({ key: abacusNotif.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                  groupKey: abacusNotificationType,
                  searchableContent: `${parsedData?.ASSET}|${parsedData?.MARKET}}|${parsedData?.ORDER_TYPE_TEXT}`,
                  renderCustomBody: ({ isToast, notification }) => (
                    <TradeNotification
                      isToast={isToast}
                      data={parsedData}
                      notification={notification}
                    />
                  ),
                },
                [abacusNotif.updateTimeInMilliseconds, abacusNotif.data],
                true
              );
              break;
            }
            case 'blockReward': {
              trigger(
                abacusNotif.id,
                {
                  icon: abacusNotif.image && <$Icon src={abacusNotif.image} alt="" />,
                  title: stringGetter({ key: abacusNotif.title }),
                  body: abacusNotif.text ? stringGetter({ key: abacusNotif.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                  groupKey: abacusNotificationType,
                  renderCustomBody: ({ isToast, notification }) => (
                    <BlockRewardNotification
                      isToast={isToast}
                      data={parsedData}
                      notification={notification}
                    />
                  ),
                },
                [abacusNotif.updateTimeInMilliseconds, abacusNotif.data],
                true
              );
              break;
            }
            default:
              trigger(
                abacusNotif.id,
                {
                  icon: abacusNotif.image && <$Icon src={abacusNotif.image} alt="" />,
                  title: stringGetter({ key: abacusNotif.title }),
                  body: abacusNotif.text ? stringGetter({ key: abacusNotif.text, params }) : '',
                  toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
                  toastSensitivity: 'foreground',
                  groupKey: abacusNotificationType,
                },
                [abacusNotif.updateTimeInMilliseconds, abacusNotif.data]
              );
              break;
          }
        }
      }, [abacusNotifications, stringGetter]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();
      const orders = useAppSelector(getSubaccountOrders, shallowEqual);
      const ordersById = groupBy(orders, 'id');
      const fills = useAppSelector(getSubaccountFills, shallowEqual);
      const fillsById = groupBy(fills, 'id');
      const marketIds = useAppSelector(getMarketIds, shallowEqual);
      const navigate = useNavigate();

      return (notificationId: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [abacusNotificationType, id = ''] = notificationId.split(':');

        if (ordersById[id]) {
          dispatch(openDialog(DialogTypes.OrderDetails({ orderId: id })));
        } else if (fillsById[id]) {
          dispatch(openDialog(DialogTypes.FillDetails({ fillId: id })));
        } else if (marketIds.includes(id)) {
          navigate(`${AppRoute.Trade}/${id}`, {
            replace: true,
          });
        }
      };
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
      const userTransfers = useParameterizedSelector(selectTransfersByAddress, dydxAddress);
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
    type: NotificationType.SkipTransfer,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { transferNotifications } = useLocalNotifications();
      const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
      const { usdcImage } = useTokenConfigs();

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const transfer of transferNotifications) {
          const { id, fromChainId, toChainId, status, txHash, toAmount, type, isExchange } =
            transfer;
          const transferType =
            type ??
            (fromChainId === selectedDydxChainId
              ? TransferNotificationTypes.Withdrawal
              : TransferNotificationTypes.Deposit);

          const isCosmosDeposit =
            SUPPORTED_COSMOS_CHAINS.includes(fromChainId ?? '') &&
            fromChainId !== selectedDydxChainId &&
            toChainId === selectedDydxChainId;

          const isFinished =
            (Boolean(status) && status?.latestRouteStatusSummary !== 'ongoing') || isExchange;
          const icon = isCosmosDeposit ? (
            <AssetIcon tw="[--asset-icon-size: 1.5rem]" logoUrl={usdcImage} symbol="USDC" />
          ) : (
            <Icon iconName={isFinished ? IconName.Transfer : IconName.Clock} />
          );

          const title = isCosmosDeposit
            ? stringGetter({ key: STRING_KEYS.CONFIRM_PENDING_DEPOSIT })
            : stringGetter({
                key: {
                  deposit: isFinished ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS,
                  withdrawal: isFinished ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS,
                }[transferType],
              });

          const toChainEta = status?.toChain?.chainData.estimatedRouteDuration ?? 0;
          // TODO: remove typeguards once skip implements estimatedrouteduration
          // https://linear.app/dydx/issue/OTE-475/[web]-migration-followup-estimatedrouteduration
          const estimatedDuration =
            typeof toChainEta === 'string' ? toChainEta : formatSeconds(Math.max(toChainEta, 0));
          const body = stringGetter({
            key: STRING_KEYS.DEPOSIT_STATUS,
            params: {
              AMOUNT_USD: `${toAmount} ${DydxChainAsset.USDC.toUpperCase()}`,
              ESTIMATED_DURATION: estimatedDuration,
            },
          });

          trigger(
            id ?? txHash,
            {
              icon,
              title,
              body,
              renderCustomBody: ({ isToast, notification }) => (
                <TransferStatusNotification
                  isToast={isToast}
                  slotIcon={icon}
                  slotTitle={title}
                  transfer={transfer}
                  type={transferType}
                  triggeredAt={transfer.triggeredAt}
                  notification={notification}
                />
              ),
              toastSensitivity: 'foreground',
              groupKey: NotificationType.SkipTransfer,
            },
            [isFinished]
          );
        }
      }, [transferNotifications, stringGetter, selectedDydxChainId, usdcImage]);
    },
    useNotificationAction: () => {
      return () => {};
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
        // eslint-disable-next-line no-restricted-syntax
        for (const localPlace of localPlaceOrders) {
          const key = localPlace.clientId.toString();
          trigger(
            key,
            {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.ORDER_STATUS }),
              toastSensitivity: 'background',
              groupKey: key, // do not collapse
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              searchableContent: `${localPlace.marketId}|${localPlace.orderType}`,
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
        }
      }, [localPlaceOrders]);

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const localCancel of localCancelOrders) {
          // ensure order exists
          const existingOrder = allOrders.find((order) => order.id === localCancel.orderId);
          if (!existingOrder) return;

          // skip if this is from a cancel all operation and isn't an error
          if (localCancel.isSubmittedThroughCancelAll && !localCancel.errorParams) return;

          // share same notification with existing local order if exists
          // so that canceling a local order will not add an extra notification
          const key = (existingOrder.clientId ?? localCancel.orderId).toString();

          trigger(
            key,
            {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.ORDER_STATUS }),
              toastSensitivity: 'background',
              groupKey: key,
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              searchableContent: `${existingOrder.displayId}|${existingOrder.marketId}`,
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
        }
      }, [localCancelOrders]);

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const cancelAll of Object.values(localCancelAlls)) {
          trigger(
            cancelAll.key,
            {
              icon: null,
              title: stringGetter({ key: STRING_KEYS.CANCEL_ALL_ORDERS }),
              toastSensitivity: 'background',
              groupKey: cancelAll.key,
              toastDuration: DEFAULT_TOAST_AUTO_CLOSE_MS,
              renderCustomBody: ({ isToast, notification }) => (
                <CancelAllNotification
                  isToast={isToast}
                  localCancelAll={cancelAll}
                  notification={notification}
                />
              ),
            },
            [cancelAll.canceledOrderIds, cancelAll.failedOrderIds, cancelAll.errorParams],
            true
          );
        }
      }, [localCancelAlls]);

      useEffect(() => {
        if (!localCloseAllPositions) return;
        const localCloseAllKey = localCloseAllPositions.submittedOrderClientIds.join('-');
        // eslint-disable-next-line no-restricted-syntax
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
                localCloseAllPositions={localCloseAllPositions}
                notification={notification}
              />
            ),
          },
          [localCloseAllPositions],
          true
        );
      }, [localCloseAllPositions]);
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
];

const $Icon = tw.img`h-1.5 w-1.5`;

const $WarningIcon = tw(Icon)`text-color-warning`;
