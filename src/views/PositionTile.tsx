import styled, { css } from 'styled-components';

import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';
import { PositionSide } from '@/constants/trade';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { DiffArrow } from '@/components/DiffArrow';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { PositionSideTag } from '@/components/PositionSideTag';
import { TagSize } from '@/components/Tag';

import { isNumber, MustBigNumber } from '@/lib/numbers';
import { hasPositionSideChanged } from '@/lib/tradeData';

type ElementProps = {
  currentSize?: number | null;
  notionalTotal?: number | null;
  postOrderSize?: number | null;
  stepSizeDecimals?: number | null;
  symbol?: string;
  tickSizeDecimals?: number | null;
  isLoading?: boolean;
};

type StyleProps = {
  showNarrowVariation?: boolean;
};

export const PositionTile = ({
  currentSize,
  notionalTotal,
  postOrderSize,
  stepSizeDecimals,
  symbol,
  tickSizeDecimals,
  isLoading,
  showNarrowVariation,
}: ElementProps & StyleProps) => {
  const hasSizeDiff = isNumber(postOrderSize) && currentSize !== postOrderSize;

  const { currentPositionSide, newPositionSide, positionSideHasChanged } = hasPositionSideChanged({
    currentSize,
    postOrderSize,
  });

  const hasNoCurrentOrPostOrderPosition =
    currentPositionSide === PositionSide.None && newPositionSide === PositionSide.None;

  return (
    <$PositionTile
      newPositionSide={newPositionSide}
      positionSide={currentPositionSide}
      positionSideHasChanged={positionSideHasChanged}
      showNarrowVariation={showNarrowVariation}
    >
      <div>
        {showNarrowVariation && <AssetIcon symbol={symbol} tw="text-[2.25rem]" />}
        <$PositionTags>
          <PositionSideTag positionSide={currentPositionSide} size={TagSize.Medium} />
          {hasSizeDiff && newPositionSide && currentPositionSide !== newPositionSide && (
            <>
              <DiffArrow />
              <PositionSideTag positionSide={newPositionSide} size={TagSize.Medium} />
            </>
          )}
        </$PositionTags>
      </div>

      {!hasNoCurrentOrPostOrderPosition && (
        <$PositionSizes showNarrowVariation={showNarrowVariation}>
          <$Output
            type={OutputType.Number}
            tag={!hasSizeDiff && symbol}
            value={currentSize}
            fractionDigits={stepSizeDecimals ?? TOKEN_DECIMALS}
            showSign={ShowSign.None}
            smallText={hasSizeDiff}
            withBaseFont
          />
          {hasSizeDiff ? (
            <$PostOrderSizeRow>
              <DiffArrow
                sign={
                  MustBigNumber(postOrderSize).gt(currentSize ?? 0)
                    ? NumberSign.Positive
                    : NumberSign.Negative
                }
              />
              <$Output
                type={OutputType.Number}
                value={postOrderSize}
                fractionDigits={stepSizeDecimals ?? TOKEN_DECIMALS}
                showSign={ShowSign.None}
                tag={symbol}
                withBaseFont
              />
            </$PostOrderSizeRow>
          ) : (
            <$Output
              type={OutputType.Fiat}
              value={notionalTotal}
              fractionDigits={tickSizeDecimals}
              smallText
              withBaseFont
            />
          )}
        </$PositionSizes>
      )}
      {isLoading && <LoadingSpinner tw="text-text-0" />}
    </$PositionTile>
  );
};
const $PositionTags = styled.div`
  ${layoutMixins.inlineRow}
`;

const $PositionSizes = styled.div<{ showNarrowVariation?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 0.375rem;

  font: var(--font-medium-book);
  text-align: end;
  color: var(--color-text-2);

  ${({ showNarrowVariation }) =>
    showNarrowVariation &&
    css`
      width: 100%;

      align-items: start;
      overflow: hidden;
      gap: 0;

      font: var(--font-base-book);
      text-align: start;
    `}
`;

const $Output = styled(Output)<{ smallText?: boolean; margin?: string }>`
  ${({ smallText }) =>
    smallText &&
    css`
      color: var(--color-text-0);
      font: var(--font-small-book);
    `};

  ${({ margin }) => margin && `margin: ${margin};`}
`;

const $PositionTile = styled.div<{
  newPositionSide?: PositionSide;
  positionSide?: PositionSide;
  positionSideHasChanged?: Boolean;
  showNarrowVariation?: Boolean;
}>`
  // Props/defaults
  --position-from-color: transparent;
  --position-to-color: transparent;

  // Constants
  --position-default-gradient: linear-gradient(
    342.62deg,
    var(--color-gradient-base-0) -9.23%,
    var(--color-gradient-base-1) 110.36%
  );

  ${({ positionSide }) =>
    positionSide &&
    css`
      --position-from-color: ${{
        [PositionSide.Long]: css`var(--color-gradient-positive)`,
        [PositionSide.None]: css`transparent`,
        [PositionSide.Short]: css`var(--color-gradient-negative)`,
      }[positionSide]};
    `}

  ${({ positionSideHasChanged, newPositionSide }) =>
    newPositionSide &&
    positionSideHasChanged &&
    css`
      --position-to-color: ${{
        [PositionSide.Long]: css`var(--color-gradient-positive)`,
        [PositionSide.None]: css`transparent`,
        [PositionSide.Short]: css`var(--color-gradient-negative)`,
      }[newPositionSide]};
    `}
  
  height: 4.625rem;
  max-height: 4.625rem;

  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
  padding: 1rem;
  gap: 0.5rem;

  background: linear-gradient(130.25deg, var(--position-from-color) 0.9%, transparent 64.47%),
    linear-gradient(227.14deg, var(--position-to-color) 1.6%, transparent 63.87%),
    var(--position-default-gradient);

  ${({ showNarrowVariation }) =>
    showNarrowVariation &&
    css`
      min-height: 8.875rem;
      height: 8.875rem;
      min-width: 8.875rem;

      flex-direction: column;
      align-items: start;

      background: linear-gradient(130.25deg, transparent 0.9%, transparent 64.47%),
        linear-gradient(227.14deg, var(--position-from-color) 1.6%, transparent 63.87%),
        var(--position-default-gradient);

      > :first-child {
        ${layoutMixins.spacedRow}
        gap: 0.5rem;
        width: 100%;
      }
    `};
`;

const $PostOrderSizeRow = styled.div`
  ${layoutMixins.inlineRow}
`;
