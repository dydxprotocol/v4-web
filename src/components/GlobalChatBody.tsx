import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useVirtualizer } from '@tanstack/react-virtual';
import styled from 'styled-components';

import { useAccounts } from '@/hooks/useAccounts';

import { SendIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';

import { useAppSelector } from '@/state/appTypes';

const BODY_HEIGHT = '30rem';

const DUMMY_MESSAGES = [
  { id: '1', username: 'berry09', message: 'ape this shit now' },
  { id: '2', username: 'kiwi910', message: 'to the moon!!!!!' },
  {
    id: '3',
    username: 'strawberry18',
    message: 'long at 64k with a tp at 71k, sl at 61k. lock in frens',
  },
  { id: '4', username: 'orange290', message: 'aping this shit now' },
  { id: '5', username: 'grapejuice27', message: 'yolofam' },
  { id: '6', username: 'berry09', message: 'ape this shit now' },
  {
    id: '7',
    username: 'strawberry18',
    message: 'long at 64k with a tp at 71k, sl at 61k. lock in frens',
  },
  { id: '8', username: 'mango42', message: 'just longed ETH lets gooo' },
  { id: '9', username: 'peach77', message: 'who else is shorting this pump?' },
  { id: '10', username: 'lemon256', message: 'BTC 100k end of month no cap' },
  {
    id: '11',
    username: 'coconut88',
    message: 'closed my short at 62k, taking profits while i can',
  },
  { id: '12', username: 'plum999', message: 'degen hours rn fr fr' },
  { id: '13', username: 'fig101', message: 'this dip is free money' },
  {
    id: '14',
    username: 'papaya55',
    message: 'opened a 10x long on SOL, wish me luck boys',
  },
  { id: '15', username: 'lime303', message: 'bears in shambles lmaooo' },
  { id: '16', username: 'cherry420', message: 'gm degens' },
  { id: '17', username: 'melon67', message: 'funding rate is crazy rn be careful' },
  {
    id: '18',
    username: 'apricot12',
    message: 'shorted the top at 69k, tp at 63k. ez money',
  },
  { id: '19', username: 'guava808', message: 'diamond hands only no paper hands allowed' },
  { id: '20', username: 'dragonfruit3', message: 'who got liquidated on that wick lol' },
  { id: '21', username: 'tangerine91', message: 'accumulating more on every dip' },
  {
    id: '22',
    username: 'blueberry44',
    message: 'entry at 64.5k with 5x leverage, sl at 62k. not financial advice',
  },
  { id: '23', username: 'pear159', message: 'alts about to send it watch' },
  { id: '24', username: 'banana707', message: 'just woke up what did i miss' },
  { id: '25', username: 'kiwi910', message: 'told yall to buy the dip yesterday' },
  { id: '26', username: 'passionfruit6', message: 'this chat is bullish af' },
  { id: '27', username: 'watermelon23', message: 'ngmi if you are not longing here' },
];

export const GlobalChatBody = ({ isOpen }: { isOpen: boolean }) => {
  const hasBeenOpened = useRef(false);
  if (isOpen) hasBeenOpened.current = true;

  return <$Body $isOpen={isOpen}>{hasBeenOpened.current && <GlobalChatBodyContent />}</$Body>;
};

const VOLUME_THRESHOLD = 100_000;

const GlobalChatBodyContent = () => {
  const { dydxAddress } = useAccounts();
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [inputValue, setInputValue] = useState('');

  const volume30D = useMemo(() => {
    if (userStats.makerVolume30D !== undefined && userStats.takerVolume30D !== undefined) {
      return userStats.makerVolume30D + userStats.takerVolume30D;
    }
    return 0;
  }, [userStats.makerVolume30D, userStats.takerVolume30D]);

  const progressPercent = Math.min((volume30D / VOLUME_THRESHOLD) * 100, 100);
  const isChatUnlocked = volume30D >= VOLUME_THRESHOLD;
  const volumeRemaining = Math.max(VOLUME_THRESHOLD - volume30D, 0);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        avatar: '\ud83d\udc64',
        username: dydxAddress ?? 'anonymous',
        message: trimmed,
      },
    ]);
    setInputValue('');
  }, [inputValue, dydxAddress]);

  const messagesRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    estimateSize: () => 28,
    getScrollElement: () => messagesRef.current,
    measureElement: (el) => el.getBoundingClientRect().height,
    gap: 12,
    paddingStart: 12,
    paddingEnd: 12,
  });

  useEffect(() => {
    rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
  }, [messages.length, rowVirtualizer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSend();
    },
    [handleSend]
  );

  return (
    <$Content>
      <$Messages ref={messagesRef}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const msg = messages[virtualRow.index]!;
            return (
              <$VirtualMessage
                key={msg.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span>
                  <$Username>{msg.username}:</$Username> {msg.message}
                </span>
              </$VirtualMessage>
            );
          })}
        </div>
      </$Messages>

      <$Footer>
        {!isChatUnlocked ? (
          <$VolumeCard>
            <$VolumeHeader>
              <span>Trade to unlock chat</span>
              <$Percent>{Math.round(progressPercent)}%</$Percent>
            </$VolumeHeader>
            <$ProgressBar>
              <$ProgressFill style={{ width: `${progressPercent}%` }} />
            </$ProgressBar>
            <$VolumeDetails>
              <$VolumeDetail>
                30D Vol:
                <Output type={OutputType.CompactFiat} value={volume30D} />
              </$VolumeDetail>
              <$VolumeDetail>
                <Output type={OutputType.CompactFiat} value={volumeRemaining} />
                vol. to unlock
              </$VolumeDetail>
            </$VolumeDetails>
          </$VolumeCard>
        ) : (
          <$InputRow>
            <$ChatInput
              placeholder={isChatUnlocked ? 'Send a message...' : 'Chat locked'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isChatUnlocked}
            />
            <$SendButton onClick={handleSend} disabled={!isChatUnlocked || !inputValue.trim()}>
              <SendIcon />
            </$SendButton>
          </$InputRow>
        )}
      </$Footer>
    </$Content>
  );
};

