import React from 'react';

import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from './AssetIcon';

type PortfolioCardProps = {
  assetName: string;
  assetId?: string;
  assetIcon?: React.ReactNode;
  actionSlot: React.ReactNode;

  detailLabel: string;
  detailValue: React.ReactNode;
};

export const PortfolioCard = ({
  assetId,
  assetIcon,
  assetName,
  actionSlot,
  detailLabel,
  detailValue,
}: PortfolioCardProps) => {
  return (
    <$PortfolioCard>
      <$MarketRow>
        {assetIcon ?? <AssetIcon symbol={assetId} />}
        {assetName}
      </$MarketRow>
      <div tw="spacedRow mt-0.5 px-0.625 py-0">
        <span tw="text-color-text-0 font-mini-book">{detailLabel}</span>
        <span tw="font-small-book">{detailValue}</span>
      </div>
      <div tw="spacedRow mt-0.5 px-0.625 py-0 pt-0.5 [border-top:--border]">{actionSlot}</div>
    </$PortfolioCard>
  );
};

const $PortfolioCard = styled.div`
  ${layoutMixins.flexColumn}
  width: 14rem;
  min-width: 14rem;
  background-color: var(--color-layer-3);
  overflow: hidden;
  padding: 0.625rem 0;
  padding-bottom: 0.5rem;
  border-radius: 0.625rem;
`;

const $MarketRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  padding: 0 0.625rem;
  font: var(--font-small-book);

  img {
    font-size: 1.25rem; // 20px x 20px
  }
`;
