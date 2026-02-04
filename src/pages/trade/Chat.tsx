import { useEffect, useRef, useState } from 'react';

import { io, Socket } from 'socket.io-client';
import styled from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputType } from '@/components/Input';

import liquidationSound from '@/assets/liquidation.mp3';
import loseSound from '@/assets/lose.mp3';
import openPositionSound from '@/assets/open_position.mp3';
import winSound from '@/assets/win.mp3';

export type ChatMessage = {
  id: string;
  content: string;
  timestamp: Date;
  username: string;
  userColor: string;
  type?: string;
  amount?: number;
  market?: string;
  side?: 'long' | 'short';
  price?: number;
  pnl?: number;
};

type ElementProps = {
  className?: string;
};

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E',
  '#6C5CE7', '#00B894', '#E17055', '#0984E3', '#B2BEC3',
];

const getRandomColor = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

const truncateAddress = (address: string) => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const INTERVAL_FILTERS = ['All', '$1000', '$10000', '$100000', '$1000000'] as const;
type IntervalFilter = typeof INTERVAL_FILTERS[number];

export const Chat = ({ className }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const [selectedInterval, setSelectedInterval] = useState<IntervalFilter>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const userColorMapRef = useRef<Map<string, string>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 100; // pixels from bottom to consider "at bottom"
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Get user color for a username
  const getUserColor = (user: string) => {
    if (!userColorMapRef.current.has(user)) {
      userColorMapRef.current.set(user, getRandomColor());
    }
    return userColorMapRef.current.get(user) || getRandomColor();
  };

  // Initialize socket connection
  useEffect(() => {
    const SERVER_URL = 'https://dydx-chat.onrender.com';
    const socketInstance = io(SERVER_URL);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to chat server');
      const generateDummyDydxAddress = () => {
        const chars = '0123456789abcdefghjkmnpqrstuvwxyz'; // bech32 charset (excluding 1, b, i, o)
        let address = 'dydx1';
        for (let i = 0; i < 38; i++) {
          address += chars[Math.floor(Math.random() * chars.length)];
        }
        return address;
      };
      const usernameToUse = dydxAddress || generateDummyDydxAddress();
      socketInstance.emit('setUsername', usernameToUse);
      setUsername(usernameToUse);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    socketInstance.on('message', (data: {
      username?: string;
      content: string;
      timestamp: string;
      type: string;
      pnl?: number;
    }) => {
      console.log('📩 Received message:', data);
      const messageUsername = data.username || 'Anonymous';
      const newMessage: ChatMessage = {
        id: `${messageUsername}-${Date.now()}`,
        content: data.content,
        timestamp: new Date(data.timestamp),
        username: messageUsername,
        userColor: getUserColor(messageUsername),
        type: data.type,
      };
      setMessages((prev) => [...prev, newMessage]);

      // Play appropriate sound based on message type
      if (data.type === 'liquidation') {
        console.log('🔊 Attempting to play liquidation sound:', liquidationSound);
        const audio = new Audio(liquidationSound);
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            console.log('✅ Liquidation audio played successfully');
          })
          .catch((error) => {
            console.error('❌ Error playing liquidation audio:', error);
          });
      } else if (data.type === 'position_open') {
        console.log('🔊 Attempting to play position open');
        const audio = new Audio(openPositionSound);
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            console.log('✅ Position audio played successfully');
          })
          .catch((error) => {
            console.error('❌ Error playing position audio:', error);
          });
      } else if (data.type === 'position_close') {
        const pnl = data.pnl || 0;
        const soundToPlay = pnl > 0 ? winSound : loseSound;
        const soundType = pnl > 0 ? 'win' : 'lose';
        console.log(`🔊 Attempting to play ${soundType} sound (PnL: ${pnl}):`, soundToPlay);
        const audio = new Audio(soundToPlay);
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            console.log(`✅ ${soundType} audio played successfully`);
          })
          .catch((error) => {
            console.error(`❌ Error playing ${soundType} audio:`, error);
          });
      }
    });

    socketInstance.on('liquidationMessage', (data: {
      username?: string;
      content: string;
      timestamp: string;
      type: string;
      amount: number;
      market: string;
      side: 'long' | 'short';
    }) => {
      console.log('🔴 Received liquidation:', data);
      const messageUsername = data.username || 'Anonymous';
      const newMessage: ChatMessage = {
        id: `${messageUsername}-${Date.now()}-liquidation`,
        content: data.content,
        timestamp: new Date(data.timestamp),
        username: messageUsername,
        userColor: getUserColor(messageUsername),
        type: 'liquidation',
        amount: data.amount,
        market: data.market,
        side: data.side,
      };
      setMessages((prev) => [...prev, newMessage]);

      // Play sound when liquidation occurs
      console.log('🔊 Attempting to play liquidation sound:', liquidationSound);
      const audio = new Audio(liquidationSound);
      audio.volume = 1.0;
      audio.play()
        .then(() => {
          console.log('✅ Liquidation audio played successfully');
        })
        .catch((error) => {
          console.error('❌ Error playing liquidation audio:', error);
        });
    });

    socketInstance.on('positionMessage', (data: {
      username?: string;
      content: string;
      timestamp: string;
      type: "position_open" | "position_close";
      amount: number;
      price: number;
      side: 'long' | 'short';
      pnl?: number;
    }) => {
      console.log('📊 Received position:', data);
      const messageUsername = data.username || 'Anonymous';
      const newMessage: ChatMessage = {
        id: `${messageUsername}-${Date.now()}-position`,
        content: data.content,
        timestamp: new Date(data.timestamp),
        username: messageUsername,
        userColor: getUserColor(messageUsername),
        type: data.type,
        amount: data.amount,
        price: data.price,
        side: data.side,
        pnl: data.pnl,
      };
      setMessages((prev) => [...prev, newMessage]);

     if (data.type === 'position_open') {
        console.log('🔊 Attempting to play position open');
        const audio = new Audio(openPositionSound);
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            console.log('✅ Position audio played successfully');
          })
          .catch((error) => {
            console.error('❌ Error playing position audio:', error);
          });
      } else if (data.type === 'position_close') {
        const pnl = data.pnl || 0;
        const soundToPlay = pnl > 0 ? winSound : loseSound;
        const soundType = pnl > 0 ? 'win' : 'lose';
        console.log(`🔊 Attempting to play ${soundType} sound (PnL: ${pnl}):`, soundToPlay);
        const audio = new Audio(soundToPlay);
        audio.volume = 1.0;
        audio.play()
          .then(() => {
            console.log(`✅ ${soundType} audio played successfully`);
          })
          .catch((error) => {
            console.error(`❌ Error playing ${soundType} audio:`, error);
          });
      }
    });


    socketInstance.on('userJoined', (data: { username: string }) => {
      console.log('👋 User joined:', data);
    });

    socketInstance.on('userLeft', (data: { username: string }) => {
      console.log('👋 User left:', data);
    });

    socketInstance.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [dydxAddress]);

  useEffect(() => {
    if (isAtBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        const popup = document.getElementById('filter-popup');
        if (popup && !popup.contains(event.target as Node)) {
          setIsFilterOpen(false);
        }
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket) return;

    // Emit message to socket
    socket.emit('sendMessage', {
      type: 'text',
      content: inputValue,
    });

    setInputValue('');
  };

  return (
    <$Container className={className} onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    }}>
      <$FilterToggleButton
        ref={filterButtonRef}
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        $isActive={isFilterOpen}
      >
        <Icon iconName={IconName.Filter} />
        Filter
      </$FilterToggleButton>

      {isFilterOpen && (
        <$FilterPopup id="filter-popup">
          <$FilterPopupHeader>Position Size Filter</$FilterPopupHeader>
          <$FilterPopupButtons>
            {INTERVAL_FILTERS.map((interval) => (
              <$FilterButton
                key={interval}
                $isActive={selectedInterval === interval}
                onClick={() => {
                  setSelectedInterval(interval);
                  setIsFilterOpen(false);
                }}
              >
                {interval}
              </$FilterButton>
            ))}
          </$FilterPopupButtons>
        </$FilterPopup>
      )}

      <$MessagesContainer>
        <$MessagesList ref={scrollContainerRef}>
          {messages.map((message) => {
            if (message.type === 'liquidation') {
              return (
                <$LiquidationMessageRow key={message.id}>
                  <$Timestamp>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </$Timestamp>
                  <$LiquidationIcon>🔴</$LiquidationIcon>
                  <$Username $color={message.userColor}>{truncateAddress(message.username)}</$Username>
                  <$LiquidationBadge>LIQUIDATED</$LiquidationBadge>
                  {message.market && <$DetailItem>{message.market}</$DetailItem>}
                  {message.side && <$DetailItem $side={message.side}>{message.side.toUpperCase()}</$DetailItem>}
                  {message.amount && <$DetailItem $highlight>${message.amount.toLocaleString()}</$DetailItem>}
                </$LiquidationMessageRow>
              );
            }

            if (message.type === 'position_open') {
              return (
                <$PositionMessageRow key={message.id}>
                  <$Timestamp>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </$Timestamp>
                  <$PositionIcon>📊</$PositionIcon>
                  <$Username $color={message.userColor}>{truncateAddress(message.username)}</$Username>
                  <$PositionBadge>OPENED POSITION</$PositionBadge>
                  {message.side && <$DetailItem $side={message.side}>{message.side.toUpperCase()}</$DetailItem>}
                  {message.amount && <$DetailItem>Amount: {message.amount}</$DetailItem>}
                  {message.price && <$DetailItem $highlight>${message.price.toLocaleString()}</$DetailItem>}
                </$PositionMessageRow>
              );
            }

            if (message.type === 'position_close') {
              const pnl = message.pnl || 0;
              const isProfit = pnl > 0;
              return (
                <$CloseMessageRow key={message.id} $isProfit={isProfit}>
                  <$Timestamp>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </$Timestamp>
                  <$CloseIcon>{isProfit ? '💰' : '📉'}</$CloseIcon>
                  <$Username $color={message.userColor}>{truncateAddress(message.username)}</$Username>
                  <$CloseBadge $isProfit={isProfit}>CLOSED POSITION</$CloseBadge>
                  {message.side && <$DetailItem $side={message.side}>{message.side.toUpperCase()}</$DetailItem>}
                  {message.amount && <$DetailItem>Amount: {message.amount}</$DetailItem>}
                  {message.price && <$DetailItem>${message.price.toLocaleString()}</$DetailItem>}
                  <$PnlItem $isProfit={isProfit}>
                    PnL: {isProfit ? '+' : ''}${pnl.toLocaleString()}
                  </$PnlItem>
                </$CloseMessageRow>
              );
            }

            return (
              <$MessageRow key={message.id}>
                <$Timestamp>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </$Timestamp>
                <$Username $color={message.userColor}>{truncateAddress(message.username)}:</$Username>
                <$MessageContent>{message.content}</$MessageContent>
              </$MessageRow>
            );
          })}
          <div ref={messagesEndRef} />
        </$MessagesList>
      </$MessagesContainer>

      <$InputContainer>
        <$InputWrapper>
          <Input
            type={InputType.Text}
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          />
        </$InputWrapper>

        <IconButton
          iconName={IconName.Send}
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          shape={ButtonShape.Square}
          size={ButtonSize.Small}
        />
      </$InputContainer>
    </$Container>
  );
};

