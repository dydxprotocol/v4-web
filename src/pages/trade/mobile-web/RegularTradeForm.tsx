import { FormEvent, useCallback } from 'react';

import {
  ExecutionType,
  MarginMode,
  OrderSide,
  TimeInForce,
  TradeFormType,
} from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useTradeErrors } from '@/hooks/TradingForm/useTradeErrors';
import { TradeFormSource, useTradeForm } from '@/hooks/TradingForm/useTradeForm';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { DropdownMenuTrigger, MobileDropdownMenu } from '@/components/MobileDropdownMenu';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { VerticalSeparator } from '@/components/Separator';
import { Switch } from '@/components/Switch';
import { TradeFormMessages } from '@/views/TradeFormMessages/TradeFormMessages';
import { MarketsMenuDialog } from '@/views/dialogs/MarketsDialog/MarketsDialog';
import { PlaceOrderButtonAndReceipt } from '@/views/forms/TradeForm/PlaceOrderButtonAndReceipt';
import { TradeFormInputs } from '@/views/forms/TradeForm/TradeFormInputs';
import { TradeSizeInputs } from '@/views/forms/TradeForm/TradeSizeInputs';
import { TradeTriggerOrderInputs } from '@/views/forms/TradeForm/TradeTriggerInput';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { tradeFormActions } from '@/state/tradeForm';
import {
  getTradeFormRawState,
  getTradeFormSummary,
  getTradeFormValues,
} from '@/state/tradeFormSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { TradeFormHeaderMobile } from './TradeFormHeader';

