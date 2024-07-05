import { useEffect } from 'react';

import { groupBy, isEqual } from 'lodash';
import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ComplianceStatus } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import {
  STRING_KEYS,
  STRING_KEY_VALUES,
  type StringGetterFunction,
  type StringKey,
} from '@/constants/localization';
import {
  CURRENT_SEASON_NUMBER,
  DEFAULT_TOAST_AUTO_CLOSE_MS,
  INCENTIVES_DISTRIBUTED_NOTIFICATION_ID,
  INCENTIVES_SEASON_NOTIFICATION_ID,
  MarketWindDownNotificationIds,
  NotificationDisplayData,
  NotificationType,
  REWARD_DISTRIBUTION_SEASON_NUMBER,
  ReleaseUpdateNotificationIds,
  TransferNotificationTypes,
  type NotificationTypeConfig,
} from '@/constants/notifications';
import { AppRoute } from '@/constants/routes';
import { DydxChainAsset } from '@/constants/wallets';

import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
// eslint-disable-next-line import/no-cycle
import { BlockRewardNotification } from '@/views/notifications/BlockRewardNotification';
import { IncentiveSeasonDistributionNotification } from '@/views/notifications/IncentiveSeasonDistributionNotification';
import { OrderCancelNotification } from '@/views/notifications/OrderCancelNotification';
import { OrderStatusNotification } from '@/views/notifications/OrderStatusNotification';
import { StakingLiveNotification } from '@/views/notifications/StakingLiveNotification';
import { TradeNotification } from '@/views/notifications/TradeNotification';
import { TransferStatusNotification } from '@/views/notifications/TransferStatusNotification';

import {
  getLocalCancelOrders,
  getLocalPlaceOrders,
  getSubaccountFills,
  getSubaccountOrders,
} from '@/state/accountSelectors';
import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getAbacusNotifications } from '@/state/notificationsSelectors';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { formatSeconds } from '@/lib/timeUtils';

