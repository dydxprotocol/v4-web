import styled from 'styled-components';

import type { Nullable, TradeState } from '@/constants/abacus';
import { NumberSign } from '@/constants/numbers';

import { DiffOutput } from '@/components/DiffOutput';
import { type OutputType } from '@/components/Output';

import { isNumber } from '@/lib/numbers';

type ElementProps = {
  hasError?: boolean | null;
  hideDiff?: boolean;
  isPositive: boolean;
  type: OutputType;
  value: Nullable<TradeState<number>>;
};

export const AccountInfoDiffOutput = ({
  hasError,
  hideDiff,
  isPositive,
  type,
  value,
}: ElementProps) => {
  const currentValue = value?.current;
  const postOrderValue = value?.postOrder;
  const hasDiffPostOrder = isNumber(postOrderValue) && currentValue !== postOrderValue && !hideDiff;

  return (
    <$DiffOutput
      hasInvalidNewValue={!!hasError}
      sign={isPositive ? NumberSign.Positive : NumberSign.Negative}
      type={type}
      withDiff={hasDiffPostOrder}
      newValue={postOrderValue}
      value={currentValue}
      layout="column"
      withBaseFont
    />
  );
};
const $DiffOutput = styled(DiffOutput)<{ withDiff?: boolean }>`
  --diffOutput-valueWithDiff-font: var(--font-small-book);
  --diffOutput-gap: 0.125rem;
  font: var(--font-base-book);
`;