const RegularTradeForm = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const rawInput = useAppSelector(getTradeFormRawState);
  const tradeValues = useAppSelector(getTradeFormValues);
  const fullFormSummary = useAppSelector(getTradeFormSummary);
  const { summary } = fullFormSummary;
  const { ticker, tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );
  const effectiveSelectedLeverage = useAppSelector(
    BonsaiHelpers.currentMarket.effectiveSelectedLeverage
  );
  const { stopLossOrder: stopLossSummary, takeProfitOrder: takeProfitSummary } = orEmptyObj(
    summary.triggersSummary
  );

  const { showMarginMode: needsMarginMode, triggerOrdersChecked } = summary.options;

  const isInputFilled =
    [
      rawInput.triggerPrice,
      rawInput.limitPrice,
      rawInput.reduceOnly,
      rawInput.goodTil,
      rawInput.execution,
      rawInput.postOnly,
      rawInput.timeInForce,
    ].some((v) => v != null && v !== '') || (rawInput.size?.value.value.trim() ?? '') !== '';

  const availableBalance = (
    summary.accountDetailsBefore?.account?.freeCollateral ?? BigNumber(0)
  ).toNumber();

  const onLastOrderIndexed = useCallback(() => {}, []);

  const {
    placeOrderError,
    placeOrder,
    tradingUnavailable,
    shouldEnableTrade,
    hasValidationErrors,
  } = useTradeForm({
    source: TradeFormSource.SimpleTradeForm,
    fullFormSummary,
    onLastOrderIndexed,
  });

  const { isErrorShownInOrderStatusToast, primaryAlert, shortAlertKey } = useTradeErrors({
    placeOrderError,
  });

  const {
    type: selectedTradeType,
    stopLossOrder,
    takeProfitOrder,
    reduceOnly,
    marginMode = MarginMode.CROSS,
    side = OrderSide.BUY,
    // isClosingPosition,
  } = tradeValues;

  const setMarginMode = (mode: MarginMode) => {
    dispatch(tradeFormActions.setMarginMode(mode));
  };

  const setTradeSide = (newSide: OrderSide) => {
    dispatch(tradeFormActions.setSide(newSide));
  };

  const openLeverageDialog = () => {
    if (ticker) {
      dispatch(openDialog(DialogTypes.SetMarketLeverage({ marketId: ticker })));
    }
  };

  const onTradeTypeChange = useCallback(
    (tradeType: TradeFormType) => {
      // if (isClosingPosition === true) {
      //   return;
      // }

      dispatch(tradeFormActions.reset());
      dispatch(tradeFormActions.setSide(side));
      dispatch(tradeFormActions.setOrderType(tradeType));

      if (tradeType === TradeFormType.MARKET) {
        dispatch(tradeFormActions.setExecution(ExecutionType.IOC));
      } else {
        dispatch(tradeFormActions.setTimeInForce(TimeInForce.GTT));
      }
    },
    [dispatch, side]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    placeOrder({
      onPlaceOrder: () => {
        dispatch(tradeFormActions.resetPrimaryInputs());
      },
    });
  };

  const orderSideAction = {
    [OrderSide.BUY]: ButtonAction.Create,
    [OrderSide.SELL]: ButtonAction.Destroy,
  }[side];

  return (
    <form tw="flexColumn items-center gap-[0.75em] pb-[12.5rem] pt-0" onSubmit={onSubmit}>
      <TradeFormHeaderMobile />
      <div tw="flexColumn w-full items-center gap-0.75 px-1">
        <div tw="flex h-3 w-full items-center justify-between">
          <div tw="flex h-3">
            <StyledButton
              buttonStyle={ButtonStyle.WithoutBackground}
              $isActive={marginMode === MarginMode.CROSS}
              onClick={() => setMarginMode(MarginMode.CROSS)}
              disabled={!needsMarginMode && marginMode !== MarginMode.CROSS}
            >
              {stringGetter({
                key: STRING_KEYS.CROSS,
              })}
            </StyledButton>
            <VerticalSeparator />
            <StyledButton
              buttonStyle={ButtonStyle.WithoutBackground}
              $isActive={marginMode === MarginMode.ISOLATED}
              onClick={() => setMarginMode(MarginMode.ISOLATED)}
              disabled={!needsMarginMode && marginMode !== MarginMode.ISOLATED}
            >
              {stringGetter({
                key: STRING_KEYS.ISOLATED,
              })}
            </StyledButton>
          </div>

          <Button
            size={ButtonSize.XSmall}
            action={ButtonAction.SimpleSecondary}
            buttonStyle={ButtonStyle.WithoutBackground}
            slotRight={<Icon iconName={IconName.Caret} size="0.75em" tw="text-color-text-0" />}
            onClick={openLeverageDialog}
            tw="h-[37px] w-[66px]"
          >
            <Output
              type={OutputType.Multiple}
              value={effectiveSelectedLeverage}
              fractionDigits={0}
              showSign={ShowSign.None}
              tw="text-color-text-2 font-base-medium"
            />
          </Button>
        </div>
        <div tw="flex w-full gap-0.25 rounded-[0.5em] bg-[#181819] p-[4px]">
          <LongButton
            $isLong={side === OrderSide.BUY}
            onClick={() => setTradeSide(OrderSide.BUY)}
            tw="w-full border-0"
          >
            {stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })}
          </LongButton>
          <ShortButton
            $isShort={side === OrderSide.SELL}
            onClick={() => setTradeSide(OrderSide.SELL)}
            tw="w-full border-0"
          >
            {stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
          </ShortButton>
        </div>
        <MobileDropdownMenu
          withPortal={false}
          align="end"
          items={[
            {
              value: TradeFormType.MARKET,
              active: selectedTradeType === TradeFormType.MARKET,
              label: stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT }),
              onSelect: () => onTradeTypeChange(TradeFormType.MARKET),
            },
            {
              value: TradeFormType.LIMIT,
              active: selectedTradeType === TradeFormType.LIMIT,
              label: stringGetter({ key: STRING_KEYS.LIMIT_ORDER_SHORT }),
              onSelect: () => onTradeTypeChange(TradeFormType.LIMIT),
            },
          ]}
        >
          <DropdownMenuTrigger
            tw="w-full bg-[var(--simpleUi-dialog-secondaryColor)]"
            shape={ButtonShape.Pill}
            size={ButtonSize.Base}
          >
            {selectedTradeType === TradeFormType.MARKET
              ? stringGetter({ key: STRING_KEYS.MARKET_ORDER_SHORT })
              : stringGetter({ key: STRING_KEYS.LIMIT_ORDER_SHORT })}
          </DropdownMenuTrigger>
        </MobileDropdownMenu>
        <AvailableRow>
          <AvailableLabel> Available </AvailableLabel>
          <AvailableValue>
            {availableBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            USDC
          </AvailableValue>
        </AvailableRow>
        <$InputsColumn>
          <TradeFormInputs />
          <TradeSizeInputs />
        </$InputsColumn>
        <ToggleRow>
          <ToggleLabel>Triggers</ToggleLabel>
          <Switch
            name="triggers"
            checked={triggerOrdersChecked}
            onCheckedChange={(checked) =>
              dispatch(checked ? tradeFormActions.showTriggers() : tradeFormActions.hideTriggers())
            }
            tw="font-mini-book"
          />
        </ToggleRow>
        {triggerOrdersChecked && (
          <div tw="max-w-[calc(100vw - 4rem)] column gap-0.5">
            <TradeTriggerOrderInputs
              stringKeys={{
                header: STRING_KEYS.TAKE_PROFIT,
                headerDiff: STRING_KEYS.PROFIT_COLON,
                price: STRING_KEYS.TP_PRICE,
                output: STRING_KEYS.GAIN,
              }}
              inputState={takeProfitOrder ?? {}}
              summaryState={takeProfitSummary ?? {}}
              isStopLoss={false}
              tickSizeDecimals={tickSizeDecimals}
            />
            <TradeTriggerOrderInputs
              stringKeys={{
                header: STRING_KEYS.STOP_LOSS,
                headerDiff: STRING_KEYS.LOSS_COLON,
                price: STRING_KEYS.SL_PRICE,
                output: STRING_KEYS.LOSS,
              }}
              inputState={stopLossOrder ?? {}}
              summaryState={stopLossSummary ?? {}}
              isStopLoss
              tickSizeDecimals={tickSizeDecimals}
            />
          </div>
        )}
        <ToggleRow>
          <ToggleLabel>{stringGetter({ key: STRING_KEYS.REDUCE_ONLY })}</ToggleLabel>
          <Switch
            name="reduce-only"
            checked={!!reduceOnly}
            onCheckedChange={(checked) => dispatch(tradeFormActions.setReduceOnly(checked))}
            tw="font-mini-book"
          />
        </ToggleRow>
        <div
          tw="flexColumn w-full max-w-[calc(100vw-2rem)] gap-1 py-1.25"
          css={{
            background:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--simpleUi-dialog-backgroundColor))',
          }}
        >
          <TradeFormMessages
            isErrorShownInOrderStatusToast={isErrorShownInOrderStatusToast}
            placeOrderError={placeOrderError}
            primaryAlert={primaryAlert}
            shouldPromptUserToPlaceLimitOrder={false}
          />
          {/* {receiptArea} */}
          <$PlaceOrderButtonAndReceipt
            summary={summary}
            actionStringKey={shortAlertKey}
            confirmButtonConfig={{
              stringKey: ORDER_TYPE_STRINGS[selectedTradeType].orderTypeKey,
              buttonTextStringKey: STRING_KEYS.PLACE_ORDER,
              buttonAction: orderSideAction as ButtonAction,
            }}
            hasInput={isInputFilled}
            hasValidationErrors={hasValidationErrors}
            onClearInputs={() => dispatch(tradeFormActions.resetPrimaryInputs())}
            shouldEnableTrade={shouldEnableTrade}
            showDeposit={false}
            tradingUnavailable={tradingUnavailable}
          />
        </div>
      </div>

      <MarketsMenuDialog />
    </form>
  );
};

