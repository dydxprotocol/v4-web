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
      <$MarginRow>
        <$MarginLabel>{detailLabel}</$MarginLabel>
        <$MarginValue>{detailValue}</$MarginValue>
      </$MarginRow>
      <$ActionRow>{actionSlot}</$ActionRow>
    </$PortfolioCard>
  );
};

const $PortfolioCard = styled.div`
  ${layoutMixins.flexColumn}
  width: 14rem;
  min-width: 14rem;
  background-color: var(--color-layer-3);
  overflow: hidden;
  padding: 0.75rem 0;
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

const $MarginRow = styled.div`
  ${layoutMixins.spacedRow}
  padding: 0 0.625rem;
  margin-top: 0.625rem;
`;

const $MarginLabel = styled.span`
  color: var(--color-text-0);
  font: var(--font-mini-book);
`;

const $MarginValue = styled.span`
  font: var(--font-small-book);
`;

const $ActionRow = styled.div`
  ${layoutMixins.spacedRow}
  border-top: var(--border);
  margin-top: 0.5rem;
  padding: 0 0.625rem;
  padding-top: 0.5rem;
`;