const $Container = styled.div`
  ${layoutMixins.contentContainer}
  ${layoutMixins.scrollArea}

  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-layer-2);
  position: relative;
  width: 60%;
`;

const $FilterButton = styled.button<{ $isActive: boolean }>`
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.25rem;
  border: var(--border-width) solid ${({ $isActive }) =>
    $isActive ? 'var(--color-accent)' : 'transparent'};
  background-color: ${({ $isActive }) =>
    $isActive ? 'var(--color-accent)' : 'var(--color-layer-4)'};
  color: ${({ $isActive }) =>
    $isActive ? 'var(--color-text-2)' : 'var(--color-text-1)'};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  text-align: left;

  &:hover {
    background-color: ${({ $isActive }) =>
      $isActive ? 'var(--color-accent)' : 'var(--color-layer-5)'};
    border-color: ${({ $isActive }) =>
      $isActive ? 'var(--color-accent)' : 'var(--color-layer-6)'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const $MessagesContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const $MessagesList = styled.div`
  ${layoutMixins.scrollArea}

  flex: 1;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  overflow-y: auto;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 0.375rem;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-layer-6);
    border-radius: 0.25rem;

    &:hover {
      background: var(--color-layer-7);
    }
  }
`;

const $MessageRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 0.25rem 0.375rem;
  line-height: 1.4;
  font-size: 1rem;

  &:hover {
    background-color: var(--color-layer-3);
  }

  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const $Timestamp = styled.span`
  color: var(--color-text-0);
  opacity: 0.4;
  font-size: 0.6875rem;
  flex-shrink: 0;
  user-select: none;
