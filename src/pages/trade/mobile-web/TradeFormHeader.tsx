import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType, ShowSign } from '@/components/Output';
import { MidMarketPrice } from '@/views/MidMarketPrice';
import { MobileTradeAssetSelector } from '@/views/mobile/MobileTradeAssetSelector';

import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';

export const TradeFormHeaderMobile = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const assetId = useAppSelector(BonsaiHelpers.currentMarket.assetId);

  const launchableAsset = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetInfo, assetId);

  const percentChange24h = launchableAsset?.percentChange24h
    ? MustBigNumber(launchableAsset.percentChange24h).div(100).toNumber()
    : undefined;

  const assetPrice = launchableAsset ? (
    <Output tw="font-medium-bold" type={OutputType.Fiat} value={launchableAsset?.price} />
  ) : (
    <MidMarketPrice tw="font-medium-bold" richColor={false} />
  );

  return (
    <$Header>
      <MobileTradeAssetSelector launchableMarketId={launchableMarketId} />

      <$Right>
        <div tw="flexColumn items-end justify-end gap-0.125">
          {assetPrice}
          <Output
            tw="font-small-medium"
            css={{
              color: MustBigNumber(percentChange24h).isZero()
                ? undefined
                : MustBigNumber(percentChange24h).gt(0)
                  ? 'var(--color-positive)'
                  : 'var(--color-negative)',
            }}
            type={OutputType.Percent}
            showSign={ShowSign.None}
            value={percentChange24h}
          />
        </div>
      </$Right>
    </$Header>
  );
};

const $Header = styled.div`
  ${layoutMixins.contentSectionDetachedScrollable}

  ${layoutMixins.stickyHeader}
  z-index: 2;

  ${layoutMixins.row}

  gap: 1rem;

  color: var(--color-text-2);
  background-color: var(--color-layer-2);
  padding-top: 1rem;

  border-bottom: 1px solid var(--color-border);

  width: 100%;
  padding-bottom: 1rem;
`;

const $Right = styled.div`
  margin-left: auto;

  ${layoutMixins.rowColumn}
  justify-items: flex-end;
`;
