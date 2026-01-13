import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { MarketStatsDetails } from '@/views/MarketStatsDetails';
import { MobileTradeAssetSelector } from '@/views/mobile/MobileTradeAssetSelector';
import { FavoriteButton } from '@/views/tables/MarketsTable/FavoriteButton';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setIsUserMenuOpen } from '@/state/dialogs';

export const TradeHeaderMobile = ({ launchableMarketId }: { launchableMarketId?: string }) => {
  const id = useAppSelector(BonsaiHelpers.currentMarket.assetId);
  const dispatch = useAppDispatch();

  const openUserMenu = () => {
    dispatch(setIsUserMenuOpen(true));
  };

  return (
    <$TopHeader>
      <div tw="flex w-full items-center justify-between gap-1 border border-b border-solid border-color-border pb-1 pl-1 pr-1.5 pt-1">
        {id && <FavoriteButton marketId={id} tw="ml-[-0.5rem]" />}

        <MobileTradeAssetSelector launchableMarketId={launchableMarketId} />

        <Button
          tw="size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
          shape={ButtonShape.Circle}
          size={ButtonSize.XSmall}
          onClick={openUserMenu}
        >
          <Icon iconName={IconName.Menu} />
        </Button>
      </div>
      <MarketStatsDetails showMidMarketPrice={false} horizontal withSubscript={false} />
    </$TopHeader>
  );
};

const $TopHeader = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}

  ${layoutMixins.stickyHeader}
  z-index: 2;

  ${layoutMixins.column}

  width: 100%;

  color: var(--color-text-2);
  background-color: var(--color-layer-2);
`;