`;

const $Username = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-weight: 600;
  flex-shrink: 0;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const $MessageContent = styled.span`
  color: var(--color-text-1);
  word-break: break-word;
  flex: 1;
`;

const $InputContainer = styled.div`
  ${layoutMixins.row}

  padding: 0.75rem 1rem;
  gap: 0.75rem;
  background-color: var(--color-layer-1);
  border-top: var(--border-width) solid var(--color-layer-6);
  align-items: center;
  width: 100%;
`;

const $FilterToggleButton = styled.button<{ $isActive: boolean }>`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 50;

  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 1.5rem;
  border: var(--border-width) solid ${({ $isActive }) =>
    $isActive ? 'var(--color-accent)' : 'var(--color-layer-6)'};
  background-color: ${({ $isActive }) =>
    $isActive ? 'var(--color-accent)' : 'var(--color-layer-3)'};
  color: ${({ $isActive }) =>
    $isActive ? 'var(--color-text-2)' : 'var(--color-text-1)'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: ${({ $isActive }) =>
      $isActive ? 'var(--color-accent)' : 'var(--color-layer-4)'};
    border-color: ${({ $isActive }) =>
      $isActive ? 'var(--color-accent)' : 'var(--color-layer-7)'};
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const $FilterPopup = styled.div`
  position: absolute;
  top: 3.25rem;
  right: 0.75rem;
  z-index: 100;

  background-color: var(--color-layer-3);
  border: var(--border-width) solid var(--color-layer-6);
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  min-width: 10rem;
  max-width: 12rem;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const $FilterPopupHeader = styled.div`
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--color-text-0);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
  padding-bottom: 0.375rem;
  border-bottom: var(--border-width) solid var(--color-layer-5);
