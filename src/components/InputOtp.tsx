import * as React from 'react';

import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import styled, { css } from 'styled-components';

const InputOTP = ({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) => {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={`${ContainerClassName} ${containerClassName ?? ''}`}
      tw="disabled:cursor-not-allowed"
      className={className}
      pattern={REGEXP_ONLY_DIGITS}
      {...props}
    />
  );
};

const InputOTPGroup = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div data-slot="input-otp-group" tw="flex items-center" className={className} {...props} />
  );
};

const InputOTPSlot = ({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number;
}) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  return (
    <$InputOTPSlot
      data-slot="input-otp-slot"
      data-active={isActive}
      className={className}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div tw="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div tw="h-0.5 w-px duration-1000" />
        </div>
      )}
    </$InputOTPSlot>
  );
};

const InputOTPSeparator = ({ ...props }: React.ComponentProps<'div'>) => {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <span>-</span>
    </div>
  );
};

const ContainerClassName = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &:has(input:disabled) {
    opacity: 0.5;
  }
`;

const $InputOTPSlot = styled.div`
  position: relative;
  display: flex;
  height: 2.125rem;
  width: 2.125rem;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border: var(--default-border-width) solid var(--color-border);
  outline: none;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:first-child {
    border-left: 1px solid var(--color-border);
    border-top-left-radius: 0.375rem;
    border-bottom-left-radius: 0.375rem;
  }

  &:last-child {
    border-top-right-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
  }

  &[data-active='true'] {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
    z-index: 10;
  }

  &[aria-invalid='true'] {
    border-color: var(--color-error);
  }

  &[data-active='true'][aria-invalid='true'] {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px var(--color-error);
  }
`;

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
