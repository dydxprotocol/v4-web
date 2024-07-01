import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { DiffArrow, type DiffArrowProps } from '@/components/DiffArrow';
import { Output, type OutputProps } from '@/components/Output';

import { BigNumberish } from '@/lib/numbers';

type ElementProps = {
  hasInvalidNewValue?: boolean;
  newValue?: BigNumberish | null;
  withDiff?: boolean;
};

type StyleProps = {
  layout?: 'row' | 'column';
};

export type DiffOutputProps = DiffArrowProps & OutputProps & ElementProps & StyleProps;

export const DiffOutput = ({
  className,
  direction,
  hasInvalidNewValue,
  sign,
  withDiff,
  layout = 'row',

  value,
  newValue,

  ...outputProps
}: DiffOutputProps) => (
  <$DiffOutput className={className} layout={layout} withDiff={withDiff}>
    <Output value={value} {...outputProps} />
    {withDiff && (
      <$DiffValue hasInvalidNewValue={hasInvalidNewValue}>
        <DiffArrow direction={direction} sign={sign} />
        <Output value={newValue} {...outputProps} />
      </$DiffValue>
    )}
  </$DiffOutput>
);
const $DiffValue = styled.div<{ hasInvalidNewValue?: boolean }>`
  ${layoutMixins.row}
  gap: 0.25rem;
  color: var(--color-text-2);

  ${({ hasInvalidNewValue }) =>
    hasInvalidNewValue &&
    css`
      color: var(--color-error);
    `}
`;

const $DiffOutput = styled.div<{ layout: 'row' | 'column'; withDiff?: boolean }>`
  --diffOutput-gap: 0.25rem;
  --diffOutput-value-color: var(--color-text-1);
  --diffOutput-newValue-color: var(--color-text-2);
  --diffOutput-valueWithDiff-color: ;

  gap: var(--diffOutput-gap);

  & > :first-child {
    font: var(--diffOutput-value-font, inherit);
    color: var(--diffOutput-value-color);
  }

  ${({ layout }) =>
    ({
      row: `
        ${layoutMixins.row}
      `,
      column: `
        ${layoutMixins.column}
      `,
    })[layout]}

  ${({ withDiff }) =>
    withDiff &&
    css`
      & > :first-child {
        color: var(--diffOutput-valueWithDiff-color, var(--diffOutput-value-color));
        font: var(--diffOutput-valueWithDiff-font);
      }

      & > :last-child {
        color: var(--diffOutput-newValue-color);
        font: var(--diffOutput-newValue-font);
      }
    `}
`;
