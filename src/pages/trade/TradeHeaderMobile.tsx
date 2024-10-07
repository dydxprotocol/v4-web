import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { AppRoute } from '@/constants/routes';

import { useMetadataServiceAssetFromId } from '@/hooks/useLaunchableMarkets';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { BackButton } from '@/components/BackButton';
import { Output, OutputType } from '@/components/Output';
import { MidMarketPrice } from '@/views/MidMarketPrice';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

import { getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';

export const TradeHeaderMobile = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const { name, id } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};
  const navigate = useNavigate();

  const { displayId, priceChange24H, priceChange24HPercent } =
    useAppSelector(getCurrentMarketData, shallowEqual) ?? {};

  const launchableAsset = useMetadataServiceAssetFromId(launchableMarketId);

  const assetRow = launchableAsset ? (
    <div tw="inlineRow gap-[1ch]">
      <img
        src={launchableAsset.logo}
        alt={launchableAsset.name}
        tw="h-[2.5rem] w-[2.5rem] border-r-[50%]"
      />
      <$Name>
        <h3>{launchableAsset.name}</h3>
        <span>{getDisplayableAssetFromBaseAsset(launchableAsset.id)}</span>
      </$Name>
    </div>
  ) : (
    <div tw="inlineRow gap-[1ch]">
      <AssetIcon symbol={id} tw="text-[2.5rem]" />
      <$Name>
        <h3>{name}</h3>
        <span>{displayId}</span>
      </$Name>
    </div>
  );

  return (
    <$Header>
      <BackButton onClick={() => navigate(AppRoute.Markets)} />

      {assetRow}

      <$Right>
        <MidMarketPrice />
        <$PriceChange
          type={OutputType.Percent}
          value={MustBigNumber(priceChange24HPercent).abs()}
          isNegative={MustBigNumber(priceChange24H).isNegative()}
        />
      </$Right>
    </$Header>
  );
};
const $Header = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}

  ${layoutMixins.stickyHeader}
  z-index: 2;

  ${layoutMixins.row}

  padding-left: 1rem;
  padding-right: 1.5rem;
  gap: 1rem;

  color: var(--color-text-2);
  background-color: var(--color-layer-2);
`;
const $Name = styled.div`
  ${layoutMixins.rowColumn}

  h3 {
    font: var(--font-large-medium);
  }

  > :nth-child(2) {
    font: var(--font-mini-book);
    color: var(--color-text-0);
  }
`;

const $Right = styled.div`
  margin-left: auto;

  ${layoutMixins.rowColumn}
  justify-items: flex-end;
`;

const $PriceChange = styled(Output)<{ isNegative?: boolean }>`
  font: var(--font-small-book);
  color: ${({ isNegative }) => (isNegative ? `var(--color-negative)` : `var(--color-positive)`)};
`;