`;

const $FilterPopupButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const $InputWrapper = styled.div`
  flex: 1;
  width: 100%;

  input {
    width: 100%;
    background-color: var(--color-layer-3);
    border: var(--border-width) solid var(--color-layer-5);
    border-radius: 1.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    color: var(--color-text-1);
    transition: all 0.2s ease;

    &::placeholder {
      color: var(--color-text-0);
      opacity: 0.5;
    }

    &:hover {
      border-color: var(--color-layer-6);
      background-color: var(--color-layer-4);
    }

    &:focus {
      border-color: var(--color-accent);
      background-color: var(--color-layer-4);
      box-shadow: 0 0 0 1px var(--color-accent);
      outline: none;
    }
  }

  button {
    background-color: var(--color-accent);
    color: var(--color-text-2);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background-color: var(--color-accent-dark);
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
`;

const $LiquidationMessageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(
    90deg,
    rgba(239, 68, 68, 0.1) 0%,
    rgba(239, 68, 68, 0.05) 50%,
    transparent 100%
  );
  border-left: 3px solid #ef4444;
  border-radius: 0.375rem;
  margin: 0.125rem 0;
  animation: liquidationPulse 0.3s ease-out;
  flex-wrap: wrap;
  line-height: 1.4;
  font-size: 1rem;

  &:hover {
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.15) 0%,
      rgba(239, 68, 68, 0.08) 50%,
      transparent 100%
    );
  }

  @keyframes liquidationPulse {
    0% {
      transform: scale(0.98);
      opacity: 0;
    }
    50% {
      transform: scale(1.01);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const $LiquidationIcon = styled.span`
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
`;

const $LiquidationBadge = styled.span`
  font-size: 0.625rem;
  font-weight: 700;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  letter-spacing: 0.05em;
  border: 1px solid rgba(239, 68, 68, 0.3);
`;

const $DetailItem = styled.span<{ $side?: 'long' | 'short'; $highlight?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: ${({ $side, $highlight }) => {
    if ($highlight) return 'rgba(239, 68, 68, 0.2)';
    if ($side === 'long') return 'rgba(34, 197, 94, 0.15)';
    if ($side === 'short') return 'rgba(239, 68, 68, 0.15)';
    return 'var(--color-layer-4)';
  }};
  color: ${({ $side, $highlight }) => {
    if ($highlight) return '#ef4444';
    if ($side === 'long') return '#22c55e';
    if ($side === 'short') return '#ef4444';
    return 'var(--color-text-1)';
  }};
  border: 1px solid ${({ $side, $highlight }) => {
    if ($highlight) return 'rgba(239, 68, 68, 0.3)';
    if ($side === 'long') return 'rgba(34, 197, 94, 0.3)';
    if ($side === 'short') return 'rgba(239, 68, 68, 0.3)';
    return 'var(--color-layer-5)';
  }};
`;

const $LiquidationMessage = styled.span`
  font-size: 0.8125rem;
  color: var(--color-text-0);
  font-style: italic;
  line-height: 1.4;
`;

const $PositionMessageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.5rem;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(59, 130, 246, 0.05) 50%,
    transparent 100%
  );
  border-left: 3px solid #3b82f6;
  border-radius: 0.375rem;
  margin: 0.125rem 0;
  animation: positionPulse 0.3s ease-out;

  &:hover {
    background: linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(59, 130, 246, 0.08) 50%,
      transparent 100%
    );
  }

  @keyframes positionPulse {
    0% {
      transform: scale(0.98);
      opacity: 0;
    }
    50% {
      transform: scale(1.01);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const $PositionIcon = styled.span`
  font-size: 1rem;
  line-height: 1;
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const $PositionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
`;

const $PositionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const $PositionBadge = styled.span`
  font-size: 0.625rem;
  font-weight: 700;
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  letter-spacing: 0.05em;
  border: 1px solid rgba(59, 130, 246, 0.3);
`;

const $PositionDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
`;

const $PositionMessage = styled.span`
  font-size: 0.8125rem;
  color: var(--color-text-0);
  font-style: italic;
  line-height: 1.4;
`;

const $CloseMessageRow = styled.div<{ $isProfit: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(
    90deg,
    ${({ $isProfit }) =>
      $isProfit
        ? 'rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 50%, transparent 100%'
        : 'rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.05) 50%, transparent 100%'
    }
  );
  border-left: 3px solid ${({ $isProfit }) => $isProfit ? '#22c55e' : '#f97316'};
  border-radius: 0.375rem;
  margin: 0.125rem 0;
  animation: closePulse 0.3s ease-out;
  flex-wrap: wrap;
  line-height: 1.4;
  font-size: 1rem;

  &:hover {
    background: linear-gradient(
      90deg,
      ${({ $isProfit }) =>
        $isProfit
          ? 'rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 50%, transparent 100%'
          : 'rgba(249, 115, 22, 0.15) 0%, rgba(249, 115, 22, 0.08) 50%, transparent 100%'
      }
    );
  }

  @keyframes closePulse {
    0% {
      transform: scale(0.98);
      opacity: 0;
    }
    50% {
      transform: scale(1.01);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const $CloseIcon = styled.span`
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
`;

const $CloseBadge = styled.span<{ $isProfit: boolean }>`
  font-size: 0.625rem;
  font-weight: 700;
  color: ${({ $isProfit }) => $isProfit ? '#22c55e' : '#f97316'};
  background-color: ${({ $isProfit }) =>
    $isProfit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)'
  };
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  letter-spacing: 0.05em;
  border: 1px solid ${({ $isProfit }) =>
    $isProfit ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)'
  };
`;

const $PnlItem = styled.span<{ $isProfit: boolean }>`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: ${({ $isProfit }) =>
    $isProfit ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)'
  };
  color: ${({ $isProfit }) => $isProfit ? '#22c55e' : '#f97316'};
  border: 1px solid ${({ $isProfit }) =>
    $isProfit ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)'
  };
`;

const $CloseMessage = styled.span`
  font-size: 0.8125rem;
  color: var(--color-text-0);
  font-style: italic;
  line-height: 1.4;
`;
