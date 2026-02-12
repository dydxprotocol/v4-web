import styled, { css } from 'styled-components';

import { CaretIcon, ChatIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

export const GlobalChat = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  return (
    <$Container>
      <$Header onClick={onToggle}>
        <$IconRow>
          <ChatIcon />
          Global Chat
        </$IconRow>
        <$CaretIcon $isOpen={isOpen} />
      </$Header>

      <$Body $isOpen={isOpen} />
    </$Container>
  );
};

const BODY_HEIGHT = '30rem';

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
  user-select: none;

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

const $CaretIcon = styled(CaretIcon)<{ $isOpen: boolean }>`
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
`;
