import { useCallback, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isEmpty } from 'lodash';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape } from '@/constants/buttons';

import { useAccounts } from '@/hooks/useAccounts';
import { useAutoScrollToBottom } from '@/hooks/useAutoScrollToBottom';

import { layoutMixins } from '@/styles/layoutMixins';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { getColorForString } from '@/lib/colorUtils';
import { truncateAddress } from '@/lib/wallet';

import { IconName } from './Icon';
import { IconButton } from './IconButton';
import { LoadingSpinner } from './Loading/LoadingSpinner';
import { Output, OutputType } from './Output';

const DUMMY_MESSAGES = [
  { id: '1', username: 'dydx1a4r7f6stq2dce9hkv5pz3gy8kdu0t7gvq4n2m', message: 'ape this shit now' },
  { id: '2', username: 'dydx1k9w2hf4jp6rdnc5tq8vxm3ey7zu0s6la8b3fp', message: 'to the moon!!!!!' },
  {
    id: '3',
    username: 'dydx1v7c3xe2qn9fwh4pkl6ty8mrd0j5az3su2g9kb',
    message: 'long at 64k with a tp at 71k, sl at 61k. lock in frens',
  },
  {
    id: '4',
    username: 'dydx1p2n8rj5wm4qxk6lfv0ty3hd9cz7ea8ug6s4bw',
    message: 'aping this shit now',
  },
  { id: '5', username: 'dydx1h6t9yq3xr8fwn2kvd5mcj7pa4ez0lg6su1b8c', message: 'yolofam' },
  { id: '6', username: 'dydx1a4r7f6stq2dce9hkv5pz3gy8kdu0t7gvq4n2m', message: 'ape this shit now' },
  {
    id: '7',
    username: 'dydx1v7c3xe2qn9fwh4pkl6ty8mrd0j5az3su2g9kb',
    message: 'long at 64k with a tp at 71k, sl at 61k. lock in frens',
  },
  {
    id: '8',
    username: 'dydx1m3w6rj8qy5fpn2xkv4tld9hc7ea0zs6gu1b3f',
    message: 'just longed ETH lets gooo',
  },
  {
    id: '9',
    username: 'dydx1f8n2tc5xr7qwk3pvd6mhj4ya9ez0lg1su8b4c',
    message: 'who else is shorting this pump?',
  },
  {
    id: '10',
    username: 'dydx1d5k8rn2wq3fxm7pyv6tlj4hc9ea0zs1gu3b6f',
    message: 'BTC 100k end of month no cap',
  },
  {
    id: '11',
    username: 'dydx1j7m4tc9xr2qwn5fkd8vhp3ya6ez0lg1su4b7c',
    message: 'closed my short at 62k, taking profits while i can',
  },
  {
    id: '12',
    username: 'dydx1q9p6rk3wy5fxn8tvd2mlj7hc4ea0zs1gu6b3f',
    message: 'degen hours rn fr fr',
  },
  {
    id: '13',
    username: 'dydx1t2v8nc5xr3qwk7fmd6yhp4ja9ez0lg1su7b2c',
    message: 'this dip is free money',
  },
  {
    id: '14',
    username: 'dydx1w4x6rp8qy9ftn2mkd3vlj5hc7ea0zs1gu2b8f',
    message: 'opened a 10x long on SOL, wish me luck boys',
  },
  {
    id: '15',
    username: 'dydx1z6b3nc7xr5qwm9fkd8thp2ya4ez0lg1su9b5c',
    message: 'bears in shambles lmaooo',
  },
  { id: '16', username: 'dydx1c8d2rj4wy7fxp6tvn3mlk9hc5ea0zs1gu4b6f', message: 'gm degens' },
  {
    id: '17',
    username: 'dydx1e3f9nc6xr8qwt2fkd5vhp7ya1ez0lg4su2b3c',
    message: 'funding rate is crazy rn be careful',
  },
  {
    id: '18',
    username: 'dydx1g5h4rk8qy2fxn7tmd9wlj3hc6ea0zs1gu7b9f',
    message: 'shorted the top at 69k, tp at 63k. ez money',
  },
  {
    id: '19',
    username: 'dydx1l7n6tc3xr4qwp5fkd2yhm8ja9ez0lg1su5b4c',
    message: 'diamond hands only no paper hands allowed',
  },
  {
    id: '20',
    username: 'dydx1n9q8rj5wy6fxt3tvd7mlp4hc2ea0zs1gu3b7f',
    message: 'who got liquidated on that wick lol',
  },
  {
    id: '21',
    username: 'dydx1r2s4nc8xr7qwy9fkd6vht5ja3ez0lg1su8b6c',
    message: 'accumulating more on every dip',
  },
  {
    id: '22',
    username: 'dydx1u4w6rp3qy8fxn5tmd2klj9hc7ea0zs1gu5b2f',
    message: 'entry at 64.5k with 5x leverage, sl at 62k. not financial advice',
  },
  {
    id: '23',
    username: 'dydx1x6y3nc5xr9qwt7fkd4vhm2pa8ez0lg1su6b9c',
    message: 'alts about to send it watch',
  },
  {
    id: '24',
    username: 'dydx1b8a2rj7wy4fxp6tvn9mlk3hc5ea0zs1gu9b4f',
    message: 'just woke up what did i miss',
  },
  {
    id: '25',
    username: 'dydx1k9w2hf4jp6rdnc5tq8vxm3ey7zu0s6la8b3fp',
    message: 'told yall to buy the dip yesterday',
  },
  {
    id: '26',
    username: 'dydx1e3f8nc2xr6qwt4fkd7vhp9ya5ez0lg1su3b8c',
    message: 'this chat is bullish af',
  },
  {
    id: '27',
    username: 'dydx1g7h5rk9qy3fxn8tmd4wlj6hc2ea0zs1gu6b5f',
    message: 'ngmi if you are not longing here',
  },
];

