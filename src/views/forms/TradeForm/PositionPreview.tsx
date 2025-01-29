import { BonsaiHelpers } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { PositionTile } from '@/views/PositionTile';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

type ElementProps = {
  showNarrowVariation?: boolean;
};

export const PositionPreview = ({ showNarrowVariation }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { id, resources } = orEmptyObj(useAppSelector(getCurrentMarketAssetData, shallowEqual));
  const { stepSizeDecimals, tickSizeDecimals } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.marketInfo)
  );
  const { size: positionSize, notionalTotal } = orEmptyObj(
    useAppSelector(getCurrentMarketPositionData, shallowEqual)
  );
  const { imageUrl } = orEmptyObj(resources);

  return (
    <$PositionPreviewContainer>
      <$YourPosition>
        {!showNarrowVariation && <AssetIcon logoUrl={imageUrl} symbol={id} />}
        <span>
          {stringGetter({
            key: STRING_KEYS.YOUR_MARKET_POSITION,
            params: {
              MARKET: showNarrowVariation ? '' : <strong>{id ?? ''}</strong>,
            },
          })}
        </span>
      </$YourPosition>
      <PositionTile
        assetImgUrl={imageUrl}
        currentSize={positionSize?.current}
        notionalTotal={notionalTotal?.current}
        postOrderSize={positionSize?.postOrder}
        stepSizeDecimals={stepSizeDecimals}
        symbol={id}
        tickSizeDecimals={tickSizeDecimals}
        showNarrowVariation={showNarrowVariation}
      />
    </$PositionPreviewContainer>
  );
};
const $PositionPreviewContainer = styled.div`
  ${layoutMixins.column}
  align-items: flex-start;
  width: 100%;
  gap: 0.5rem;

  > * {
    width: 100%;
  }
`;

const $YourPosition = styled.div`
  ${layoutMixins.inlineRow}
  color: var(--color-text-0);

  --asset-icon-size: 1.75em;

  strong {
    font-weight: normal;
    color: var(--color-text-1);
  }
`;
