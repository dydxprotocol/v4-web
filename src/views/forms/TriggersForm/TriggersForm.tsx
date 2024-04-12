import { FormEvent, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import {
  ValidationError,
  type SubaccountOrder,
  ErrorType,
  HumanReadableTriggerOrdersPayload,
  Nullable,
  HumanReadableCancelOrderPayload,
  HumanReadablePlaceOrderPayload,
  TRADE_TYPES,
} from '@/constants/abacus';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import {
  TriggerOrderNotificationTypes,
  TriggerOrderOrderType,
  TriggerOrderStatus,
} from '@/constants/notifications';

import { useStringGetter, useSubaccount, useTriggerOrdersFormInputs } from '@/hooks';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getPositionDetails } from '@/state/accountSelectors';
import { closeDialog } from '@/state/dialogs';

import { getTradeInputAlert } from '@/lib/tradeData';

import { AdvancedTriggersOptions } from './AdvancedTriggersOptions';
import { TriggerOrdersInputs } from './TriggerOrdersInputs';

type ElementProps = {
  marketId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  onViewOrdersClick: () => void;
};

export const TriggersForm = ({
  marketId,
  stopLossOrders,
  takeProfitOrders,
  onViewOrdersClick,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const { placeTriggerOrders } = useSubaccount();
  const { addTriggerOrderNotification } = useLocalNotifications();
  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);

  const { asset, entryPrice, size, stepSizeDecimals, tickSizeDecimals, oraclePrice } =
    useSelector(getPositionDetails(marketId)) || {};

  const {
    differingOrderSizes,
    inputErrors,
    inputSize,
    existingStopLossOrder,
    existingTakeProfitOrder,
    existsLimitOrder,
  } = useTriggerOrdersFormInputs({
    marketId,
    positionSize: size?.current ?? null,
    stopLossOrder: stopLossOrders.length === 1 ? stopLossOrders[0] : undefined,
    takeProfitOrder: takeProfitOrders.length === 1 ? takeProfitOrders[0] : undefined,
  });

  const symbol = asset?.id ?? '';
  const multipleTakeProfitOrders = takeProfitOrders.length > 1;
  const multipleStopLossOrders = stopLossOrders.length > 1;

  const hasInputErrors = inputErrors?.some(
    (error: ValidationError) => error.type !== ErrorType.warning
  );
  const inputAlert = getTradeInputAlert({
    abacusInputErrors: inputErrors ?? [],
    stringGetter,
    stepSizeDecimals,
    tickSizeDecimals,
  });

  // The triggers form does not support editing multiple stop loss or take profit orders - so if both have
  // multiple, we hide the triggers button CTA
  const existsEditableOrCreatableOrders = !(multipleTakeProfitOrders && multipleStopLossOrders);

  const priceInfo = (
    <Styled.PriceBox>
      <Styled.PriceRow>
        <Styled.PriceLabel>{stringGetter({ key: STRING_KEYS.AVG_ENTRY_PRICE })}</Styled.PriceLabel>
        <Styled.Price
          type={OutputType.Fiat}
          value={entryPrice?.current}
          fractionDigits={tickSizeDecimals}
        />
      </Styled.PriceRow>
      <Styled.PriceRow>
        <Styled.PriceLabel>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE })}</Styled.PriceLabel>
        <Styled.Price
          type={OutputType.Fiat}
          value={oraclePrice}
          fractionDigits={tickSizeDecimals}
        />
      </Styled.PriceRow>
    </Styled.PriceBox>
  );

  const triggerNotificationForCancelOrderPayloads = (
    triggerPayload: HumanReadableTriggerOrdersPayload,
    isError?: boolean
  ) => {
    const { cancelOrderPayloads } = triggerPayload || {};

    if (cancelOrderPayloads && cancelOrderPayloads.toString() != '[]') {
      cancelOrderPayloads.toArray().map((payload: HumanReadableCancelOrderPayload) => {
        const existingOrder =
          payload.orderId === existingStopLossOrder?.id
            ? existingStopLossOrder
            : payload.orderId === existingTakeProfitOrder?.id
            ? existingTakeProfitOrder
            : null;

        if (existingOrder) {
          addTriggerOrderNotification({
            assetId: symbol,
            clientId: payload.clientId,
            orderType: TRADE_TYPES[existingOrder.type],
            price: existingOrder.triggerPrice,
            status: isError ? TriggerOrderStatus.Error : TriggerOrderStatus.Success,
            tickSizeDecimals,
            type: TriggerOrderNotificationTypes.Cancelled,
          });
        }
      });
    }
  };

  const triggerNotificationForPlaceOrderPayloads = (
    triggerPayload: HumanReadableTriggerOrdersPayload,
    isError?: boolean
  ) => {
    const { placeOrderPayloads } = triggerPayload || {};

    if (placeOrderPayloads && placeOrderPayloads.toString() != '[]') {
      placeOrderPayloads.toArray().map((payload: HumanReadablePlaceOrderPayload) => {
        addTriggerOrderNotification({
          assetId: symbol,
          clientId: payload.clientId,
          orderType: TRADE_TYPES[payload.type],
          price: payload.triggerPrice || undefined,
          status: isError ? TriggerOrderStatus.Error : TriggerOrderStatus.Success,
          tickSizeDecimals,
          type: TriggerOrderNotificationTypes.Created,
        });
      });
    }
  };

  const onSubmitOrders = async () => {
    setIsPlacingOrder(true);

    await placeTriggerOrders({
      onError: (
        triggerOrdersPayload?: Nullable<HumanReadableTriggerOrdersPayload>,
        errorParams?: { errorStringKey?: Nullable<string> }
      ) => {
        triggerNotificationForCancelOrderPayloads(triggerOrdersPayload, true);
        triggerNotificationForPlaceOrderPayloads(triggerOrdersPayload, true);
        setIsPlacingOrder(false);
        dispatch(closeDialog());
      },
      onSuccess: (triggerOrdersPayload: Nullable<HumanReadableTriggerOrdersPayload>) => {
        triggerNotificationForCancelOrderPayloads(triggerOrdersPayload);
        triggerNotificationForPlaceOrderPayloads(triggerOrdersPayload);
        setIsPlacingOrder(false);
        dispatch(closeDialog());
      },
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onSubmitOrders();
  };

  return (
    <Styled.Form onSubmit={onSubmit}>
      {priceInfo}
      <TriggerOrdersInputs
        symbol={symbol}
        multipleTakeProfitOrders={multipleTakeProfitOrders}
        multipleStopLossOrders={multipleStopLossOrders}
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
      />
      {existsEditableOrCreatableOrders && (
        <>
          <AdvancedTriggersOptions
            symbol={symbol}
            existsLimitOrder={existsLimitOrder}
            size={inputSize}
            positionSize={size?.current ? Math.abs(size?.current) : null}
            differingOrderSizes={differingOrderSizes}
            multipleTakeProfitOrders={multipleTakeProfitOrders}
            multipleStopLossOrders={multipleStopLossOrders}
            stepSizeDecimals={stepSizeDecimals}
            tickSizeDecimals={tickSizeDecimals}
          />
          <WithTooltip tooltipString={hasInputErrors ? inputAlert?.alertString : undefined}>
            <Styled.Button
              action={ButtonAction.Primary}
              type={ButtonType.Submit}
              state={{ isDisabled: hasInputErrors || isAccountViewOnly, isLoading: isPlacingOrder }}
              slotLeft={
                hasInputErrors ? <Styled.WarningIcon iconName={IconName.Warning} /> : undefined
              }
            >
              {hasInputErrors
                ? stringGetter({
                    key: inputAlert?.actionStringKey ?? STRING_KEYS.UNAVAILABLE,
                  })
                : !!(existingStopLossOrder || existingTakeProfitOrder)
                ? stringGetter({ key: STRING_KEYS.ENTER_TRIGGERS })
                : stringGetter({ key: STRING_KEYS.ADD_TRIGGERS })}
            </Styled.Button>
          </WithTooltip>
        </>
      )}
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.column}
  gap: 1.25ch;
`;

Styled.PriceBox = styled.div`
  background-color: var(--color-layer-2);
  border-radius: 0.5em;
  font: var(--font-base-medium);

  display: grid;
  gap: 0.625em;
  padding: 0.625em 0.75em;
`;

Styled.PriceRow = styled.div`
  ${layoutMixins.spacedRow};
`;

Styled.PriceLabel = styled.h3`
  color: var(--color-text-0);
`;

Styled.Price = styled(Output)`
  color: var(--color-text-2);
`;

Styled.Button = styled(Button)`
  width: 100%;
`;

Styled.WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
