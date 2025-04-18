import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { NumberSign } from '@/constants/numbers';

import { DiffOutput } from '@/components/DiffOutput';
import { type OutputType } from '@/components/Output';

import { MaybeBigNumber } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

type ElementProps = {
  hasError?: boolean | null;
  hideDiff?: boolean;
  isPositive: boolean;
  type: OutputType;
  value: Nullable<BigNumber>;
  valuePost: Nullable<number>;
};

const EPSILON_FOR_ACCOUNT_INFOS = 1e-6;
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
    currentValue != null &&
    postOrderValue.isFinite() &&
    !postOrderValue.minus(currentValue).abs().lte(EPSILON_FOR_ACCOUNT_INFOS) &&
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
