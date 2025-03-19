import { useCallback, useEffect } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { debounce } from 'lodash';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';

import { TradeInputField } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { NORMAL_DEBOUNCE_MS } from '@/constants/debounce';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TooltipStringKeys } from '@/constants/tooltips';
import { DisplayUnit, TradeSizeInput } from '@/constants/trade';

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

import { getIsAccountConnected } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setDisplayUnit } from '@/state/appUiConfigs';
import { getSelectedDisplayUnit } from '@/state/appUiConfigsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import {
  getInputTradeOptions,
  getInputTradeSizeData,
  getTradeFormInputs,
} from '@/state/inputsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import abacusStateManager from '@/lib/abacus';
import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

import { MarketLeverageInput } from './MarketLeverageInput';
import { TargetLeverageInput } from './TargetLeverageInput';
import { TradePercentSizeToggle } from './TradePercentSizeToggle';

export const TradeSizeInputs = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();

  const inputTradeSizeData = useAppSelector(getInputTradeSizeData, shallowEqual);
  const currentTradeInputOptions = useAppSelector(getInputTradeOptions, shallowEqual);
  const selectedLocale = useAppSelector(getSelectedLocale);

  const { stepSizeDecimals, tickSizeDecimals, assetId, displayableAsset } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const {
    size,
    usdcSize,
    leverage,
    balancePercent,
    input: lastEditedInput,
  } = inputTradeSizeData ?? {};
  const { needsBalancePercent, needsLeverage, needsTargetLeverage } =
    currentTradeInputOptions ?? {};
  const decimals = stepSizeDecimals ?? TOKEN_DECIMALS;

  const { amountInput, usdAmountInput, leverageInput, balancePercentInput } = useAppSelector(
    getTradeFormInputs,
    shallowEqual
  );

  const isAccountConnected = useAppSelector(getIsAccountConnected);

  useEffect(() => {
    // reset size inputs since abacus size is not properly synced/edited before account connection
    abacusStateManager.clearTradeInputSizeValues();
  }, [isAccountConnected]);

  // Update State variables if their inputs are not being source of calculations
  // Or if they have been reset to null
  useEffect(() => {
    if (lastEditedInput !== TradeSizeInput.Size || size == null) {
      dispatch(setTradeFormInputs({ amountInput: size ? size.toString() : '' }));
    }
    if (lastEditedInput !== TradeSizeInput.Usdc || usdcSize == null) {
      dispatch(setTradeFormInputs({ usdAmountInput: usdcSize ? usdcSize.toString() : '' }));
    }
    if (lastEditedInput !== TradeSizeInput.Leverage || leverage == null) {
      dispatch(setTradeFormInputs({ leverageInput: leverage ? leverage.toString() : '' }));
    }
    if (lastEditedInput !== TradeSizeInput.BalancePercent || balancePercent == null) {
      dispatch(
        setTradeFormInputs({
          balancePercentInput: balancePercent ? balancePercent.toString() : '',
        })
      );
    }
  }, [size, usdcSize, leverage, balancePercent, lastEditedInput, dispatch]);

  const onSizeInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    dispatch(setTradeFormInputs({ amountInput: formattedValue }));
    const newAmount = MustBigNumber(floatValue).toFixed(decimals);

    abacusStateManager.setTradeValue({
      value: formattedValue === '' || newAmount === 'NaN' ? null : newAmount,
      field: TradeInputField.size,
    });
  };

  const displayUnit = useAppSelector(getSelectedDisplayUnit);
  const showUSDInput = displayUnit === DisplayUnit.Fiat;

  const onUSDCInput = ({
    floatValue,
    formattedValue,
  }: {
    floatValue?: number;
    formattedValue: string;
  }) => {
    dispatch(setTradeFormInputs({ usdAmountInput: formattedValue }));
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const newUsdcAmount = MustBigNumber(floatValue).toFixed(tickSizeDecimals || USD_DECIMALS);

    abacusStateManager.setTradeValue({
      value: formattedValue === '' || newUsdcAmount === 'NaN' ? null : newUsdcAmount,
      field: TradeInputField.usdcSize,
    });
  };

  const dispatchSetDisplayUnit = debounce((newDisplayUnit) => {
    if (!assetId) return;
    dispatch(setDisplayUnit({ newDisplayUnit, entryPoint: 'tradeAmountInput', assetId }));
  }, NORMAL_DEBOUNCE_MS);

  const onUsdcToggle = useCallback(
    (isPressed: boolean) => {
      const newDisplayUnit = isPressed ? DisplayUnit.Fiat : DisplayUnit.Asset;
      dispatchSetDisplayUnit(newDisplayUnit);
    },
    [dispatchSetDisplayUnit]
  );

  useEffect(() => {
    // when display unit is toggled globally, set the last input to the corresponding unit for calculation
    abacusStateManager.setTradeValue({
      field: TradeInputField.lastInput,
      value: showUSDInput ? TradeInputField.usdcSize.rawValue : TradeInputField.size.rawValue,
    });
  }, [showUSDInput]);

  const inputToggleButton = () => {
    const conversionText =
      !showUSDInput && usdAmountInput ? (
        <$Conversion>{`≈ ${formatNumberOutput(usdAmountInput, OutputType.Fiat, { decimalSeparator, groupSeparator, selectedLocale })}`}</$Conversion>
      ) : showUSDInput && amountInput ? (
        <$Conversion>
          ≈ {amountInput} {displayableAsset && <Tag tw="ml-0.25">{displayableAsset}</Tag>}
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
      value: amountInput,
    },
    [DisplayUnit.Fiat]: {
      onInput: onUSDCInput,
      type: InputType.Currency,
      tooltipId: 'order-amount-usd',
      value: usdAmountInput,
    },
  }[displayUnit];

  const sizeInput = (
    <FormInput
      id="trade-amount"
      decimals={decimals}
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
      value={inputConfig.value || ''}
    />
  );

  return (
    <div tw="flexColumn gap-[--form-input-gap]">
      {sizeInput}
      {needsLeverage && (
        <MarketLeverageInput
          leverageInputValue={leverageInput}
          setLeverageInputValue={(value: string) =>
            dispatch(setTradeFormInputs({ leverageInput: value }))
          }
        />
      )}
      {needsTargetLeverage && <TargetLeverageInput />}

      {needsBalancePercent && (
        <TradePercentSizeToggle
          balancePercentValue={balancePercentInput}
          setBalancePercentInputValue={(value: string) =>
            dispatch(setTradeFormInputs({ balancePercentInput: value }))
          }
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
