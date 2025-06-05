import { styled } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

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

  const openUserMenu = () => {
    dispatch(setIsUserMenuOpen(true));
  };

  return (
    <div tw="flexColumn relative h-[100vh]">
      <div tw="h-full flex-1">
        <MarketList
          slotTop={{
            content: <PortfolioOverview tw="w-[100vw]" openUserMenu={openUserMenu} />,
            height: 200,
          }}
        />
      </div>

      <$Dialog
        isOpen={isUserMenuOpen}
        title={stringGetter({ key: STRING_KEYS.MENU })}
        setIsOpen={(isOpen: boolean) => {
          dispatch(setIsUserMenuOpen(isOpen));
        }}
        placement={DialogPlacement.Inline}
      >
        <UserMenuContent />
      </$Dialog>
    </div>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-backgroundColor: var(--color-layer-1);
  --dialog-header-backgroundColor: var(--color-layer-1);
`;

export default MarketsMobile;
