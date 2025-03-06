import { FormEvent, useMemo } from 'react';

import {
  ErrorType,
  getAlertsToRender,
  getFormDisabledButtonStringKey,
} from '@/bonsai/lib/validationErrors';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { PositionUniqueId } from '@/bonsai/types/summaryTypes';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTriggerOrdersFormInputs } from '@/hooks/useTriggerOrdersFormInputs';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { ValidationAlertMessage } from '@/components/ValidationAlert';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import {
  getSubaccountConditionalOrders,
  getSubaccountPositionByUniqueId,
} from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

import { orEmptyObj } from '@/lib/typeUtils';

import { AdvancedTriggersOptions } from './AdvancedTriggersOptions';
import { TriggerOrdersInputs } from './TriggerOrdersInputs';

type ElementProps = {
  positionUniqueId: PositionUniqueId;
  onViewOrdersClick: () => void;
};

export const TriggersForm = ({ positionUniqueId, onViewOrdersClick }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isSlTpLimitOrdersEnabled } = useEnvFeatures();

  const { placeTriggerOrders } = useSubaccount();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  const { stopLossOrders, takeProfitOrders } = orEmptyObj(
    useParameterizedSelector(getSubaccountConditionalOrders, isSlTpLimitOrdersEnabled)[
      positionUniqueId
    ]
  );

  const { entryPrice, signedSize, market } = orEmptyObj(
    useParameterizedSelector(getSubaccountPositionByUniqueId, positionUniqueId)
  );

  const { oraclePrice, assetId, tickSizeDecimals, stepSizeDecimals } = orEmptyObj(
    useParameterizedSelector(BonsaiHelpers.markets.createSelectMarketSummaryById, market)
  );

  const {
    differingOrderSizes,
    inputErrors,
    summary,
    existingStopLossOrder,
    existingTakeProfitOrder,
    existsLimitOrder,
  } = useTriggerOrdersFormInputs({
    positionId: positionUniqueId,
    stopLossOrder: stopLossOrders?.length === 1 ? stopLossOrders[0] : undefined,
    takeProfitOrder: takeProfitOrders?.length === 1 ? takeProfitOrders[0] : undefined,
  });

  const symbol = assetId ?? '';
  const multipleTakeProfitOrders = (takeProfitOrders?.length ?? 0) > 1;
  const multipleStopLossOrders = (stopLossOrders?.length ?? 0) > 1;

  // The triggers form does not support editing multiple stop loss or take profit orders - so if both have
  // multiple, we hide the triggers button CTA
  const existsEditableOrCreatableOrders = !(multipleTakeProfitOrders && multipleStopLossOrders);

  const priceInfo = (
    <$PriceBox>
      <$PriceRow>
        <$PriceLabel>{stringGetter({ key: STRING_KEYS.AVG_ENTRY_PRICE })}</$PriceLabel>
        <$Price type={OutputType.Fiat} value={entryPrice} fractionDigits={tickSizeDecimals} />
      </$PriceRow>
      <$PriceRow>
        <$PriceLabel>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE })}</$PriceLabel>
        <$Price type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
      </$PriceRow>
    </$PriceBox>
  );

  const dispatch = useAppDispatch();

  const onSubmitOrders = async () => {
    if (summary.payload == null) {
      return;
    }
    placeTriggerOrders(summary.payload);
    dispatch(closeDialog());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onSubmitOrders();
  };

  const validationAlert = useMemo(() => {
    return getAlertsToRender(inputErrors)?.[0];
  }, [inputErrors]);

  const hasErrors = useMemo(() => {
    return inputErrors.some((e) => e.type === ErrorType.error);
  }, [inputErrors]);

  const ctaErrorAction = useMemo(() => {
    const key = getFormDisabledButtonStringKey(inputErrors);
    return key ? stringGetter({ key }) : undefined;
  }, [inputErrors, stringGetter]);

  return (
    <form onSubmit={onSubmit} tw="column gap-[1.25ch]">
      {priceInfo}
      <TriggerOrdersInputs
        symbol={symbol}
        multipleTakeProfitOrders={multipleTakeProfitOrders}
        multipleStopLossOrders={multipleStopLossOrders}
        tickSizeDecimals={tickSizeDecimals}
        onViewOrdersClick={onViewOrdersClick}
      />
      {validationAlert && <ValidationAlertMessage error={validationAlert} />}
      {existsEditableOrCreatableOrders && (
        <>
          <AdvancedTriggersOptions
            symbol={symbol}
            existsLimitOrder={existsLimitOrder}
            size={differingOrderSizes ? null : summary.stopLossOrder.size ?? null}
            positionSize={signedSize ? signedSize.abs().toNumber() : null}
            differingOrderSizes={differingOrderSizes}
            multipleTakeProfitOrders={multipleTakeProfitOrders}
            multipleStopLossOrders={multipleStopLossOrders}
            stepSizeDecimals={stepSizeDecimals}
            tickSizeDecimals={tickSizeDecimals}
          />
          <div tw="text-color-text-0 font-small-book">
            {stringGetter({ key: STRING_KEYS.TRIGGERS_INFO_AUTOMATICALLY_CANCELED })}{' '}
            {stringGetter({ key: STRING_KEYS.TRIGGERS_INFO_CUSTOM_AMOUNT })}
          </div>
          <Button
            action={ButtonAction.Primary}
            type={ButtonType.Submit}
            state={{ isDisabled: hasErrors || isAccountViewOnly }}
            slotLeft={
              hasErrors ? <Icon iconName={IconName.Warning} tw="text-color-warning" /> : undefined
            }
            tw="w-full"
          >
            {hasErrors
              ? ctaErrorAction
              : !!existingStopLossOrder || !!existingTakeProfitOrder
                ? stringGetter({ key: STRING_KEYS.ENTER_TRIGGERS })
                : stringGetter({ key: STRING_KEYS.ADD_TRIGGERS })}
          </Button>
        </>
      )}
    </form>
  );
};
const $PriceBox = styled.div`
  background-color: var(--color-layer-2);
  border-radius: 0.5em;
  font: var(--font-base-medium);

  display: grid;
  gap: 0.625em;
  padding: 0.625em 0.75em;
`;

const $PriceRow = tw.div`spacedRow`;

const $PriceLabel = tw.h3`text-color-text-0`;

const $Price = tw(Output)`text-color-text-2`;
