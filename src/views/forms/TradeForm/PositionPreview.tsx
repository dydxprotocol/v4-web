import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { PositionTile } from '@/views/PositionTile';

import { getCurrentMarketPositionData } from '@/state/accountSelectors';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { getCurrentMarketData } from '@/state/perpetualsSelectors';

type ElementProps = {
  showNarrowVariation?: boolean;
};

export const PositionPreview = ({ showNarrowVariation }: ElementProps) => {
  const stringGetter = useStringGetter();

  const { id } = useSelector(getCurrentMarketAssetData, shallowEqual) || {};
  const { configs, oraclePrice } = useSelector(getCurrentMarketData, shallowEqual) || {};
  const { size: positionSize } = useSelector(getCurrentMarketPositionData, shallowEqual) || {};
  const { stepSizeDecimals, tickSizeDecimals } = configs || {};

  return (
    <Styled.PositionPreviewContainer>
      <Styled.YourPosition>
        {!showNarrowVariation && <AssetIcon symbol={id} />}
        <span>
          {stringGetter({
            key: STRING_KEYS.YOUR_MARKET_POSITION,
            params: {
              MARKET: showNarrowVariation ? '' : <strong>{id ?? ''}</strong>,
            },
          })}
        </span>
      </Styled.YourPosition>
      <PositionTile
        currentSize={positionSize?.current}
        oraclePrice={oraclePrice}
        postOrderSize={positionSize?.postOrder}
        stepSizeDecimals={stepSizeDecimals}
        symbol={id || undefined}
        tickSizeDecimals={tickSizeDecimals}
        showNarrowVariation={showNarrowVariation}
      />
    </Styled.PositionPreviewContainer>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PositionPreviewContainer = styled.div`
  ${layoutMixins.column}
  align-items: flex-start;
  width: 100%;
  gap: 0.5rem;

  > * {
    width: 100%;
  }
`;

Styled.YourPosition = styled.div`
  ${layoutMixins.inlineRow}
  color: var(--color-text-0);

  > img {
    height: 1.75em;
  }

  strong {
    font-weight: normal;
    color: var(--color-text-1);
  }
`;
