import { FormEvent, useMemo } from 'react';

import styled from 'styled-components';

import { ErrorType, ValidationError, type SubaccountOrder } from '@/constants/abacus';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTriggerOrdersFormInputs } from '@/hooks/useTriggerOrdersFormInputs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getPositionDetails } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
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
  const dispatch = useAppDispatch();

  const { placeTriggerOrders } = useSubaccount();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  const selectPositionDetails = useMemo(getPositionDetails, []);
  const { asset, entryPrice, size, stepSizeDecimals, tickSizeDecimals, oraclePrice } =
    useAppSelector((s) => selectPositionDetails(s, marketId)) ?? {};

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
    <$PriceBox>
      <$PriceRow>
        <$PriceLabel>{stringGetter({ key: STRING_KEYS.AVG_ENTRY_PRICE })}</$PriceLabel>
        <$Price
          type={OutputType.Fiat}
          value={entryPrice?.current}
          fractionDigits={tickSizeDecimals}
        />
      </$PriceRow>
      <$PriceRow>
        <$PriceLabel>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE })}</$PriceLabel>
        <$Price type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
      </$PriceRow>
    </$PriceBox>
  );

  const onSubmitOrders = async () => {
    placeTriggerOrders();
    dispatch(closeDialog());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onSubmitOrders();
  };

  return (
    <$Form onSubmit={onSubmit}>
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
            <$Button
              action={ButtonAction.Primary}
              type={ButtonType.Submit}
              state={{ isDisabled: !!hasInputErrors || !!isAccountViewOnly }}
              slotLeft={hasInputErrors ? <$WarningIcon iconName={IconName.Warning} /> : undefined}
            >
              {hasInputErrors
                ? stringGetter({
                    key: inputAlert?.actionStringKey ?? STRING_KEYS.UNAVAILABLE,
                  })
                : existingStopLossOrder || existingTakeProfitOrder
                ? stringGetter({ key: STRING_KEYS.ENTER_TRIGGERS })
                : stringGetter({ key: STRING_KEYS.ADD_TRIGGERS })}
            </$Button>
          </WithTooltip>
        </>
      )}
    </$Form>
  );
};
const $Form = styled.form`
  ${layoutMixins.column}
  gap: 1.25ch;
`;

const $PriceBox = styled.div`
  background-color: var(--color-layer-2);
  border-radius: 0.5em;
  font: var(--font-base-medium);

  display: grid;
  gap: 0.625em;
  padding: 0.625em 0.75em;
`;

const $PriceRow = styled.div`
  ${layoutMixins.spacedRow};
`;

const $PriceLabel = styled.h3`
  color: var(--color-text-0);
`;

const $Price = styled(Output)`
  color: var(--color-text-2);
`;

const $Button = styled(Button)`
  width: 100%;
`;

const $WarningIcon = styled(Icon)`
  color: var(--color-warning);
`;
