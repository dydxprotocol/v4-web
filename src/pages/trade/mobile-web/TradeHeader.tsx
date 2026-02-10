import { BonsaiHelpers } from '@/bonsai/ontology';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { AppRoute } from '@/constants/routes';

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

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const openUserMenu = () => {
    dispatch(setIsUserMenuOpen(true));
  };

  return (
    <$TopHeader>
      <div tw="flex h-[60px] w-full items-center justify-between gap-1 border border-b border-solid border-color-border px-1">
        {id && <FavoriteButton marketId={id} tw="ml-[-0.5rem]" />}

        <MobileTradeAssetSelector launchableMarketId={launchableMarketId} />

        <Button
          tw="relative size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
          shape={ButtonShape.Circle}
          size={ButtonSize.XSmall}
          onClick={() => {
            navigate(AppRoute.Alerts);
          }}
        >
          <Icon iconName={IconName.BellStroked} />
        </Button>
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
