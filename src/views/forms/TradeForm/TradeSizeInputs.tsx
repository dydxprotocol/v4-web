import { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TradeSizeInput } from '@/constants/trade';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';
import { formMixins } from '@/styles/formMixins';

import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Tag } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';
import { Icon, IconName } from '@/components/Icon';
import { ToggleButton } from '@/components/ToggleButton';

import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

import { getInputTradeSizeData, getInputTradeOptions } from '@/state/inputsSelectors';

import { getCurrentMarketConfig } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { MarketLeverageInput } from './MarketLeverageInput';

export const TradeSizeInputs = () => {
  const [sizeInputValue, setSizeInputValue] = useState<number | null>();
  const [usdcInputValue, setUsdcInputValue] = useState<number | null>();
  const [leverageInputValue, setLeverageInputValue] = useState<number | null>();

  const [showUSDCInputOnTablet, setShowUSDCInputOnTablet] = useState(false);

  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  const { symbol } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};
  const inputTradeSizeData = useSelector(getInputTradeSizeData, shallowEqual);
  const currentTradeInputOptions = useSelector(getInputTradeOptions, shallowEqual);

  const { stepSizeDecimals, tickSizeDecimals } =
    useSelector(getCurrentMarketConfig, shallowEqual) || {};
  const { size, usdcSize, leverage, input: lastEditedInput } = inputTradeSizeData || {};
  const { needsLeverage } = currentTradeInputOptions || {};
  const decimals = stepSizeDecimals || TOKEN_DECIMALS;

  // Update State variables if their inputs are not being source of calculations
  // Or if they have been reset to null
  useEffect(() => {
    if (lastEditedInput !== TradeSizeInput.Size || size == null) {
      // Abacus size already respects step size
      // using .toFixed to prevent trailing zeros and exponential notation
      setSizeInputValue(size);
    }
    if (lastEditedInput !== TradeSizeInput.Usdc || usdcSize == null) {
      setUsdcInputValue(usdcSize);
    }
    if (lastEditedInput !== TradeSizeInput.Leverage || leverage == null) {
      setLeverageInputValue(leverage);
    }
  }, [size, usdcSize, leverage, lastEditedInput]);

  const onSizeInput = ({ value, floatValue }: { value: string; floatValue?: number }) => {
    setSizeInputValue(floatValue);
    const newAmount = MustBigNumber(floatValue).toFixed(decimals);

    abacusStateManager.setTradeValue({
      value: value === '' || newAmount === 'NaN' ? null : newAmount,
      field: TradeInputField.size,
    });
  };

  const onUSDCInput = ({ value, floatValue }: { value: string; floatValue?: number }) => {
    setUsdcInputValue(floatValue);
    const newUsdcAmount = MustBigNumber(floatValue).toFixed();

    abacusStateManager.setTradeValue({
      value: value === '' || newUsdcAmount === 'NaN' ? null : newUsdcAmount,
      field: TradeInputField.usdcSize,
    });
  };

  const inputToggleButton = (
    <Styled.ToggleButton
      isPressed={showUSDCInputOnTablet}
      onPressedChange={setShowUSDCInputOnTablet}
      size={ButtonSize.XSmall}
      shape={ButtonShape.Square}
    >
      <Icon iconName={IconName.Trade} />
      {showUSDCInputOnTablet ? 'USD' : symbol}
    </Styled.ToggleButton>
  );

  const sizeInput = (
    <FormInput
      id="trade-amount"
      decimals={decimals}
      onInput={onSizeInput}
      label={
        <>
          <WithTooltip tooltip="order-amount" stringParams={{ SYMBOL: symbol ?? '' }} side="right">
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
          </WithTooltip>
          {symbol && <Tag>{symbol}</Tag>}
        </>
      }
      slotRight={isTablet && inputToggleButton}
      type={InputType.Number}
      value={sizeInputValue || ''}
    />
  );

  const usdcInput = (
    <FormInput
      id="trade-usdc"
      onInput={onUSDCInput}
      type={InputType.Currency}
      value={usdcInputValue || ''}
      decimals={tickSizeDecimals || USD_DECIMALS}
      label={
        <>
          <WithTooltip
            tooltip="order-amount-usd"
            stringParams={{ SYMBOL: symbol ?? '' }}
            side="right"
          >
            {stringGetter({ key: STRING_KEYS.AMOUNT })}
          </WithTooltip>
          <Tag>USD</Tag>
        </>
      }
      slotRight={isTablet && inputToggleButton}
    />
  );

  return (
    <Styled.Column>
      {isTablet ? (
        showUSDCInputOnTablet ? (
          usdcInput
        ) : (
          sizeInput
        )
      ) : (
        <Styled.Row>
          {sizeInput}
          {usdcInput}
        </Styled.Row>
      )}

      {needsLeverage && (
        <MarketLeverageInput
          leverageInputValue={leverageInputValue}
          setLeverageInputValue={setLeverageInputValue}
        />
      )}
    </Styled.Column>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Column = styled.div`
  ${layoutMixins.flexColumn}
  gap: var(--form-input-gap);
`;

Styled.Row = styled.div`
  ${layoutMixins.gridEqualColumns}
  gap: var(--form-input-gap);
`;

Styled.ToggleButton = styled(ToggleButton)`
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
