import { FormEvent } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import {
  ValidationError,
  type SubaccountOrder,
  ErrorType,
  HumanReadableTriggerOrdersPayload,
  Nullable,
} from '@/constants/abacus';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter, useSubaccount, useTriggerOrdersFormInputs } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getPositionDetails } from '@/state/accountSelectors';
import { closeDialog } from '@/state/dialogs';

import abacusStateManager from '@/lib/abacus';
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

  const { placeTriggerOrders } = useSubaccount();
  const isAccountViewOnly = useSelector(calculateIsAccountViewOnly);

  const { asset, entryPrice, size, stepSizeDecimals, tickSizeDecimals, oraclePrice } =
    useSelector(getPositionDetails(marketId)) || {};

  const { differingOrderSizes, inputErrors, inputSize, isEditingExistingOrder, existsLimitOrder } =
    useTriggerOrdersFormInputs({
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
        <Styled.Price type={OutputType.Fiat} value={entryPrice?.current} />
      </Styled.PriceRow>
      <Styled.PriceRow>
        <Styled.PriceLabel>{stringGetter({ key: STRING_KEYS.ORACLE_PRICE })}</Styled.PriceLabel>
        <Styled.Price type={OutputType.Fiat} value={oraclePrice} />
      </Styled.PriceRow>
    </Styled.PriceBox>
  );

  const closeAndClearDialog = () => {
    dispatch(closeDialog());
    abacusStateManager.clearTriggerOrdersInputValues();
  };

  const onSubmitOrders = async () => {
    await placeTriggerOrders({
      onError: (errorParams?: { errorStringKey?: Nullable<string> }) => {
        // TODO: CT-628 Trigger a toast
        closeAndClearDialog();
      },
      onSuccess: (triggerOrdersPayload?: Nullable<HumanReadableTriggerOrdersPayload>) => {
        // TODO: CT-628 Trigger a toast
        closeAndClearDialog();
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
            existsLimitOrder={!!existsLimitOrder}
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
              state={{ isDisabled: hasInputErrors || isAccountViewOnly }}
              slotLeft={
                hasInputErrors ? <Styled.WarningIcon iconName={IconName.Warning} /> : undefined
              }
            >
              {hasInputErrors
                ? stringGetter({
                    key: inputAlert?.actionStringKey ?? STRING_KEYS.UNAVAILABLE,
                  })
                : isEditingExistingOrder
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
