import { useEffect, useState, type ReactNode } from 'react';

import { ButtonAction, ButtonState } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button, type ButtonProps, type ButtonStateConfig } from '@/components/Button';

type ElementProps = {
  timeoutInSeconds: number;
  onTimeOut?: () => void;
  slotFinal?: ReactNode;
} & ButtonProps;

export type TimeoutButtonProps = ElementProps;

export const TimeoutButton = ({
  children,
  timeoutInSeconds,
  onTimeOut,
  slotFinal,
  ...otherProps
}: TimeoutButtonProps) => {
  const [timeoutDeadline] = useState(Date.now() + timeoutInSeconds * 1000);
  const now = useNow();
  const stringGetter = useStringGetter();

  const secondsLeft = Math.max(0, (timeoutDeadline - now) / 1000);

  useEffect(() => {
    if (secondsLeft > 0) return;
    onTimeOut?.();
  }, [secondsLeft]);

  if (slotFinal && secondsLeft <= 0) return slotFinal;

  return (
    <Button
      {...otherProps}
      action={ButtonAction.Primary}
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
