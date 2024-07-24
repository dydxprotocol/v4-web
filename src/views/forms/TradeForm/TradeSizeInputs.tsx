import { useCallback, useEffect, useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import tw from 'twin.macro';

import { TradeInputField } from '@/constants/abacus';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TradeSizeInput } from '@/constants/trade';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { OutputType, formatNumberOutput } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import {
  getInputTradeOptions,
  getInputTradeSizeData,
  getTradeFormInputs,
} from '@/state/inputsSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { track } from '@/lib/analytics';
import { MustBigNumber } from '@/lib/numbers';

import { MarketLeverageInput } from './MarketLeverageInput';

export const TradeSizeInputs = () => {
  const [showUSDCInput, setShowUSDCInput] = useState(false);
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { decimal: decimalSeparator, group: groupSeparator } = useLocaleSeparators();

  const { id } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const inputTradeSizeData = useAppSelector(getInputTradeSizeData, shallowEqual);
  const currentTradeInputOptions = useAppSelector(getInputTradeOptions, shallowEqual);
  const selectedLocale = useAppSelector(getSelectedLocale);

  const { stepSizeDecimals, tickSizeDecimals } =
    useAppSelector(getCurrentMarketConfig, shallowEqual) ?? {};
  const { size, usdcSize, leverage, input: lastEditedInput } = inputTradeSizeData ?? {};
  const { needsLeverage } = currentTradeInputOptions ?? {};
  const decimals = stepSizeDecimals ?? TOKEN_DECIMALS;

  const { amountInput, usdAmountInput, leverageInput } = useAppSelector(
    getTradeFormInputs,
    shallowEqual
  );

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
  }, [size, usdcSize, leverage, lastEditedInput, dispatch]);

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

  const onUsdcToggle = useCallback(
    (isPressed: boolean) => {
      setShowUSDCInput(isPressed);
      abacusStateManager.setTradeValue({
        field: TradeInputField.lastInput,
        value: isPressed ? TradeInputField.usdcSize.rawValue : TradeInputField.size.rawValue,
      });

      track(
        AnalyticsEvents.TradeAmountToggleClick({
          newInput: isPressed ? TradeSizeInput.Usdc : TradeSizeInput.Size,
          market: id ?? '',
        })
      );
    },
    [id]
  );

  const inputToggleButton = () => {
    const slotTooltip =
      !showUSDCInput && usdAmountInput ? (
        <$Tooltip>{`≈ ${formatNumberOutput(usdAmountInput, OutputType.Fiat, { decimalSeparator, groupSeparator, selectedLocale })}`}</$Tooltip>
      ) : showUSDCInput && amountInput ? (
        <$Tooltip>
          ≈ {amountInput} {id && <Tag>{id}</Tag>}
        </$Tooltip>
      ) : undefined;

    const toggleButton = (
      <$ToggleButton
        isPressed={showUSDCInput}
        onPressedChange={onUsdcToggle}
        size={ButtonSize.XSmall}
        shape={ButtonShape.Square}
      >
        <Icon iconName={IconName.Trade} />
      </$ToggleButton>
    );

    return slotTooltip ? (
      <WithTooltip slotTooltip={slotTooltip} side="left" align="center">
        {toggleButton}
      </WithTooltip>
    ) : (
      toggleButton
    );
  };

  const sizeInput = (
    <FormInput
      id="trade-amount"
      decimals={decimals}
      onInput={onSizeInput}
      label={
        <>
          <WithTooltip tooltip="order-amount" stringParams={{ SYMBOL: id ?? '' }} side="right">
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
          </WithTooltip>
          {id && <Tag>{id}</Tag>}
        </>
      }
      slotRight={inputToggleButton()}
      type={InputType.Number}
      value={amountInput || ''}
    />
  );

  const usdcInput = (
    <FormInput
      id="trade-usdc"
      onInput={onUSDCInput}
      type={InputType.Currency}
      value={usdAmountInput || ''}
      decimals={tickSizeDecimals ?? USD_DECIMALS}
      label={
        <>
          <WithTooltip tooltip="order-amount-usd" stringParams={{ SYMBOL: id ?? '' }} side="right">
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      }
      slotRight={inputToggleButton()}
    />
  );

  return (
    <div tw="gap-[var(--form-input-gap)] flexColumn">
      {showUSDCInput ? usdcInput : sizeInput}
      {needsLeverage && (
        <MarketLeverageInput
          leverageInputValue={leverageInput}
          setLeverageInputValue={(value: string) =>
            dispatch(setTradeFormInputs({ leverageInput: value }))
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

const $Tooltip = tw.div`inline-flex`;
