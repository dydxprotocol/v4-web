import styled from 'styled-components';

import { TradeInputField } from '@/constants/abacus';
import { ButtonShape } from '@/constants/buttons';
import { PERCENT_DECIMALS } from '@/constants/numbers';

import { formMixins } from '@/styles/formMixins';

import { ToggleGroup } from '@/components/ToggleGroup';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import { objectEntries } from '@/lib/objectHelpers';

const PERCENTAGE_OPTIONS = {
  '10%': 0.1,
  '25%': 0.25,
  '50%': 0.5,
  '75%': 0.75,
  '100%': 1,
};

type ElementProps = {
  balancePercentValue: string;
  setBalancePercentInputValue: (value: string) => void;
};

export const TradePercentSizeToggle = ({
  balancePercentValue,
  setBalancePercentInputValue,
}: ElementProps) => {
  const updateBalancePercent = (balancePercent: string) => {
    setBalancePercentInputValue(balancePercent);

    abacusStateManager.setTradeValue({
      value: balancePercent,
      field: TradeInputField.balancePercent,
    });
  };

  const formattedBalancePercentValue = balancePercentValue
    ? MustBigNumber(balancePercentValue).toFixed(PERCENT_DECIMALS)
    : '';

  return (
    <$ToggleGroup
      items={objectEntries(PERCENTAGE_OPTIONS).map(([key, value]) => ({
        label: key,
        value: MustBigNumber(value).toFixed(PERCENT_DECIMALS),
      }))}
      value={formattedBalancePercentValue}
      onValueChange={updateBalancePercent}
      shape={ButtonShape.Rectangle}
    />
  );
};

const $ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}
`;
