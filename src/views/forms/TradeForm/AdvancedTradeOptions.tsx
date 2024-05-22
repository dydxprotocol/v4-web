import { useEffect } from 'react';

import { type NumberFormatValues } from 'react-number-format';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS, StringKey } from '@/constants/localization';
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

import { getInputTradeData, getInputTradeOptions } from '@/state/inputsSelectors';

import abacusStateManager from '@/lib/abacus';

export const AdvancedTradeOptions = () => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();
  const { complianceState } = useComplianceState();

  const currentTradeFormConfig = useSelector(getInputTradeOptions, shallowEqual);
  const inputTradeData = useSelector(getInputTradeData, shallowEqual);

  const { execution, goodTil, postOnly, reduceOnly, timeInForce } = inputTradeData ?? {};

  const {
    executionOptions,
    needsGoodUntil,
    needsPostOnly,
    needsReduceOnly,
    postOnlyTooltip,
    reduceOnlyTooltip,
    timeInForceOptions,
  } = currentTradeFormConfig ?? {};

  const { duration, unit } = goodTil ?? {};

  const showPostOnly = !!needsPostOnly || !!postOnlyTooltip;
  const showReduceOnly = !!needsReduceOnly || !!reduceOnlyTooltip;

  const needsExecution = !!executionOptions || !!showPostOnly || !!showReduceOnly;
  const hasTimeInForce = timeInForceOptions?.toArray()?.length;

  useEffect(() => {
    if (complianceState === ComplianceStates.CLOSE_ONLY) {
      abacusStateManager.setTradeValue({
        value: true,
        field: TradeInputField.reduceOnly,
      });
    }
  }, [complianceState]);

  return (
    <$Collapsible
      defaultOpen={!isTablet}
      label={stringGetter({ key: STRING_KEYS.ADVANCED })}
      triggerIconSide="right"
      fullWidth
    >
      <$AdvancedInputsContainer>
        {(hasTimeInForce || needsGoodUntil) && (
          <$AdvancedInputsRow>
            {hasTimeInForce && timeInForce != null && (
              <$SelectMenu
                value={timeInForce}
                onValueChange={(selectedTimeInForceOption: string) =>
                  abacusStateManager.setTradeValue({
                    value: selectedTimeInForceOption,
                    field: TradeInputField.timeInForceType,
                  })
                }
                label={stringGetter({ key: STRING_KEYS.TIME_IN_FORCE })}
              >
                {timeInForceOptions.toArray().map(({ type, stringKey }) => (
                  <$SelectItem
                    key={type}
                    value={type}
                    label={stringGetter({ key: stringKey as StringKey })}
                  />
                ))}
              </$SelectMenu>
            )}
            {needsGoodUntil && (
              <$FormInput
                id="trade-good-til-time"
                type={InputType.Number}
                decimals={INTEGER_DECIMALS}
                label={stringGetter({
                  key: hasTimeInForce ? STRING_KEYS.TIME : STRING_KEYS.GOOD_TIL_TIME,
                })}
                onChange={({ value }: NumberFormatValues) => {
                  abacusStateManager.setTradeValue({
                    value: Number(value),
                    field: TradeInputField.goodTilDuration,
                  });
                }}
                value={duration ?? ''}
                slotRight={
                  unit != null && (
                    <$InnerSelectMenu
                      value={unit}
                      onValueChange={(goodTilTimeTimescale: string) => {
                        abacusStateManager.setTradeValue({
                          value: goodTilTimeTimescale,
                          field: TradeInputField.goodTilUnit,
                        });
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
            {executionOptions && execution != null && (
              <$SelectMenu
                value={execution}
                label={stringGetter({ key: STRING_KEYS.EXECUTION })}
                onValueChange={(selectedTimeInForceOption: string) =>
                  abacusStateManager.setTradeValue({
                    value: selectedTimeInForceOption,
                    field: TradeInputField.execution,
                  })
                }
              >
                {executionOptions.toArray().map(({ type, stringKey }) => (
                  <$SelectItem
                    key={type}
                    value={type}
                    label={stringGetter({ key: stringKey as StringKey })}
                  />
                ))}
              </$SelectMenu>
            )}
            {showReduceOnly && (
              <Checkbox
                checked={
                  (reduceOnly && !reduceOnlyTooltip) ||
                  complianceState === ComplianceStates.CLOSE_ONLY ||
                  false
                }
                disabled={!!reduceOnlyTooltip || complianceState === ComplianceStates.CLOSE_ONLY}
                onCheckedChange={(checked) =>
                  abacusStateManager.setTradeValue({
                    value: checked,
                    field: TradeInputField.reduceOnly,
                  })
                }
                id="reduce-only"
                label={
                  <WithTooltip
                    tooltip={
                      needsReduceOnly
                        ? 'reduce-only'
                        : reduceOnlyTooltip?.titleStringKey.includes(
                            'REDUCE_ONLY_EXECUTION_IOC_FOK'
                          )
                        ? 'reduce-only-execution-ioc-fok'
                        : 'reduce-only-timeinforce-ioc-fok'
                    }
                    side="right"
                  >
                    {stringGetter({ key: STRING_KEYS.REDUCE_ONLY })}
                  </WithTooltip>
                }
              />
            )}
            {showPostOnly && (
              <Checkbox
                checked={(postOnly && !postOnlyTooltip) || false}
                disabled={!!postOnlyTooltip}
                onCheckedChange={(checked) =>
                  abacusStateManager.setTradeValue({
                    value: checked,
                    field: TradeInputField.postOnly,
                  })
                }
                id="post-only"
                label={
                  <WithTooltip
                    tooltip={needsPostOnly ? 'post-only' : 'post-only-timeinforce-gtt'}
                    side="right"
                  >
                    {stringGetter({ key: STRING_KEYS.POST_ONLY })}
                  </WithTooltip>
                }
              />
            )}
          </>
        )}
      </$AdvancedInputsContainer>
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

const $AdvancedInputsContainer = styled.div`
  display: grid;
  gap: var(--form-input-gap);
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
