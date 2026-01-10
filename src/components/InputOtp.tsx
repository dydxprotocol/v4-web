import * as React from 'react';

import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import styled, { createGlobalStyle } from 'styled-components';

const InputOTP = ({
  className,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) => {
  return (
    <React.Fragment>
      <InputOtpContainerStyle />
      <OTPInput
        data-slot="input-otp"
        containerClassName="input-otp-container"
        tw="disabled:cursor-not-allowed"
        className={className}
        pattern={REGEXP_ONLY_DIGITS}
        {...props}
      />
    </React.Fragment>
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

/**
 * This is necessary to access containerClassName.
 * Our twin.macro tailwind classes do not work in this case so we fall back on good ole CSS.
 */
const InputOtpContainerStyle = createGlobalStyle`
  .input-otp-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    margin-right: auto;

    &:has(input:disabled) {
        opacity: 0.5;
      }
    }
`;

const $InputOTPSlot = styled.div`
  position: relative;
  display: flex;
  height: 3rem;
  width: 2.625rem;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border: var(--default-border-width) solid var(--input-otp-slot-border-color, var(--color-border));
  outline: none;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  &:first-child {
    border-left: 1px solid var(--input-otp-slot-border-color, var(--color-border));
    border-top-left-radius: var(--input-otp-slot-border-radius, 0.75rem);
    border-bottom-left-radius: var(--input-otp-slot-border-radius, 0.75rem);
  }

  &:last-child {
    border-top-right-radius: var(--input-otp-slot-border-radius, 0.75rem);
    border-bottom-right-radius: var(--input-otp-slot-border-radius, 0.75rem);
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
