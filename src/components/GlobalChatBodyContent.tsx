import { useCallback, useMemo, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { useVirtualizer } from '@tanstack/react-virtual';
import { isEmpty } from 'lodash';
import styled, { keyframes } from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAutoScrollToBottom } from '@/hooks/useAutoScrollToBottom';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTrollbox, VOLUME_THRESHOLD } from '@/hooks/useTrollbox';

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

const MESSAGE_CHARACTER_LIMIT = 255;
const MESSAGE_GAP_DISTANCE = 12;

export const GlobalChatBodyContent = () => {
  const { messages, isLoading, handleSendMessage, toasts, pushToast, dismissToast } = useTrollbox();

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

  if (isLoading) {
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
              <$ToastIcon iconName={IconName.Warning} />
              <$ToastMessage>{toast.message}</$ToastMessage>
              <$ToastDismissButton
                iconName={IconName.Close}
                shape={ButtonShape.Square}
                size={ButtonSize.XSmall}
                onClick={() => dismissToast(toast.id)}
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
      <ChatFooter onSendMessage={handleSendMessage} pushToast={pushToast} />
    </$Content>
  );
};

const ChatFooter = ({
  onSendMessage,
  pushToast,
}: {
  onSendMessage: (message: string) => void;
  pushToast: (message: string) => void;
}) => {
  const stringGetter = useStringGetter();
  const onboardingState = useAppSelector(getOnboardingState);
  const userStats = useAppSelector(BonsaiCore.account.stats.data);
  const statsStatus = useAppSelector((s) => s.raw.account.stats.status);
  const [inputValue, setInputValue] = useState('');

  const isLoggedIn = onboardingState === OnboardingState.AccountConnected;
  const isStatsLoading = statsStatus === 'pending' && userStats.makerVolume30D == null;

  const volume30D = useMemo(
    () => (userStats.makerVolume30D ?? 0) + (userStats.takerVolume30D ?? 0),
    [userStats.makerVolume30D, userStats.takerVolume30D]
  );

  const progressPercent = Math.min((volume30D / VOLUME_THRESHOLD) * 100, 100);
  const isChatLocked = !isStatsLoading && volume30D < VOLUME_THRESHOLD;
  const volumeRemaining = Math.max(VOLUME_THRESHOLD - volume30D, 0);

  const isOverLimit = inputValue.length > MESSAGE_CHARACTER_LIMIT;

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (isEmpty(trimmed)) return;

    if (isOverLimit) {
      pushToast(
        stringGetter({
          key: STRING_KEYS.MESSAGE_TOO_LONG,
          params: { CHARACTER_LIMIT: MESSAGE_CHARACTER_LIMIT },
        })
      );
      return;
    }

    onSendMessage(inputValue);
    setInputValue('');
  }, [inputValue, isOverLimit, onSendMessage, pushToast, stringGetter]);

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
            <span>{stringGetter({ key: STRING_KEYS.TRADE_TO_UNLOCK_CHAT })}</span>
            <$Percent>{Math.round(progressPercent)}%</$Percent>
          </$VolumeHeader>
          <$ProgressBar>
            <$ProgressFill $percent={progressPercent} />
          </$ProgressBar>
          <$VolumeDetails>
            <$VolumeDetail>
              {stringGetter({ key: STRING_KEYS.THIRTY_DAY_VOLUME })}
              <Output type={OutputType.CompactFiat} value={volume30D} />
            </$VolumeDetail>
            <$VolumeDetail>
              <Output type={OutputType.CompactFiat} value={volumeRemaining} />
              {stringGetter({ key: STRING_KEYS.VOLUME_TO_UNLOCK })}
            </$VolumeDetail>
          </$VolumeDetails>
        </$VolumeCard>
      ) : (
        <$InputRow>
          <$ChatInput
            placeholder={stringGetter({ key: STRING_KEYS.SEND_A_MESSAGE })}
            value={inputValue}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
          />
          <$SendButton
            iconName={IconName.Send}
            onClick={handleSend}
            shape={ButtonShape.Square}
            action={ButtonAction.Base}
            state={{ isDisabled: isEmpty(inputValue.trim()) || isOverLimit }}
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
  padding: 0 1rem;
`;

const $VirtualList = styled.div<{ $height: number }>`
  height: ${({ $height }) => $height}px;
  position: relative;
`;

const $VirtualMessage = styled.div<{ $translateY: number }>`
  ${layoutMixins.row}
  position: absolute;
  width: 100%;
  align-items: flex-start;
  font: var(--font-small-book);
  color: var(--color-text-1);
  word-break: break-word;
  transform: translateY(${({ $translateY }) => $translateY}px);
`;

const $Username = styled.span<{ $color: string }>`
  font: var(--font-small-bold);
  margin-right: 0.25rem;
  color: ${({ $color }) => $color};
`;

const $Footer = styled.div`
  ${layoutMixins.flexColumn}
  position: relative;
  gap: 0.5rem;
  padding: 0.15rem 1rem 0.75rem 1rem;

  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    height: 1rem;
    background: linear-gradient(to top, var(--color-layer-1), transparent);
    pointer-events: none;
  }
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

const $SendButton = styled(IconButton)`
  --button-width: 2.25rem;
  --button-height: 2.25rem;
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

const $ToastIcon = styled(Icon)`
  font-size: 1rem;
  color: var(--color-warning);
`;

const $ToastDismissButton = styled(IconButton)`
  --button-border: none;
  --button-textColor: var(--color-text-0);
`;

const $ToastMessage = styled.span`
  flex: 1;
  color: var(--color-text-1);
`;
