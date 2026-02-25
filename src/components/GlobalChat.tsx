import { useCallback, useRef, useState } from 'react';

import styled from 'styled-components';

import { ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';

import { useTrollboxOnlineCount } from '@/hooks/useTrollboxOnlineCount';

import { layoutMixins } from '@/styles/layoutMixins';

import { useAppDispatch } from '@/state/appTypes';
import { setIsChatEnabled } from '@/state/appUiConfigs';

import { GlobalChatBodyContent } from './GlobalChatBodyContent';
import { Icon, IconName } from './Icon';
import { IconButton } from './IconButton';

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hasBeenOpened = useRef(false);
  const onlineCount = useTrollboxOnlineCount();
  const dispatch = useAppDispatch();

  if (isOpen) hasBeenOpened.current = true;

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(setIsChatEnabled(false));
    },
    [dispatch]
  );

  return (
    <$ChatArea>
      <$Container>
        <$Header onClick={handleToggle}>
          <$IconRow>
            <Icon iconName={IconName.Chat} />
            {/* TODO: Replace with localization all at once feature is complete */}
            Global Chat
            {onlineCount != null && (
              <$OnlineIndicator>
                <$OnlineDot />
                {onlineCount.toLocaleString()} Online
              </$OnlineIndicator>
            )}
          </$IconRow>
          <$CloseButton
            iconName={IconName.Close}
            shape={ButtonShape.Square}
            size={ButtonSize.XSmall}
            buttonStyle={ButtonStyle.WithoutBackground}
            onClick={handleClose}
          />
        </$Header>
        <$Body $isOpen={isOpen}>{hasBeenOpened.current && <GlobalChatBodyContent />}</$Body>
      </$Container>
    </$ChatArea>
  );
};

const BODY_HEIGHT = '55vh';
const BODY_WIDTH = '25rem';

const $ChatArea = styled.div`
  ${layoutMixins.flexColumn}
  position: absolute;
  bottom: 100%;
  left: 0;
  width: ${BODY_WIDTH};
  padding-left: 1rem;
`;

const $Container = styled.div`
  ${layoutMixins.flexColumn}
  width: 100%;
  background-color: var(--color-layer-1);
  border-radius: 0.5rem 0.5rem 0 0;
  border: 1px solid var(--color-border);
  overflow: hidden;
`;

const $Header = styled.header`
  ${layoutMixins.spacedRow}
  padding: 0.4rem 1rem;
  background-color: var(--color-layer-3);
  font: var(--font-small-book);
  color: var(--color-text-2);
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
`;

const $IconRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const $OnlineIndicator = styled.span`
  ${layoutMixins.row}
  gap: 0.375rem;
  color: var(--color-text-0);
`;

const $OnlineDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--color-green);
`;

const $CloseButton = styled(IconButton)`
  --button-icon-size: 0.75rem;
  --button-border: none;
  --button-textColor: var(--color-text-0);

  &:hover {
    --button-textColor: var(--color-text-2);
  }
`;

const $Body = styled.div<{ $isOpen: boolean }>`
  height: ${({ $isOpen }) => ($isOpen ? BODY_HEIGHT : '0')};
  transition: height 0.3s var(--ease-out-expo);
`;
