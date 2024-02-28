import { useEffect, useState } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TradeSizeInput } from '@/constants/trade';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { WithTooltip } from '@/components/WithTooltip';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { setTradeFormInputs } from '@/state/inputs';
import {
  getInputTradeOptions,
  getInputTradeSizeData,
  getTradeFormInputs,
} from '@/state/inputsSelectors';
import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { MarketLeverageInput } from './MarketLeverageInput';

export const TradeSizeInputs = () => {
  const [showUSDCInputOnTablet, setShowUSDCInputOnTablet] = useState(false);
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const { id } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};
  const inputTradeSizeData = useSelector(getInputTradeSizeData, shallowEqual);
  const currentTradeInputOptions = useSelector(getInputTradeOptions, shallowEqual);

  const { stepSizeDecimals, tickSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) || {};
  const { size, usdcSize, leverage, input: lastEditedInput } = inputTradeSizeData || {};
  const { needsLeverage } = currentTradeInputOptions || {};
  const decimals = stepSizeDecimals ?? TOKEN_DECIMALS;

  const { amountInput, usdAmountInput, leverageInput } = useSelector(
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
  }, [size, usdcSize, leverage, lastEditedInput]);

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
    const newUsdcAmount = MustBigNumber(floatValue).toFixed(tickSizeDecimals || USD_DECIMALS);

    abacusStateManager.setTradeValue({
      value: formattedValue === '' || newUsdcAmount === 'NaN' ? null : newUsdcAmount,
      field: TradeInputField.usdcSize,
    });
  };

  const inputToggleButton = (
    <$ToggleButton
      isPressed={showUSDCInputOnTablet}
      onPressedChange={setShowUSDCInputOnTablet}
      size={ButtonSize.XSmall}
      shape={ButtonShape.Square}
    >
      <Icon iconName={IconName.Trade} />
      {showUSDCInputOnTablet ? 'USD' : id}
    </$ToggleButton>
  );

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
      slotRight={isTablet && inputToggleButton}
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
      slotRight={isTablet && inputToggleButton}
    />
  );

  return (
    <$Column>
      {isTablet ? (
        showUSDCInputOnTablet ? (
          usdcInput
        ) : (
          sizeInput
        )
      ) : (
        <$Row>
          {sizeInput}
          {usdcInput}
        </$Row>
      )}

      {needsLeverage && (
        <MarketLeverageInput
          leverageInputValue={leverageInput}
          setLeverageInputValue={(value: string) =>
            dispatch(setTradeFormInputs({ leverageInput: value }))
          }
        />
      )}
    </$Column>
  );
};
const $Column = styled.div`
  ${layoutMixins.flexColumn}
  gap: var(--form-input-gap);
`;

const $Row = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;

const $ToggleButton = styled(ToggleButton)`
  ${formMixins.inputInnerToggleButton}
  --button-font: var(--font-tiny-book);
  --button-height: 2.25rem;

  ${layoutMixins.flexColumn}
  gap: 1px;

  svg {
    color: var(--color-text-0);
    rotate: 0.25turn;
    margin-top: 2px;
  }
`;
