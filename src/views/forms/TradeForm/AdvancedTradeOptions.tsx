import { useEffect } from 'react';

import { ExecutionType, TimeInForce, TimeUnit } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { type NumberFormatValues } from 'react-number-format';
import styled from 'styled-components';

import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { INTEGER_DECIMALS } from '@/constants/numbers';
import { TimeUnitShort } from '@/constants/time';
import { GOOD_TIL_TIME_TIMESCALE_STRINGS } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Checkbox } from '@/components/Checkbox';
import { Collapsible } from '@/components/Collapsible';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { SelectItem, SelectMenu } from '@/components/SelectMenu';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { TradeTriggerOrderInputs } from './TradeTriggerInput';

export const AdvancedTradeOptions = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const currentTradeFormSummary = useAppSelector(getTradeFormSummary).summary;
  const currentTradeFormConfig = currentTradeFormSummary.options;
  const inputTradeData = useAppSelector(getTradeFormValues);
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const { execution, goodTil, postOnly, reduceOnly, timeInForce, stopLossOrder, takeProfitOrder } =
    inputTradeData;
  const { stopLossOrder: stopLossSummary, takeProfitOrder: takeProfitSummary } = orEmptyObj(
    currentTradeFormSummary.triggersSummary
  );

  const {
    executionOptions,
    timeInForceOptions,

    showReduceOnly,
    showPostOnly,
    showGoodTil,

    showPostOnlyTooltip,
    showReduceOnlyTooltip,

    showTriggerOrders,
    triggerOrdersChecked,
  } = currentTradeFormConfig;

  const { duration, unit } = goodTil ?? {};

  const shouldShowPostOnly = showPostOnly || showPostOnlyTooltip;
  const shouldShowReduceOnly = showReduceOnly || showReduceOnlyTooltip;

  const needsExecution =
    (executionOptions.length > 0 && execution != null) ||
    shouldShowPostOnly ||
    shouldShowReduceOnly;
  const hasTimeInForce = timeInForceOptions.length > 0;
  const needsTimeRow = showGoodTil || (hasTimeInForce && timeInForce != null);
  const needsTriggers = showTriggerOrders;
  useEffect(() => {
    if (complianceState === ComplianceStates.CLOSE_ONLY) {
      dispatch(tradeFormActions.setReduceOnly(true));
    }
  }, [complianceState, dispatch]);

  const necessary = needsTimeRow || needsExecution || needsTriggers;
  if (!necessary) {
    return undefined;
  }

  return (
    <$Collapsible
      defaultOpen={!isTablet}
      label={stringGetter({ key: STRING_KEYS.ADVANCED })}
      triggerIconSide="right"
      fullWidth
    >
      <div tw="grid gap-[--form-input-gap]">
        {needsTimeRow && (
          <$AdvancedInputsRow>
            {hasTimeInForce && timeInForce != null && (
              <$SelectMenu
                value={timeInForce}
                onValueChange={(selectedTimeInForceOption: string) => {
                  if (!selectedTimeInForceOption) {
                    return;
                  }
                  dispatch(
                    tradeFormActions.setTimeInForce(selectedTimeInForceOption as TimeInForce)
                  );
                }}
                label={stringGetter({ key: STRING_KEYS.TIME_IN_FORCE })}
              >
                {timeInForceOptions.map(({ value, stringKey }) => (
                  <$SelectItem key={value} value={value} label={stringGetter({ key: stringKey })} />
                ))}
              </$SelectMenu>
            )}
            {showGoodTil && (
              <$FormInput
                id="trade-good-til-time"
                type={InputType.Number}
                decimals={INTEGER_DECIMALS}
                label={stringGetter({
                  key: hasTimeInForce ? STRING_KEYS.TIME : STRING_KEYS.GOOD_TIL_TIME,
                })}
                onChange={({ value }: NumberFormatValues) => {
                  dispatch(
                    tradeFormActions.setGoodTilTime({ duration: value, unit: unit ?? TimeUnit.DAY })
                  );
                }}
                value={duration ?? ''}
                slotRight={
                  unit != null && (
                    <$InnerSelectMenu
                      value={unit}
                      onValueChange={(goodTilTimeTimescale: string) => {
                        if (!goodTilTimeTimescale) {
                          return;
                        }
                        dispatch(
                          tradeFormActions.setGoodTilTime({
                            duration: duration ?? '',
                            unit: goodTilTimeTimescale as TimeUnit,
                          })
                        );
                      }}
                    >
                      {Object.values(TimeUnitShort).map((goodTilTimeTimescale: TimeUnitShort) => (
                        <$InnerSelectItem
                          key={goodTilTimeTimescale}
                          value={goodTilTimeTimescale}
                          label={stringGetter({
                            key: GOOD_TIL_TIME_TIMESCALE_STRINGS[goodTilTimeTimescale],
                          })}
                        />
                      ))}
                    </$InnerSelectMenu>
                  )
                }
              />
            )}
          </$AdvancedInputsRow>
        )}
        {needsExecution && (
          <>
            {executionOptions.length > 0 && execution != null && (
              <$SelectMenu
                value={execution}
                label={stringGetter({ key: STRING_KEYS.EXECUTION })}
                onValueChange={(selectedExecution: string) => {
                  if (!selectedExecution) {
                    return;
                  }
                  dispatch(tradeFormActions.setExecution(selectedExecution as ExecutionType));
                }}
              >
                {executionOptions.map(({ value, stringKey }) => (
                  <$SelectItem key={value} value={value} label={stringGetter({ key: stringKey })} />
                ))}
              </$SelectMenu>
            )}
            {shouldShowReduceOnly && (
              <Checkbox
                checked={!!reduceOnly}
                disabled={showReduceOnlyTooltip || complianceState === ComplianceStates.CLOSE_ONLY}
                onCheckedChange={(checked) => dispatch(tradeFormActions.setReduceOnly(checked))}
                id="reduce-only"
                label={
                  <WithTooltip
                    tooltip={showReduceOnly ? 'reduce-only' : 'reduce-only-timeinforce-ioc'}
                    side="right"
                  >
                    {stringGetter({ key: STRING_KEYS.REDUCE_ONLY })}
                  </WithTooltip>
                }
              />
            )}
            {shouldShowPostOnly && (
              <Checkbox
                checked={!!postOnly}
                disabled={showPostOnlyTooltip}
                onCheckedChange={(checked) => dispatch(tradeFormActions.setPostOnly(checked))}
                id="post-only"
                label={
                  <WithTooltip
                    tooltip={showPostOnly ? 'post-only' : 'post-only-timeinforce-gtt'}
                    side="right"
                  >
                    {stringGetter({ key: STRING_KEYS.POST_ONLY })}
                  </WithTooltip>
                }
              />
            )}
          </>
        )}
        {needsTriggers && (
          <div tw="column gap-0.5">
            <Checkbox
              checked={!!triggerOrdersChecked}
              disabled={false}
              onCheckedChange={(checked) =>
                dispatch(
                  checked ? tradeFormActions.showTriggers() : tradeFormActions.hideTriggers()
                )
              }
              id="show-trigger-orders"
              label={stringGetter({ key: STRING_KEYS.TAKE_PROFIT_STOP_LOSS })}
            />
            {triggerOrdersChecked && (
              <div tw="column gap-0.5">
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
          </div>
        )}
      </div>
    </$Collapsible>
  );
};
const $Collapsible = styled(Collapsible)`
  --trigger-backgroundColor: transparent;
  --trigger-open-backgroundColor: transparent;
  --trigger-textColor: var(--color-text-0);
  --trigger-open-textColor: var(--color-text-0);
  --trigger-padding: 0.75rem 0;

  font: var(--font-small-book);
  outline: none;

  margin: -0.5rem 0;
`;
const $SelectMenu = styled(SelectMenu)`
  ${formMixins.inputSelectMenu}
`;

const $InnerSelectMenu = styled(SelectMenu)`
  ${formMixins.inputInnerSelectMenu}
  --select-menu-trigger-maxWidth: 4rem;
` as typeof SelectMenu;

const $SelectItem = styled(SelectItem)`
  ${formMixins.inputSelectMenuItem}
` as typeof SelectItem;

const $InnerSelectItem = styled(SelectItem)`
  ${formMixins.inputInnerSelectMenuItem}
`;

const $AdvancedInputsRow = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;

const $FormInput = styled(FormInput)`
  input {
    margin-right: 4rem;
  }
`;
