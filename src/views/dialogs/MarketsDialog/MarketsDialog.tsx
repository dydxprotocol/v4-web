import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog, DialogPlacement } from '@/components/Dialog';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setIsMarketsMenuOpen } from '@/state/dialogs';
import { getIsMarketsMenuOpen } from '@/state/dialogsSelectors';

import { MarketList } from './MarketsList';

const Content = () => {
  return (
    <div tw="h-full flex-1">
      <MarketList />
    </div>
  );
};

export const MarketsMenuDialog = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const isMarketsMenuOpen = useAppSelector(getIsMarketsMenuOpen);

  const toggleMarketsMenu = (isOpen: boolean) => {
    dispatch(setIsMarketsMenuOpen(isOpen));
  };

  return (
    <$Dialog
      isOpen={isMarketsMenuOpen}
      title={stringGetter({ key: STRING_KEYS.MARKETS })}
      setIsOpen={toggleMarketsMenu}
      placement={DialogPlacement.Inline}
    >
      <Content />
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-backgroundColor: var(--color-layer-1);
  --dialog-header-backgroundColor: var(--color-layer-1);
  box-shadow: none;
  z-index: 3;
`;
