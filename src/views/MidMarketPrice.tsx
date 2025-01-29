import { useEffect, useRef } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { LoadingDots } from '@/components/Loading/LoadingDots';
import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';

import { orEmptyObj } from '@/lib/typeUtils';

const getMidMarketPriceColor = ({
  midMarketPrice,
  lastMidMarketPrice,
}: {
  midMarketPrice?: BigNumber;
  lastMidMarketPrice?: BigNumber;
}) => {
  if (lastMidMarketPrice == null || midMarketPrice == null) {
    return 'var(--color-text-2)';
  }
  if (midMarketPrice.lt(lastMidMarketPrice)) {
    return 'var(--color-negative)';
  }
  if (midMarketPrice.gt(lastMidMarketPrice)) {
    return 'var(--color-positive)';
  }
  return 'var(--color-text-2)';
};

export const MidMarketPrice = () => {
  const { tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.stableMarketInfo)
  );

  const midMarketPriceLoading = ['pending', 'idle'].includes(
    useAppSelector(BonsaiHelpers.currentMarket.midPrice.loading)
  );

  const midMarketPrice = useAppSelector(BonsaiHelpers.currentMarket.midPrice.data);

  const lastMidMarketPrice = useRef(midMarketPrice);

  const midMarketColor = getMidMarketPriceColor({
    midMarketPrice,
    lastMidMarketPrice: lastMidMarketPrice.current,
  });

  useEffect(() => {
    lastMidMarketPrice.current = midMarketPrice;
  }, [midMarketPrice]);

  if (midMarketPriceLoading) {
    return <LoadingDots size={5} />;
  }

  return (
    <$Output
      withSubscript
      type={OutputType.Fiat}
      value={midMarketPrice}
      color={midMarketColor}
      fractionDigits={tickSizeDecimals}
    />
  );
};

const $Output = styled(Output)<{ color?: string }>`
  ${layoutMixins.row}

  ${({ color }) =>
    color &&
    css`
      color: ${color};
    `}
`;
