import { useCallback, useEffect, useState } from 'react';

import { assertNever } from '@/lib/assertNever';
import { sendTrollboxMessage, subscribeToTrollbox } from '@/lib/streaming/trollboxStreaming';
import { type TrollboxChatMessage, type TrollboxUpdate, signTrollboxMessage } from '@/lib/trollbox';

import { useAccounts } from './useAccounts';

const MAX_MESSAGES_IN_MEMORY = 1000;

export const useTrollbox = () => {
  const { dydxAddress, hdKey } = useAccounts();
  const [messages, setMessages] = useState<TrollboxChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTrollbox((update: TrollboxUpdate) => {
      switch (update.type) {
        case 'history':
          setMessages(update.messages);
          setIsLoaded(true);
          break;
        case 'message':
          setMessages((prev) => {
            const next = [...prev, update.message];
            return next.length > MAX_MESSAGES_IN_MEMORY
              ? next.slice(-MAX_MESSAGES_IN_MEMORY)
              : next;
          });
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error('Dydx chat error:', update.error);
          break;
        default:
          assertNever(update);
      }
    });

    return unsubscribe;
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (dydxAddress == null || hdKey?.privateKey == null) return;

      try {
        const payload = await signTrollboxMessage(text, dydxAddress, hdKey.privateKey);
        sendTrollboxMessage(payload);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to sign/send trollbox message:', error);
      }
    },
    [dydxAddress, hdKey?.privateKey]
  );

  return { messages, handleSendMessage, isLoaded };
};