export default RegularTradeForm;

const StyledButton = styled(Button)<{ $isActive?: boolean }>`
  ${({ $isActive }) =>
    $isActive
      ? `--button-textColor: var(--color-text-2);`
      : `--button-textColor: var(--color-text-0);`}
`;

const LongButton = styled(Button)<{ $isLong?: boolean }>`
  ${({ $isLong }) =>
    $isLong
      ? `--button-textColor: var(--color-green); --button-backgroundColor: var(--color-gradient-positive);`
      : '--button-textColor: var(--color-layer-7); --button-backgroundColor: transparent'}

  border-radius: 0.375rem;
`;

const ShortButton = styled(Button)<{ $isShort?: boolean }>`
  ${({ $isShort }) =>
    $isShort
      ? `--button-textColor: var(--color-red); --button-backgroundColor: var(--color-gradient-negative);`
      : '--button-textColor: var(--color-layer-7); --button-backgroundColor: transparent'}

  border-radius: 0.375rem;
`;

const $InputsColumn = styled.div`
  ${formMixins.inputsColumn}

  width: 100%;
`;

const AvailableRow = styled.div`
  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 8 px 4 px;

  margin-bottom: 8 px;

  width: 100%;
`;
const AvailableLabel = styled.span`
  color: #6b7280;

  font-size: 15 px;
`;
const AvailableValue = styled.div`
  display: flex;

  align-items: center;

  gap: 8 px;

  color: #6b7280;

  font-size: 15 px;
`;

const ToggleRow = styled.div`
  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 0px 0px;

  width: 100%;
`;
const ToggleLabel = styled.span`
  color: #9ca3af;

  font-size: 16 px;

  font-weight: 400;
`;

const $PlaceOrderButtonAndReceipt = styled(PlaceOrderButtonAndReceipt)`
  --withReceipt-backgroundColor: transparent;
`;
