import { useCallback, useEffect, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import {
  ITrollboxErrorType,
  type TrollboxChatMessage,
  type TrollboxUpdate,
} from '@/types/trollbox';

import { assertNever } from '@/lib/assertNever';
import { sendTrollboxMessage, subscribeToTrollbox } from '@/lib/streaming/trollboxStreaming';
import { signTrollboxMessage } from '@/lib/trollboxUtils';

import { useAccounts } from './useAccounts';
import { useStringGetter } from './useStringGetter';

export const VOLUME_THRESHOLD = 1000;
const MAX_MESSAGES_IN_MEMORY = 1000;
const TOAST_AUTO_CLOSE_MS = 5_000;

const TROLLBOX_ERROR_STRING_KEYS: Record<ITrollboxErrorType, string> = {
  message_too_large: STRING_KEYS.ERROR_MESSAGE_TOO_LARGE,
  message_empty: STRING_KEYS.ERROR_MESSAGE_EMPTY,
  missing_field: STRING_KEYS.ERROR_MISSING_FIELD,
  invalid_address: STRING_KEYS.ERROR_INVALID_ADDRESS,
  invalid_signature: STRING_KEYS.ERROR_INVALID_SIGNATURE,
  invalid_timestamp: STRING_KEYS.ERROR_INVALID_TIMESTAMP,
  rate_limit: STRING_KEYS.ERROR_RATE_LIMIT,
  insufficient_volume: STRING_KEYS.ERROR_INSUFFICIENT_VOLUME,
  validation_error: STRING_KEYS.ERROR_VALIDATION,
};

export type ChatToast = {
  id: string;
  message: string;
};

export const useTrollbox = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress, hdKey } = useAccounts();
  const [messages, setMessages] = useState<TrollboxChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          setIsLoading(false);
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
          pushToast(
            update.errorType != null
              ? stringGetter({
                  key: TROLLBOX_ERROR_STRING_KEYS[update.errorType],
                  params:
                    update.errorType === 'insufficient_volume'
                      ? { MINIMUM_VOLUME: `$${VOLUME_THRESHOLD.toLocaleString()}` }
                      : undefined,
                })
              : update.error
          );
          break;
        default:
          assertNever(update);
      }
    });

    return unsubscribe;
  }, [pushToast, stringGetter]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (dydxAddress == null || hdKey?.privateKey == null) {
        pushToast(stringGetter({ key: STRING_KEYS.WALLET_NOT_CONNECTED }));
        return;
      }

      try {
        const payload = await signTrollboxMessage(text, dydxAddress, hdKey.privateKey);
        sendTrollboxMessage(payload);
      } catch (error) {
        pushToast(
          stringGetter({
            key: STRING_KEYS.FAILED_TO_SEND_MESSAGE,
            params: { ERROR: String(error) },
          })
        );
      }
    },
    [dydxAddress, hdKey?.privateKey, pushToast, stringGetter]
  );

  return { messages, isLoading, handleSendMessage, toasts, pushToast, dismissToast };
};
