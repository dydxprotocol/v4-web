import { useCallback, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isEmpty } from 'lodash';
import styled, { keyframes } from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';

import { useAutoScrollToBottom } from '@/hooks/useAutoScrollToBottom';
import { useTrollbox } from '@/hooks/useTrollbox';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { getColorForString } from '@/lib/colorUtils';
import { truncateAddress } from '@/lib/wallet';

import { Icon, IconName } from './Icon';
import { IconButton } from './IconButton';
import { LoadingSpinner } from './Loading/LoadingSpinner';
import { Output, OutputType } from './Output';

const VOLUME_THRESHOLD = 1000;
const MESSAGE_GAP_DISTANCE = 12;

export const GlobalChatBodyContent = () => {
  const { messages, handleSendMessage, isLoaded, toasts, dismissToast } = useTrollbox();

  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    estimateSize: () => 28,
    getScrollElement: () => scrollRef.current,
    measureElement: (el) => el.getBoundingClientRect().height,
    gap: MESSAGE_GAP_DISTANCE,
    paddingStart: MESSAGE_GAP_DISTANCE,
    paddingEnd: MESSAGE_GAP_DISTANCE,
  });

  const { onScroll } = useAutoScrollToBottom({
    scrollRef,
    virtualizer: rowVirtualizer,
    itemCount: messages.length,
  });

  if (!isLoaded) {
    return (
      <$LoadingContent>
        <LoadingSpinner size="32" />
      </$LoadingContent>
    );
  }

  return (
    <$Content>
      {toasts.length > 0 && (
        <$ToastContainer>
          {toasts.map((toast) => (
            <$Toast key={toast.id}>
              <Icon iconName={IconName.Warning} tw="text-[1rem] text-color-warning" />
              <$ToastMessage>{toast.message}</$ToastMessage>
              <IconButton
                iconName={IconName.Close}
                shape={ButtonShape.Square}
                size={ButtonSize.XSmall}
                onClick={() => dismissToast(toast.id)}
                tw="[--button-border:none] [--button-textColor:var(--color-text-0)]"
              />
            </$Toast>
          ))}
        </$ToastContainer>
      )}
      <$Messages ref={scrollRef} onScroll={onScroll}>
        <$VirtualList $height={rowVirtualizer.getTotalSize()}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const msg = messages[virtualRow.index]!;
            return (
              <$VirtualMessage
                key={msg.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                $translateY={virtualRow.start}
              >
                <span>
                  <$Username $color={getColorForString(msg.from)}>
                    {truncateAddress(msg.from)}:
                  </$Username>
                  {msg.message}
                </span>
              </$VirtualMessage>
            );
          })}
        </$VirtualList>
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

const $LoadingContent = styled.div`
  ${layoutMixins.flexColumn}
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const $Content = styled.div`
  ${layoutMixins.flexColumn}
  position: relative;
  height: 100%;
`;

const $Messages = styled.div`
  ${layoutMixins.scrollArea}
  flex: 1;
  min-height: 0;
  padding: 0 1rem;
`;

const $VirtualList = styled.div<{ $height: number }>`
  height: ${({ $height }) => $height}px;
  position: relative;
`;

const $VirtualMessage = styled.div<{ $translateY: number }>`
  ${layoutMixins.row}
  position: absolute;
  align-items: flex-start;
  font: var(--font-small-book);
  color: var(--color-text-1);
  transform: translateY(${({ $translateY }) => $translateY}px);
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
  color: var(--color-text-1);

  &::placeholder {
    color: var(--color-text-0);
  }
`;

const toastSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
`;

const $ToastContainer = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;
  position: absolute;
  top: 0;
  left: 0.5rem;
  right: 0.5rem;
  z-index: 1;
  padding-top: 0.5rem;
`;

const $Toast = styled.div`
  ${popoverMixins.popover}
  ${layoutMixins.row}
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  gap: 0.5rem;
  align-items: center;
  box-shadow: 0 0 0.5rem 0.1rem var(--color-layer-2);
  animation: ${toastSlideIn} 0.3s var(--ease-out-expo);
`;

const $ToastMessage = styled.span`
  flex: 1;
  color: var(--color-text-1);
`;
