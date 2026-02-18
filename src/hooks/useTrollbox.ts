import { useCallback, useEffect, useState } from 'react';

import { assertNever } from '@/lib/assertNever';
import { sendTrollboxMessage, subscribeToTrollbox } from '@/lib/streaming/trollboxStreaming';
import {
  type TrollboxChatMessage,
  type TrollboxUpdate,
  signTrollboxMessage,
} from '@/lib/trollboxUtils';

import { useAccounts } from './useAccounts';

const MAX_MESSAGES_IN_MEMORY = 1000;
const TOAST_AUTO_CLOSE_MS = 5_000;

export type ChatToast = {
  id: string;
  message: string;
};

export const useTrollbox = () => {
  const { dydxAddress, hdKey } = useAccounts();
  const [messages, setMessages] = useState<TrollboxChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ChatToast[]>([]);

  const pushToast = useCallback((message: string) => {
    const id = `chat-toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message }]);

    globalThis.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_AUTO_CLOSE_MS);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
          pushToast(update.error);
          break;
        default:
          assertNever(update);
      }
    });

    return unsubscribe;
  }, [pushToast]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (dydxAddress == null || hdKey?.privateKey == null) return;

      try {
        const payload = await signTrollboxMessage(text, dydxAddress, hdKey.privateKey);
        sendTrollboxMessage(payload);
      } catch (error) {
        pushToast(`Failed to send message: ${error}`);
      }
    },
    [dydxAddress, hdKey?.privateKey, pushToast]
  );

  return { messages, handleSendMessage, isLoaded, toasts, pushToast, dismissToast };
};