const VOLUME_THRESHOLD = 100_000;

export const GlobalChatBodyContent = () => {
  const { dydxAddress } = useAccounts();
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  const handleSendMessage = useCallback(
    (message: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          username: dydxAddress ?? '',
          message,
        },
      ]);
    },
    [dydxAddress]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    estimateSize: () => 28,
    getScrollElement: () => scrollRef.current,
    measureElement: (el) => el.getBoundingClientRect().height,
    gap: 12,
    paddingStart: 12,
    paddingEnd: 12,
  });

  const { onScroll } = useAutoScrollToBottom({
    scrollRef,
    virtualizer: rowVirtualizer,
    itemCount: messages.length,
  });

  return (
    <$Content>
      <$Messages ref={scrollRef} onScroll={onScroll}>
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
                  <$Username $color={getColorForString(msg.username)}>
                    {truncateAddress(msg.username)}:
                  </$Username>
                  {msg.message}
                </span>
              </$VirtualMessage>
            );
          })}
        </div>
      </$Messages>
      <ChatFooter onSendMessage={handleSendMessage} />
    </$Content>
  );
};

const ChatFooter = ({ onSendMessage }: { onSendMessage: (message: string) => void }) => {
  const onboardingState = useAppSelector(getOnboardingState);
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const statsStatus = useAppSelector((s) => s.raw.account.stats.status);
  const [inputValue, setInputValue] = useState('');

  const isLoggedIn = onboardingState === OnboardingState.AccountConnected;
  const isStatsLoading = statsStatus === 'pending' && userStats.makerVolume30D == null;

  const volume30D = useMemo(() => {
    if (userStats.makerVolume30D == null || userStats.takerVolume30D == null) {
      return 0;
    }

    return userStats.makerVolume30D + userStats.takerVolume30D;
  }, [userStats.makerVolume30D, userStats.takerVolume30D]);

  const progressPercent = Math.min((volume30D / VOLUME_THRESHOLD) * 100, 100);
  const isChatLocked = !isStatsLoading && volume30D < VOLUME_THRESHOLD;
  const volumeRemaining = Math.max(VOLUME_THRESHOLD - volume30D, 0);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (isEmpty(trimmed)) return;
    onSendMessage(inputValue);
    setInputValue('');
  }, [inputValue, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSend();
    },
    [handleSend]
  );

  const handleOnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <$Footer>
      {!isLoggedIn ? (
        <OnboardingTriggerButton />
      ) : isStatsLoading ? (
        <LoadingSpinner tw="self-center" size="32" />
      ) : isChatLocked ? (
        <$VolumeCard>
          <$VolumeHeader>
            {/* TODO: Replace with localization all at once feature is complete */}
            <span>Trade to unlock chat</span>
            <$Percent>{Math.round(progressPercent)}%</$Percent>
          </$VolumeHeader>
          <$ProgressBar>
            <$ProgressFill $percent={progressPercent} />
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
            placeholder="Send a message..."
            value={inputValue}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
          />
          <IconButton
            iconName={IconName.Send}
            onClick={handleSend}
            shape={ButtonShape.Square}
            action={ButtonAction.Base}
            state={{ isDisabled: isEmpty(inputValue.trim()) }}
          />
        </$InputRow>
      )}
    </$Footer>
  );
};

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  height: 100%;
`;

const $Messages = styled.div`
  ${layoutMixins.scrollArea}
  padding: 0 1rem;
`;

const $VirtualMessage = styled.div`
  ${layoutMixins.row}
  position: absolute;
  align-items: flex-start;
  font: var(--font-small-book);
  color: var(--color-text-0);
`;

const $Username = styled.span<{ $color: string }>`
  font: var(--font-small-bold);
  margin-right: 0.25rem;
  color: ${({ $color }) => $color};
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

const $ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
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
`;
