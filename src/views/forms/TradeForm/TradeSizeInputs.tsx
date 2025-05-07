import { useCallback, useMemo } from 'react';

import { OrderSizeInputs } from '@/bonsai/forms/trade/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { debounce } from 'lodash';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { NORMAL_DEBOUNCE_MS } from '@/constants/debounce';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TooltipStringKeys } from '@/constants/tooltips';
import { DisplayUnit } from '@/constants/trade';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { DisplayUnitTag } from '@/components/DisplayUnitTag';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType, formatNumberOutput } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { tradeFormActions } from '@/state/tradeForm';
import { getTradeFormSummary, getTradeFormValues } from '@/state/tradeFormSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { AttemptBigNumber, MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { AmountCloseInput } from './AmountCloseInput';
import { MarketLeverageInput } from './MarketLeverageInput';
import { TargetLeverageInput } from './TargetLeverageInput';

export const TradeSizeInputs = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();

  const selectedLocale = useAppSelector(getSelectedLocale);
  const tradeValues = useAppSelector(getTradeFormValues);
  const tradeSummary = useAppSelector(getTradeFormSummary).summary;

  const { stepSizeDecimals, assetId, displayableAsset } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const effectiveSizes = orEmptyObj(tradeSummary.tradeInfo.inputSummary.size);

  const { showLeverage, showTargetLeverage, showAmountClose } = tradeSummary.options;

  const decimals = stepSizeDecimals ?? TOKEN_DECIMALS;

  const onSizeInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    dispatch(tradeFormActions.setSizeToken(formattedValue));
  };

  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const showUSDInput = displayUnit === DisplayUnit.Fiat;

  const onUSDCInput = ({ formattedValue }: { floatValue?: number; formattedValue: string }) => {
    dispatch(tradeFormActions.setSizeUsd(formattedValue));
  };

  const dispatchSetDisplayUnit = useMemo(
    () =>
      debounce((newDisplayUnit: DisplayUnit) => {
        if (!assetId) return;
        dispatch(setDisplayUnit({ newDisplayUnit, entryPoint: 'tradeAmountInput', assetId }));
      }, NORMAL_DEBOUNCE_MS),
    [assetId, dispatch]
  );

  const onUsdcToggle = useCallback(
    (isPressed: boolean) => {
      const newDisplayUnit = isPressed ? DisplayUnit.Fiat : DisplayUnit.Asset;
      dispatchSetDisplayUnit(newDisplayUnit);
    },
    [dispatchSetDisplayUnit]
  );

  const inputToggleButton = () => {
    const conversionText =
      !showUSDInput && effectiveSizes.usdcSize != null ? (
        <$Conversion>{`≈ ${formatNumberOutput(effectiveSizes.usdcSize, OutputType.Fiat, { decimalSeparator, groupSeparator, selectedLocale })}`}</$Conversion>
      ) : showUSDInput && effectiveSizes.size != null ? (
        <$Conversion>
          ≈{' '}
          {formatNumberOutput(effectiveSizes.size, OutputType.Asset, {
            decimalSeparator,
            groupSeparator,
            selectedLocale,
            fractionDigits: decimals,
          })}{' '}
          {displayableAsset && <Tag tw="ml-0.25">{displayableAsset}</Tag>}
        </$Conversion>
      ) : undefined;

    const toggleButton = (
      <$ToggleButton
        isPressed={showUSDInput}
        onPressedChange={onUsdcToggle}
        size={ButtonSize.XSmall}
        shape={ButtonShape.Square}
      >
        <Icon iconName={IconName.Trade} />
      </$ToggleButton>
    );

    const conversionContainer = (
      <div
        tw="pointer-events-none absolute z-10 select-none text-nowrap pr-0.5 font-small-book"
        style={{ right: '100%' }}
      >
        {conversionText}
      </div>
    );
    return (
      <div tw="row relative gap-0.5">
        {conversionText ? (
          <>
            {conversionContainer}
            {toggleButton}
          </>
        ) : (
          toggleButton
        )}
      </div>
    );
  };

  const inputConfig = {
    [DisplayUnit.Asset]: {
      onInput: onSizeInput,
      type: InputType.Number,
      tooltipId: 'order-amount',
      decimals,
      value:
        tradeValues.size != null && OrderSizeInputs.is.SIZE(tradeValues.size)
          ? tradeValues.size.value.value
          : tradeValues.size == null || tradeValues.size.value.value === ''
            ? ''
            : AttemptBigNumber(effectiveSizes.size)?.toFixed(decimals) ?? '',
    },
    [DisplayUnit.Fiat]: {
      onInput: onUSDCInput,
      type: InputType.Currency,
      tooltipId: 'order-amount-usd',
      decimals: USD_DECIMALS,
      value:
        tradeValues.size != null && OrderSizeInputs.is.USDC_SIZE(tradeValues.size)
          ? tradeValues.size.value.value
          : tradeValues.size == null || tradeValues.size.value.value === ''
            ? ''
            : AttemptBigNumber(effectiveSizes.usdcSize)?.toFixed(USD_DECIMALS) ?? '',
    },
  }[displayUnit];

  const sizeInput = (
    <FormInput
      id="trade-amount"
      decimals={inputConfig.decimals}
      onInput={inputConfig.onInput}
      label={
        <>
          <WithTooltip
            tooltip={inputConfig.tooltipId as TooltipStringKeys}
            stringParams={{ SYMBOL: getDisplayableAssetFromBaseAsset(assetId) }}
            side="right"
          >
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
          </WithTooltip>
          {assetId && <DisplayUnitTag assetId={assetId} entryPoint="tradeAmountInputAssetTag" />}
        </>
      }
      slotRight={inputToggleButton()}
      type={inputConfig.type}
      value={inputConfig.value ?? ''}
    />
  );

  return (
    <div tw="flexColumn gap-[--form-input-gap]">
      {sizeInput}
      {showLeverage && (
        <MarketLeverageInput
          leftLeverage={tradeSummary.tradeInfo.minimumSignedLeverage}
          rightLeverage={tradeSummary.tradeInfo.maximumSignedLeverage}
          leverageInputValue={
            tradeValues.size != null &&
            OrderSizeInputs.is.SIGNED_POSITION_LEVERAGE(tradeValues.size)
              ? tradeValues.size.value.value
              : effectiveSizes.leverageSigned != null
                ? MustBigNumber(effectiveSizes.leverageSigned).toString(10)
                : MustBigNumber(tradeSummary.tradeInfo.minimumSignedLeverage).toString(10)
          }
          setLeverageInputValue={(value: string) => {
            dispatch(tradeFormActions.setSizeLeverageSigned(value));
          }}
        />
      )}
      {showTargetLeverage && <TargetLeverageInput />}
      {showAmountClose && (
        <AmountCloseInput
          amountClosePercentInput={(tradeValues.size != null &&
          OrderSizeInputs.is.AVAILABLE_PERCENT(tradeValues.size)
            ? AttemptBigNumber(tradeValues.size.value.value)
            : AttemptBigNumber(
                mapIfPresent(
                  effectiveSizes.size,
                  tradeSummary.accountDetailsBefore?.position?.unsignedSize.toNumber(),
                  (tSize, positionSize) => (positionSize > 0 ? tSize / positionSize : 0)
                )
              )
          )
            ?.times(100)
            .toFixed(0)}
          setAmountCloseInput={(value: string | undefined) => {
            dispatch(
              tradeFormActions.setSizeAvailablePercent(
                mapIfPresent(value, (v) => MaybeBigNumber(v)?.div(100).toFixed(2)) ?? ''
              )
            );
          }}
        />
      )}
    </div>
  );
};
const $ToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}
  --button-font: var(--font-base-book);
  --button-height: 2.25rem;

  ${layoutMixins.flexColumn}
  gap: 1px;

  svg {
    color: var(--color-text-1);
    rotate: 0.25turn;
    margin-top: 2px;
  }
`;

const $Conversion = tw.div`inline-flex`;
