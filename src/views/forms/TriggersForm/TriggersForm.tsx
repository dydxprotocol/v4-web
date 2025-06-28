import { FormEvent, useMemo } from 'react';

import {
  ErrorType,
  getAlertsToRender,
  getFormDisabledButtonStringKey,
} from '@/bonsai/lib/validationErrors';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { PositionUniqueId } from '@/bonsai/types/summaryTypes';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
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

import { track } from '@/lib/analytics/analytics';
import { testFlags } from '@/lib/testFlags';
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
  const { isTablet } = useBreakpoints();
  const isSimpleUi = isTablet && testFlags.simpleUi;

  const { placeTriggerOrders } = useSubaccount();
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  const { stopLossOrders, takeProfitOrders } = orEmptyObj(
    useAppSelectorWithArgs(getSubaccountConditionalOrders, isSlTpLimitOrdersEnabled)[
      positionUniqueId
    ]
  );

  const { entryPrice, signedSize, market } = orEmptyObj(
    useAppSelectorWithArgs(getSubaccountPositionByUniqueId, positionUniqueId)
  );

  const { oraclePrice, assetId, displayableAsset, tickSizeDecimals, stepSizeDecimals, stepSize } =
    orEmptyObj(useAppSelectorWithArgs(BonsaiHelpers.markets.selectMarketSummaryById, market));

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
  const canCompactNumber = stepSize && Number(stepSize) >= 1;
  const priceInfo = isSimpleUi ? (
    <div tw="row overflow-x-auto">
      {[
        {
          label: stringGetter({ key: STRING_KEYS.MARK_PRICE }),
          value: (
            <$Output
              tw="font-mini-book"
              withSubscript
              type={OutputType.Fiat}
              value={oraclePrice}
              fractionDigits={tickSizeDecimals}
            />
          ),
        },
        {
          label: stringGetter({ key: STRING_KEYS.ENTRY_PRICE_SHORT }),
          value: (
            <$Output
              tw="font-mini-book"
              withSubscript
              type={OutputType.Fiat}
              value={entryPrice}
              fractionDigits={tickSizeDecimals}
            />
          ),
        },
        {
          label: stringGetter({ key: STRING_KEYS.SIZE }),
          value: (
            <$Output
              tw="font-mini-book"
              type={canCompactNumber ? OutputType.CompactNumber : OutputType.Number}
              value={signedSize}
              fractionDigits={stepSizeDecimals}
              slotRight={!!signedSize && ` ${displayableAsset}`}
            />
          ),
        },
      ].map(({ label, value }, idx) => (
        <$SimplePriceBox key={label} isFirst={idx === 0}>
          <span tw="text-color-text-0 font-mini-book">{label}</span>
          {value}
        </$SimplePriceBox>
      ))}
    </div>
  ) : (
    <$PriceBox>
      <$PriceRow>
        <$PriceLabel>{stringGetter({ key: STRING_KEYS.AVG_ENTRY_PRICE })}</$PriceLabel>
        <$Output type={OutputType.Fiat} value={entryPrice} fractionDigits={tickSizeDecimals} />
      </$PriceRow>
      <$PriceRow>
        <$PriceLabel>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE })}</$PriceLabel>
        <$Output type={OutputType.Fiat} value={oraclePrice} fractionDigits={tickSizeDecimals} />
      </$PriceRow>
    </$PriceBox>
  );

  const dispatch = useAppDispatch();

  const onSubmitOrders = async () => {
    if (summary.payload == null) {
      return;
    }
    track(AnalyticsEvents.TriggerOrderClick({ marketId: market }));
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
    <form onSubmit={onSubmit} tw="flexColumn gap-[1.25ch]">
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
            action={isSimpleUi ? ButtonAction.SimplePrimary : ButtonAction.Primary}
            size={isSimpleUi ? ButtonSize.Large : ButtonSize.Base}
            type={ButtonType.Submit}
            state={{ isDisabled: hasErrors || isAccountViewOnly }}
            slotLeft={
              hasErrors ? <Icon iconName={IconName.Warning} tw="text-color-warning" /> : undefined
            }
            tw="mt-auto w-full"
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

const $SimplePriceBox = styled.div<{ isFirst: boolean }>`
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
  gap: 0.25rem;

  ${({ isFirst }) =>
    isFirst &&
    css`
      padding-left: 0;
    `}

  &:not(:last-child) {
    border-right: 1px solid var(--color-border);
    padding-right: 1rem;
  }
`;

const $PriceRow = tw.div`spacedRow`;

const $PriceLabel = tw.h3`text-color-text-0`;

const $Output = tw(Output)`text-color-text-2`;
