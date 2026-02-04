import { useEffect, useRef, useState } from 'react';

import xLogo from '@/assets/x-logo.png';
import { io, Socket } from 'socket.io-client';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';


export type FeedMessage = {
  id: string;
  content: string;
  timestamp: Date;
  username: string;
  userColor: string;
  likes?: number;
  retweets?: number;
  type?: string;
  link?: string;
  profileImageUrl?: string;
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

export const TwitterFeed = ({ className }: ElementProps) => {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userColorMapRef = useRef<Map<string, string>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 150; // pixels from bottom to consider "at bottom"
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  const handleScroll = () => {
    const atBottom = isAtBottom();
    if (atBottom !== shouldAutoScroll) {
      setShouldAutoScroll(atBottom);
    }
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
    const SERVER_URL = 'https://dydx-chat-1.onrender.com/';
    const socketInstance = io(SERVER_URL);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to Twitter feed server');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Twitter feed server');
    });

    socketInstance.on('tweet', (data: {
      userName?: string;
      username?: string;
      tweet?: string;
      content?: string;
      timestamp?: string;
      type?: string;
      likes?: number;
      retweets?: number;
      link?: string;
      profileImageUrl?: string;
    }) => {
      console.log('📱 Received feed message:', data);
      // Support both old and new format
      const messageUsername = data.userName || data.username || 'Anonymous';
      const messageContent = data.tweet || data.content || '';
      const newMessage: FeedMessage = {
        id: `${messageUsername}-${Date.now()}`,
        content: messageContent,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        username: messageUsername,
        userColor: getUserColor(messageUsername),
        likes: data.likes || 0,
        retweets: data.retweets || 0,
        type: data.type,
        link: data.link,
        profileImageUrl: data.profileImageUrl,
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    socketInstance.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [shouldAutoScroll]);

  return (
      <$FeedContainer>
        <$AISummarySection>
          <$AISummaryHeader>
            <$AIIcon>🤖</$AIIcon>
            AI Summary
          </$AISummaryHeader>
          <$AISummaryText>
            Bitcoin fell below $75,000, triggering automated selling and liquidations across platforms,
            leading to over $240 million in Bitcoin positions liquidated in one day.
          </$AISummaryText>
        </$AISummarySection>
        <$FeedList ref={scrollContainerRef}>
          {messages.map((message) => {
            const TweetCardContent = (
              <$TweetRow>
                <$Avatar $color={message.userColor}>
                  {message.profileImageUrl ? (
                    <$AvatarImage src={message.profileImageUrl} alt={message.username} />
                  ) : (
                    message.username.slice(0, 2).toUpperCase()
                  )}
                </$Avatar>

                <$TweetBody>
                  <$TweetHeader>
                    <$Username $color={message.userColor}>
                      {truncateAddress(message.username)}
                    </$Username>
                    <$Timestamp>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </$Timestamp>
                    <$XLogo src={xLogo} alt="X" />
                  </$TweetHeader>
                  <$TweetContent>{message.content}</$TweetContent>
                </$TweetBody>
              </$TweetRow>
            );

            return message.link ? (
              <$TweetCard
                key={message.id}
                as="a"
                href={message.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {TweetCardContent}
              </$TweetCard>
            ) : (
              <$TweetCard key={message.id}>
                {TweetCardContent}
              </$TweetCard>
            );
          })}
          <div ref={messagesEndRef} />
        </$FeedList>
      </$FeedContainer>
  );
};

const $Container = styled.div`
  ${layoutMixins.contentContainer}
  ${layoutMixins.scrollArea}

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--color-layer-2);
`;

const $FeedContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 40%;
  height: 100%;
  min-height: 0;
  border-right: var(--border-width) solid var(--color-layer-6);
`;

const $FeedHeader = styled.div`
  padding: 1rem;
  border-bottom: var(--border-width) solid var(--color-layer-6);
  background-color: var(--color-layer-2);
`;

const $FeedTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-1);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const $AISummarySection = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.75rem 1rem;
  background: linear-gradient(
    180deg,
    rgba(124, 58, 237, 0.45) 0%,
    rgba(90, 33, 182, 0.32) 35%,
    rgba(31, 15, 61, 0.18) 65%,
    rgba(19, 20, 28, 0) 100%
  );
  color: #fff;
`;

const $AISummaryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.4rem;
`;

const $AIIcon = styled.span`
  font-size: 1rem;
  line-height: 1;
  color: #c7b5ff;
`;

const $AISummaryText = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  margin: 0;
`;

const $LiveIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #22c55e;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

const $FeedList = styled.div`
  ${layoutMixins.scrollArea}

  flex: 1;
  display: flex;
  flex-direction: column;
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

const $TweetCard = styled.div`
  padding: 0.875rem 1rem;
  border-bottom: var(--border-width) solid var(--color-layer-5);
  transition: background-color 0.2s ease;
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;

  &:hover {
    background-color: var(--color-layer-3);
  }

  animation: fadeInSlide 0.3s ease-out;

  @keyframes fadeInSlide {
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

const $TweetRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const $TweetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  position: relative;
`;

const $XLogo = styled.img`
  width: 1rem;
  height: 1rem;
  margin-left: auto;
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
`;

const $Avatar = styled.div<{ $color: string }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
`;

const $TweetMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
`;

const $TweetBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const $AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const $Username = styled.span<{ $color: string }>`
  color: var(--color-text-1);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const $Timestamp = styled.span`
  color: var(--color-text-0);
  opacity: 0.6;
  font-size: 0.75rem;
`;

const $TweetContent = styled.div`
  color: var(--color-text-1);
  font-size: 0.9375rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  word-break: break-word;
`;

const $TweetActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 0.5rem;
`;

const $ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--color-text-0);
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-accent);
  }
`;

const $ActionIcon = styled.span`
  font-size: 1rem;
  line-height: 1;
`;

const $ActionCount = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-0);
`;
