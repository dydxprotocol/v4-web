import { useEffect, useRef, useState, type ReactNode } from 'react';

import { ButtonAction, ButtonState } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button, type ButtonProps, type ButtonStateConfig } from '@/components/Button';

type ElementProps = {
  timeoutInSeconds: number;
  onTimeOut?: () => void;
  slotFinal?: ReactNode;
  renderCustomCountdown?: (props: { secondsLeft: number }) => ReactNode;
  resetCounter?: number; // Increment this to reset the counter
} & ButtonProps;

export type TimeoutButtonProps = ElementProps;

export const TimeoutButton = ({
  children,
  timeoutInSeconds,
  onTimeOut,
  slotFinal,
  renderCustomCountdown,
  resetCounter = 0,
  ...otherProps
}: TimeoutButtonProps) => {
  const [timeoutDeadline, setTimeoutDeadline] = useState(Date.now() + timeoutInSeconds * 1000);
  const resetCountRef = useRef(resetCounter);
  const now = useNow();
  const stringGetter = useStringGetter();

  const secondsLeft = Math.max(0, (timeoutDeadline - now) / 1000);

  useEffect(() => {
    if (secondsLeft > 0) return;
    onTimeOut?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    if (resetCounter !== resetCountRef.current) {
      setTimeoutDeadline(Date.now() + timeoutInSeconds * 1000);
      resetCountRef.current = resetCounter;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter, setTimeoutDeadline]);

  if (slotFinal && secondsLeft <= 0) return slotFinal;

  if (renderCustomCountdown && secondsLeft > 0) {
    return renderCustomCountdown({ secondsLeft });
  }

  return (
    <Button
      action={ButtonAction.Primary}
      {...otherProps}
      state={{
        isDisabled:
          secondsLeft > 0 ||
          otherProps.state === ButtonState.Disabled ||
          (otherProps.state as ButtonStateConfig | undefined)?.isDisabled,
      }}
    >
      {secondsLeft
        ? stringGetter({
            key:
              Math.ceil(secondsLeft) === 1
                ? STRING_KEYS.WAIT_SECONDS_SINGULAR
                : STRING_KEYS.WAIT_SECONDS,
            params: {
              SECONDS: String(Math.ceil(secondsLeft)),
            },
          })
        : children}
    </Button>
  );
};
