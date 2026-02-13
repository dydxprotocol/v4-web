import { useCallback, useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { GlobalChatBodyContent } from './GlobalChatBodyContent';
import { Icon, IconName } from './Icon';

export const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hasBeenOpened = useRef(false);
  if (isOpen) hasBeenOpened.current = true;

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <$ChatArea>
      <$Container>
        <$Header onClick={handleToggle}>
          <$IconRow>
            <Icon iconName={IconName.Chat} />
            {/* TODO: Replace with localization all at once feature is complete */}
            Global Chat
          </$IconRow>
          <$Icon iconName={IconName.Caret} $isOpen={isOpen} />
        </$Header>
        <$Body $isOpen={isOpen}>{hasBeenOpened.current && <GlobalChatBodyContent />}</$Body>
      </$Container>
    </$ChatArea>
  );
};

const BODY_HEIGHT = '35rem';
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
  background-color: var(--color-layer-3);
  border-radius: 0.5rem 0.5rem 0 0;
  border: 1px solid var(--color-border);
  overflow: hidden;
`;

const $Header = styled.header`
  ${layoutMixins.spacedRow}
  padding: 0.625rem 1rem;
  background-color: var(--color-layer-2);
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

const $Icon = styled(Icon)<{ $isOpen: boolean }>`
  width: 0.625rem;
  height: 0.625rem;
  color: var(--color-text-0);
  transition: rotate 0.3s var(--ease-out-expo);

  ${({ $isOpen }) =>
    !$isOpen &&
    css`
      rotate: -0.5turn;
    `}
`;

const $Body = styled.div<{ $isOpen: boolean }>`
  height: ${({ $isOpen }) => ($isOpen ? BODY_HEIGHT : '0')};
  transition: height 0.3s var(--ease-out-expo);
  overflow: hidden;
`;
