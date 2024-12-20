import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import { NumberSign } from '@/constants/numbers';

import { DiffOutput } from '@/components/DiffOutput';
import { type OutputType } from '@/components/Output';

import { MaybeBigNumber } from '@/lib/numbers';

type ElementProps = {
  hasError?: boolean | null;
  hideDiff?: boolean;
  isPositive: boolean;
  type: OutputType;
  value: Nullable<BigNumber>;
  valuePost: Nullable<number>;
};

export const AccountInfoDiffOutput = ({
  hasError,
  hideDiff,
  isPositive,
  type,
  value,
  valuePost,
}: ElementProps) => {
  const currentValue = MaybeBigNumber(value);
  const postOrderValue = MaybeBigNumber(valuePost);
  const hasDiffPostOrder =
    postOrderValue != null &&
    postOrderValue.isFinite() &&
    !currentValue?.eq(postOrderValue) &&
    !hideDiff;

  return (
    <$DiffOutput
      hasInvalidNewValue={!!hasError}
      sign={isPositive ? NumberSign.Positive : NumberSign.Negative}
      type={type}
      withDiff={hasDiffPostOrder}
      newValue={postOrderValue}
      value={currentValue}
      layout="row"
      withBaseFont
    />
  );
};
const $DiffOutput = styled(DiffOutput)<{ withDiff?: boolean }>`
  --diffOutput-gap: 0.125rem;

  font: var(--font-small-book);
`;
