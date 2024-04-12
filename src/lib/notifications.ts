import { NOTIFICATIONS_STRING_KEYS } from '@dydxprotocol/v4-localization';

import type { StringGetterFunction } from '@/constants/localization';
import {
  TriggerOrderNotification,
  TriggerOrderNotificationTypes,
  TriggerOrderStatus,
} from '@/constants/notifications';
import { TradeTypes } from '@/constants/trade';

export const getTitleAndBodyForTriggerOrderNotification = ({
  notification,
  formattedPrice,
  stringGetter,
}: {
  notification: TriggerOrderNotification;
  formattedPrice: JSX.Element;
  stringGetter: StringGetterFunction;
}) => {
  const { status, orderType, type } = notification;

  switch (orderType) {
    case TradeTypes.STOP_LIMIT:
    case TradeTypes.STOP_MARKET:
      switch (type) {
        case TriggerOrderNotificationTypes.Cancelled:
          switch (status) {
            case TriggerOrderStatus.Error:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_REMOVING_ERROR_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_REMOVING_ERROR_BODY,
                  params: { OLD_VALUE: formattedPrice },
                }),
              };
            case TriggerOrderStatus.Success:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_REMOVED_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_REMOVED_BODY,
                  params: { OLD_VALUE: formattedPrice },
                }),
              };
          }
        case TriggerOrderNotificationTypes.Created:
          switch (status) {
            case TriggerOrderStatus.Error:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_CREATING_ERROR_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_CREATING_ERROR_BODY,
                  params: { NEW_VALUE: formattedPrice },
                }),
              };
            case TriggerOrderStatus.Success:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_CREATED_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.STOP_LOSS_TRIGGER_CREATED_BODY,
                  params: { NEW_VALUE: formattedPrice },
                }),
              };
          }
      }
    case TradeTypes.TAKE_PROFIT:
    case TradeTypes.TAKE_PROFIT_MARKET:
      switch (type) {
        case TriggerOrderNotificationTypes.Cancelled:
          switch (status) {
            case TriggerOrderStatus.Error:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_REMOVING_ERROR_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_REMOVING_ERROR_BODY,
                  params: { OLD_VALUE: formattedPrice },
                }),
              };
            case TriggerOrderStatus.Success:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_REMOVED_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_REMOVED_BODY,
                  params: { OLD_VALUE: formattedPrice },
                }),
              };
          }
        case TriggerOrderNotificationTypes.Created:
          switch (status) {
            case TriggerOrderStatus.Error:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_CREATING_ERROR_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_CREATING_ERROR_BODY,
                  params: { NEW_VALUE: formattedPrice },
                }),
              };
            case TriggerOrderStatus.Success:
              return {
                title: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_CREATED_TITLE,
                }),
                body: stringGetter({
                  key: NOTIFICATIONS_STRING_KEYS.TAKE_PROFIT_TRIGGER_CREATED_BODY,
                  params: { NEW_VALUE: formattedPrice },
                }),
              };
          }
      }
  }
};