const $Body = styled.div<{ $isOpen: boolean }>`
  height: ${({ $isOpen }) => ($isOpen ? BODY_HEIGHT : '0')};
  transition: height 0.3s var(--ease-out-expo);
  overflow: hidden;
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  height: ${BODY_HEIGHT};
`;

const $Messages = styled.div`
  ${layoutMixins.scrollArea}
  flex: 1;
  overflow-y: auto;
`;

const $VirtualMessage = styled.div`
  ${layoutMixins.row}
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 1rem;
  font: var(--font-small-book);
  color: var(--color-text-0);
`;

const $Username = styled.span`
  font: var(--font-small-bold);
  color: var(--color-text-2);
`;

const $Footer = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
`;

const $VolumeCard = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-layer-4);
  border-radius: 0.5rem;
`;

const $VolumeHeader = styled.div`
  ${layoutMixins.spacedRow}
  font: var(--font-base-book);
  color: var(--color-text-2);
`;

const $Percent = styled.span`
  color: var(--color-accent);
  font: var(--font-base-bold);
`;

const $ProgressBar = styled.div`
  height: 0.375rem;
  border-radius: 0.1875rem;
  background-color: var(--color-layer-6);
  overflow: hidden;
`;

const $ProgressFill = styled.div`
  height: 100%;
  border-radius: 0.125rem;
  background-color: var(--color-accent);
`;

const $VolumeDetails = styled.div`
  ${layoutMixins.row}
  justify-content: space-between;
  font: var(--font-small-book);
  color: var(--color-text-0);
`;

const $VolumeDetail = styled.span`
  ${layoutMixins.row}
  justify-content: space-between;
  gap: 0.25rem;
`;

const $InputRow = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
`;

const $ChatInput = styled.input`
  flex: 1;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-layer-4);
  font: var(--font-small-book);
  color: var(--color-text-0);

  &::placeholder {
    color: var(--color-text-0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const $SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: none;
  background-color: var(--color-layer-4);
  color: var(--color-text-0);
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