import { useAccounts } from './useAccounts';
import { useApiState } from './useApiState';
import { useComplianceState } from './useComplianceState';
import { useEnvFeatures } from './useEnvFeatures';
import { useQueryChaosLabsIncentives } from './useQueryChaosLabsIncentives';
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
      const orders = useAppSelector(getSubaccountOrders, shallowEqual) ?? [];
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
              const clientId: number | undefined = order?.clientId ?? undefined;
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
      const orders = useAppSelector(getSubaccountOrders, shallowEqual) ?? [];
      const ordersById = groupBy(orders, 'id');
      const fills = useAppSelector(getSubaccountFills, shallowEqual) ?? [];
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
    type: NotificationType.SquidTransfer,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();
      const { transferNotifications } = useLocalNotifications();
      const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const transfer of transferNotifications) {
          const { fromChainId, status, txHash, toAmount, type, isExchange } = transfer;
          const isFinished =
            (Boolean(status) && status?.squidTransactionStatus !== 'ongoing') || isExchange;
          const icon = <Icon iconName={isFinished ? IconName.Transfer : IconName.Clock} />;

          const transferType =
            type ??
            (fromChainId === selectedDydxChainId
              ? TransferNotificationTypes.Withdrawal
              : TransferNotificationTypes.Deposit);

          const title = stringGetter({
            key: {
              deposit: isFinished ? STRING_KEYS.DEPOSIT : STRING_KEYS.DEPOSIT_IN_PROGRESS,
              withdrawal: isFinished ? STRING_KEYS.WITHDRAW : STRING_KEYS.WITHDRAW_IN_PROGRESS,
            }[transferType],
          });

          const toChainEta = status?.toChain?.chainData?.estimatedRouteDuration ?? 0;
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
            txHash,
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
              groupKey: NotificationType.SquidTransfer,
            },
            [isFinished]
          );
        }
      }, [transferNotifications, stringGetter]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.ReleaseUpdates,
    useTrigger: ({ trigger }) => {
      const { chainTokenLabel } = useTokenConfigs();
      const stringGetter = useStringGetter();

      const incentivesExpirationDate = new Date('2024-07-17T23:59:59');
      const conditionalOrdersExpirationDate = new Date('2024-06-01T23:59:59');
      const fokDeprecationExpirationDate = new Date('2024-07-01T23:59:59');
      const isolatedMarginLiveExpirationDate = new Date('2024-07-12T23:59:59');
      const stakingLiveExpirationDate = new Date('2024-08-24T23:59:59');

      const { isolatedMarginLearnMore } = useURLConfigs();

      const currentDate = new Date();

      useEffect(() => {
        if (currentDate <= incentivesExpirationDate) {
          trigger(
            INCENTIVES_SEASON_NOTIFICATION_ID,
            {
              icon: <AssetIcon symbol={chainTokenLabel} />,
              title: stringGetter({
                key: 'NOTIFICATIONS.INCENTIVES_SEASON_BEGUN.TITLE',
                params: { SEASON_NUMBER: CURRENT_SEASON_NUMBER },
              }),
              body: stringGetter({
                key: 'NOTIFICATIONS.INCENTIVES_SEASON_BEGUN.BODY',
                params: {
                  PREV_SEASON_NUMBER: CURRENT_SEASON_NUMBER - 2, // we generally only have data for rewards from 2 seasons ago because the new season launches before the previous season's rewards are distributed
                  DYDX_AMOUNT: '52',
                  USDC_AMOUNT: '100',
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: INCENTIVES_SEASON_NOTIFICATION_ID,
            },
            []
          );
        }

        if (currentDate <= conditionalOrdersExpirationDate) {
          trigger(
            ReleaseUpdateNotificationIds.RevampedConditionalOrders,
            {
              icon: <AssetIcon symbol={chainTokenLabel} />,
              title: stringGetter({
                key: 'NOTIFICATIONS.CONDITIONAL_ORDERS_REVAMP.TITLE',
              }),
              body: stringGetter({
                key: 'NOTIFICATIONS.CONDITIONAL_ORDERS_REVAMP.BODY',
                params: {
                  TWITTER_LINK: (
                    <Link
                      href="https://twitter.com/dYdX/status/1785339109268935042"
                      isAccent
                      isInline
                    >
                      {stringGetter({ key: STRING_KEYS.HERE })}
                    </Link>
                  ),
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: ReleaseUpdateNotificationIds.RevampedConditionalOrders,
            },
            []
          );
        }

        if (currentDate <= fokDeprecationExpirationDate) {
          trigger(
            ReleaseUpdateNotificationIds.FOKDeprecation,
            {
              icon: <AssetIcon symbol={chainTokenLabel} />,
              title: stringGetter({
                key: 'NOTIFICATIONS.FOK_DEPRECATION.TITLE',
              }),
              body: stringGetter({
                key: 'NOTIFICATIONS.FOK_DEPRECATION.BODY',
              }),
              toastSensitivity: 'foreground',
              groupKey: ReleaseUpdateNotificationIds.FOKDeprecation,
            },
            []
          );
        }

        if (currentDate <= isolatedMarginLiveExpirationDate) {
          trigger(
            ReleaseUpdateNotificationIds.IsolatedMarginLive,
            {
              icon: <AssetIcon symbol={chainTokenLabel} />,
              title: stringGetter({
                key: 'NOTIFICATIONS.ISOLATED_MARGIN_LIVE.TITLE',
              }),
              body: stringGetter({
                key: 'NOTIFICATIONS.ISOLATED_MARGIN_LIVE.BODY',
                params: {
                  LEARN_MORE: (
                    <Link href={isolatedMarginLearnMore} isAccent isInline>
                      {stringGetter({ key: STRING_KEYS.HERE })}
                    </Link>
                  ),
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: ReleaseUpdateNotificationIds.IsolatedMarginLive,
            },
            []
          );
        }

        if (currentDate <= stakingLiveExpirationDate) {
          trigger(
            ReleaseUpdateNotificationIds.InAppStakingLive,
            {
              title: stringGetter({ key: 'NOTIFICATIONS.IN_APP_STAKING_LIVE.TITLE' }),
              body: stringGetter({ key: 'NOTIFICATIONS.IN_APP_STAKING_LIVE.BODY' }),
              renderCustomBody({ isToast, notification }) {
                return <StakingLiveNotification isToast={isToast} notification={notification} />;
              },
              toastSensitivity: 'foreground',
              groupKey: ReleaseUpdateNotificationIds.InAppStakingLive,
            },
            []
          );
        }
      }, [stringGetter]);

      const { dydxAddress } = useAccounts();
      const { data, status } = useQueryChaosLabsIncentives({
        dydxAddress,
        season: 3,
      });

      const { dydxRewards } = data ?? {};

      useEffect(() => {
        if (dydxAddress && status === 'success') {
          trigger(
            INCENTIVES_DISTRIBUTED_NOTIFICATION_ID,
            {
              icon: <AssetIcon symbol={chainTokenLabel} />,
              title: stringGetter({
                key: 'NOTIFICATIONS.REWARDS_DISTRIBUTED.TITLE',
                params: { SEASON_NUMBER: REWARD_DISTRIBUTION_SEASON_NUMBER },
              }),
              body: stringGetter({
                key: 'NOTIFICATIONS.REWARDS_DISTRIBUTED.BODY',
                params: {
                  SEASON_NUMBER: REWARD_DISTRIBUTION_SEASON_NUMBER,
                  DYDX_AMOUNT: dydxRewards ?? 0,
                },
              }),
              renderCustomBody({ isToast, notification }) {
                return (
                  <IncentiveSeasonDistributionNotification
                    isToast={isToast}
                    notification={notification}
                    data={{
                      points: dydxRewards ?? 0,
                      chainTokenLabel,
                    }}
                  />
                );
              },
              toastSensitivity: 'foreground',
              groupKey: INCENTIVES_DISTRIBUTED_NOTIFICATION_ID,
            },
            []
          );
        }
      }, [stringGetter, dydxAddress, status, dydxRewards]);
    },
    useNotificationAction: () => {
      const { chainTokenLabel } = useTokenConfigs();
      const navigate = useNavigate();

      return (notificationId: string) => {
        if (
          notificationId === INCENTIVES_SEASON_NOTIFICATION_ID ||
          notificationId === INCENTIVES_DISTRIBUTED_NOTIFICATION_ID
        ) {
          navigate(`${chainTokenLabel}`);
        }
      };
    },
  },
  {
    type: NotificationType.MarketWindDown,
    useTrigger: ({ trigger }) => {
      const stringGetter = useStringGetter();

      const { fetAgixMarketWindDownProposal, contractLossMechanismLearnMore } = useURLConfigs();

      const marketWindDownProposalExpirationDate = '2024-06-11T16:53:00';
      const marketWindDownDate = marketWindDownProposalExpirationDate;
      const marketWindDownExpirationDate = '2024-07-11T16:53:00'; // 30 days after wind down
      const currentDate = new Date();

      const outputDate = <$Output type={OutputType.DateTime} value={marketWindDownDate} />;

      const firstMarket = 'FET-USD';
      const secondMarket = 'AGIX-USD';

      useEffect(() => {
        if (currentDate <= new Date(marketWindDownProposalExpirationDate)) {
          trigger(MarketWindDownNotificationIds.MarketWindDownProposalFetAgix, {
            title: stringGetter({
              key: 'NOTIFICATIONS.TWO_MARKET_WIND_DOWN_PROPOSAL.TITLE',
              params: {
                MARKET_1: firstMarket,
                MARKET_2: secondMarket,
              },
            }),
            body: stringGetter({
              key: 'NOTIFICATIONS.TWO_MARKET_WIND_DOWN_PROPOSAL.BODY',
              params: {
                MARKET_1: firstMarket,
                MARKET_2: secondMarket,
                DATE: outputDate,
                HERE_LINK: (
                  <Link href={fetAgixMarketWindDownProposal} isAccent isInline>
                    {stringGetter({ key: STRING_KEYS.HERE })}
                  </Link>
                ),
              },
            }),
            toastSensitivity: 'foreground',
            groupKey: MarketWindDownNotificationIds.MarketWindDownProposalFetAgix,
          });
        }
      }, [stringGetter]);

      useEffect(() => {
        if (
          currentDate >= new Date(marketWindDownDate) &&
          currentDate <= new Date(marketWindDownExpirationDate)
        ) {
          trigger(
            MarketWindDownNotificationIds.MarketWindDownFetAgix,
            {
              title: stringGetter({
                key: 'NOTIFICATIONS.TWO_MARKET_WIND_DOWN.TITLE',
                params: {
                  MARKET_1: firstMarket,
                  MARKET_2: secondMarket,
                },
              }),
              body: stringGetter({
                key: 'NOTIFICATIONS.TWO_MARKET_WIND_DOWN.BODY',
                params: {
                  MARKET_1: firstMarket,
                  MARKET_2: secondMarket,
                  DATE: outputDate,
                  HERE_LINK: (
                    <Link href={contractLossMechanismLearnMore} isAccent isInline>
                      {stringGetter({ key: STRING_KEYS.HERE })}
                    </Link>
                  ),
                },
              }),
              toastSensitivity: 'foreground',
              groupKey: MarketWindDownNotificationIds.MarketWindDownFetAgix,
            },
            []
          );
        }
      }, [stringGetter]);
    },
    useNotificationAction: () => {
      return () => {};
    },
  },
  {
    type: NotificationType.ApiError,
    useTrigger: ({ trigger }) => {
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
            []
          );
        }
      }, [stringGetter, statusErrorMessage?.body, statusErrorMessage?.title]);
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
            body: complianceMessage,
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
      const allOrders = useAppSelector(getSubaccountOrders, shallowEqual);
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
              renderCustomBody: ({ isToast, notification }) => (
                <OrderStatusNotification
                  isToast={isToast}
                  localOrder={localPlace}
                  notification={notification}
                />
              ),
            },
            [localPlace.submissionStatus, localPlace.errorStringKey],
            true
          );
        }
      }, [localPlaceOrders]);

      useEffect(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const localCancel of localCancelOrders) {
          // ensure order exists
          const existingOrder = allOrders?.find((order) => order.id === localCancel.orderId);
          if (!existingOrder) return;

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
              renderCustomBody: ({ isToast, notification }) => (
                <OrderCancelNotification
                  isToast={isToast}
                  localCancel={localCancel}
                  notification={notification}
                />
              ),
            },
            [localCancel.submissionStatus, localCancel.errorStringKey],
            true
          );
        }
      }, [localCancelOrders]);
    },
    useNotificationAction: () => {
      const dispatch = useAppDispatch();
      const orders = useAppSelector(getSubaccountOrders, shallowEqual) ?? [];

      return (orderClientId: string) => {
        const order = orders.find((o) => o.clientId?.toString() === orderClientId);
        if (order) {
          dispatch(openDialog(DialogTypes.OrderDetails({ orderId: order.id })));
        }
      };
    },
  },
];

const $Icon = styled.img`
  height: 1.5rem;
  width: 1.5rem;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;

const $Output = styled(Output)`
  display: inline-block;
`;
