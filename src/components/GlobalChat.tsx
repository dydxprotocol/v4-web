import { useCallback, useState } from 'react';

import styled, { css } from 'styled-components';

import { CaretIcon, ChatIcon, HelpCircleIcon, SendIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

export const GlobalChat = ({ onClose }: { onClose: () => void }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  return (
    <$Panel $isClosing={isClosing} onAnimationEnd={isClosing ? onClose : undefined}>
      <$Header onClick={handleClose}>
        <$IconRow>
          <ChatIcon />
          Global Chat
        </$IconRow>
        <$CaretIcon $isOpen />
      </$Header>

      <$MessagesArea />

      <$ProgressSection>
        <$ProgressHeader>
          <span>Trade to unlock chat</span>
          <$ProgressPercent>65%</$ProgressPercent>
        </$ProgressHeader>
        <$ProgressBarTrack>
          <$ProgressBarFill style={{ width: '65%' }} />
        </$ProgressBarTrack>
        <$ProgressDetails>
          <span>30D Vol: $64k</span>
          <span>$36k vol. to unlock</span>
        </$ProgressDetails>
      </$ProgressSection>

      <$InputBar>
        <$ChatInput placeholder="Chat locked" disabled />
        <$SendButton disabled>
          <SendIcon />
        </$SendButton>
      </$InputBar>

      <$Footer>
        <$RulesLink>
          Rules <HelpCircleIcon />
        </$RulesLink>
        <$OnlineIndicator>
          <$StatusDot />
          2345 Online
        </$OnlineIndicator>
      </$Footer>
    </$Panel>
  );
};

const ANIMATION_DURATION = '0.25s';

const $Panel = styled.div<{ $isClosing: boolean }>`
  ${layoutMixins.flexColumn}
  width: 100%;
  max-height: 28rem;
  background-color: var(--color-layer-3);
  border-radius: 0.75rem 0.75rem 0 0;
  border: 1px solid var(--color-border);
  overflow: hidden;

  animation: ${({ $isClosing }) => ($isClosing ? 'panelSlideDown' : 'panelSlideUp')}
    ${ANIMATION_DURATION} var(--ease-out-expo) forwards;

  @keyframes panelSlideUp {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 28rem;
    }
  }

  @keyframes panelSlideDown {
    from {
      opacity: 1;
      max-height: 28rem;
    }
    to {
      opacity: 0;
      max-height: 0;
    }
  }
`;

const $Header = styled.header`
  ${layoutMixins.spacedRow}
  padding: 0.75rem 1rem;
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

const $CaretIcon = styled(CaretIcon)<{ $isOpen: boolean }>`
  width: 0.625rem;
  height: 0.625rem;
  color: var(--color-text-0);
  transition: rotate 0.3s var(--ease-out-expo);

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      rotate: -0.5turn;
    `}
`;

const $MessagesArea = styled.div`
  flex: 1;
  min-height: 14rem;
  overflow-y: auto;
  padding: 0.75rem 1rem;
`;

const $ProgressSection = styled.div`
  padding: 0.75rem 1rem;
  background-color: var(--color-layer-4);
  margin: 0 0.75rem;
  border-radius: 0.5rem;
`;

const $ProgressHeader = styled.div`
  ${layoutMixins.spacedRow}
  font: var(--font-small-book);
  color: var(--color-text-2);
  margin-bottom: 0.5rem;
`;

const $ProgressPercent = styled.span`
  color: var(--color-accent);
`;

const $ProgressBarTrack = styled.div`
  height: 0.25rem;
  background-color: var(--color-layer-2);
  border-radius: 0.125rem;
  margin-bottom: 0.375rem;
`;

const $ProgressBarFill = styled.div`
  height: 100%;
  background-color: var(--color-accent);
  border-radius: 0.125rem;
`;

const $ProgressDetails = styled.div`
  ${layoutMixins.spacedRow}
  font: var(--font-mini-book);
  color: var(--color-text-0);
`;

const $InputBar = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  padding: 0.75rem 1rem;
`;

const $ChatInput = styled.input`
  flex: 1;
  font: var(--font-small-book);
  color: var(--color-text-0);
  background-color: var(--color-layer-4);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  outline: none;

  &::placeholder {
    color: var(--color-text-0);
    opacity: 0.5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const $SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  background-color: var(--color-accent);
  color: var(--color-text-2);
  cursor: pointer;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const $Footer = styled.div`
  ${layoutMixins.spacedRow}
  padding: 0.5rem 1rem;
  font: var(--font-mini-book);
  color: var(--color-text-0);
`;

const $RulesLink = styled.div`
  ${layoutMixins.row}
  gap: 0.25rem;
  cursor: pointer;

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  &:hover {
    color: var(--color-text-1);
  }
`;

const $StatusDot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--color-success);
  flex-shrink: 0;
`;

const $OnlineIndicator = styled.div`
  ${layoutMixins.row}
  gap: 0.375rem;
`;
