import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setIsMarketsMenuOpen } from '@/state/dialogs';

import { getAssetFromMarketId, getDisplayableAssetFromBaseAsset } from '@/lib/assetUtils';
import { mapIfPresent } from '@/lib/do';
import { orEmptyObj } from '@/lib/typeUtils';

export const MobileTradeAssetSelector = ({
  launchableMarketId,
}: {
  launchableMarketId?: string;
}) => {
  const id = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const imageUrl = useAppSelector(BonsaiHelpers.currentMarket.assetLogo);
  const leverage = useAppSelector(BonsaiHelpers.currentMarket.effectiveSelectedLeverage);

  const dispatch = useAppDispatch();

  const { displayableTicker } = orEmptyObj(useAppSelector(BonsaiHelpers.currentMarket.marketInfo));

  const launchableAsset = useAppSelectorWithArgs(
    BonsaiHelpers.assets.selectAssetInfo,
    mapIfPresent(launchableMarketId, getAssetFromMarketId)
  );

  const assetRow = launchableAsset ? (
    <div tw="inlineRow gap-[1ch]">
      <img
        src={launchableAsset.logo ?? undefined}
        alt={launchableAsset.name}
        tw="h-[2.5rem] w-[2.5rem] rounded-[50%]"
      />
      <$Name>
        <h3>{launchableAsset.name}</h3>
        <span>{getDisplayableAssetFromBaseAsset(launchableAsset.assetId)}</span>
      </$Name>
    </div>
  ) : (
    <div tw="inlineRow gap-[1ch]">
      <AssetIcon tw="[--asset-icon-size:2.5rem]" logoUrl={imageUrl} symbol={id} />
      <$Name>
        <h3>{displayableTicker}</h3>
        <span>{Math.round(leverage)}x</span>
        <Icon iconName={IconName.Caret} size="0.75em" className="text-color-text-0" />
      </$Name>
    </div>
  );

  const openMarketsDialog = () => {
    dispatch(setIsMarketsMenuOpen(true));
  };

  return (
    <Button buttonStyle={ButtonStyle.WithoutBackground} onClick={openMarketsDialog}>
      {assetRow}
    </Button>
  );
};

const $Name = styled.div`
  ${layoutMixins.inlineRow}

  h3 {
    font: var(--font-large-medium);
  }

  > :nth-child(2) {
    font: var(--font-mini-book);
    color: var(--color-text-0);
  }
`;
