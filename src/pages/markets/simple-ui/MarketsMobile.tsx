import { styled } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { UserMenuContent } from '@/views/menus/UserMenuContent';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setIsUserMenuOpen } from '@/state/dialogs';
import { getIsUserMenuOpen } from '@/state/dialogsSelectors';

import { MarketList } from './markets-view/MarketList';
import { PortfolioOverview } from './portfolio-overview/PortfolioOverview';

const MarketsMobile = () => {
  const stringGetter = useStringGetter();
  const isUserMenuOpen = useAppSelector(getIsUserMenuOpen);
  const dispatch = useAppDispatch();

  const toggleUserMenu = (isOpen: boolean) => {
    dispatch(setIsUserMenuOpen(isOpen));
  };

  return (
    <$MarketsMobile>
      <div tw="h-full flex-1">
        <MarketList
          slotTop={{
            content: <PortfolioOverview tw="w-[100vw]" />,
            height: 200,
          }}
        />
      </div>

      <$Dialog
        isOpen={isUserMenuOpen}
        title={stringGetter({ key: STRING_KEYS.MENU })}
        setIsOpen={toggleUserMenu}
        placement={DialogPlacement.Inline}
      >
        <UserMenuContent />
      </$Dialog>
    </$MarketsMobile>
  );
};

const $MarketsMobile = styled.div`
  ${layoutMixins.flexColumn}
  position: relative;
  height: calc(100vh - calc(var(--complianceBanner-height, 0px) + 0.75rem));
`;

const $Dialog = styled(Dialog)`
  --dialog-backgroundColor: var(--color-layer-1);
  --dialog-header-backgroundColor: var(--color-layer-1);
  box-shadow: none;
`;

export default MarketsMobile;
