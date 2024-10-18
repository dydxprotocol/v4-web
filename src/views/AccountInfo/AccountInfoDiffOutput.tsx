import styled, { css } from 'styled-components';

import type { Nullable, TradeState } from '@/constants/abacus';
import { NumberSign } from '@/constants/numbers';

import { DiffOutput } from '@/components/DiffOutput';
import { type OutputType } from '@/components/Output';

import { isNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';

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

  const { uiRefresh } = testFlags;

  return (
    <$DiffOutput
      $uiRefreshEnabled={uiRefresh}
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
const $DiffOutput = styled(DiffOutput)<{ withDiff?: boolean; $uiRefreshEnabled: boolean }>`
  --diffOutput-value-font: ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled ? css`var(--font-small-book)` : css`var(--font-mini-book)`};
  --diffOutput-newValue-font: ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled ? css`var(--font-small-book)` : css`var(--font-mini-book)`};
  --diffOutput-valueWithDiff-font: ${({ $uiRefreshEnabled }) =>
    $uiRefreshEnabled ? css`var(--font-small-book)` : css`var(--font-mini-book)`};

  --diffOutput-gap: 0.125rem;
  font: var(--font-base-book);
`;
