import { BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
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
    <$Header>
      {id && <FavoriteButton marketId={id} tw="ml-[-0.5rem]" />}

      <MobileTradeAssetSelector launchableMarketId={launchableMarketId} />

      <$Right>
        <Button
          tw="size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
          shape={ButtonShape.Circle}
          size={ButtonSize.XSmall}
          onClick={openUserMenu}
        >
          <Icon iconName={IconName.Menu} />
        </Button>
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

const $Right = styled.div`
  margin-left: auto;

  ${layoutMixins.rowColumn}
  justify-items: flex-end;
`;
