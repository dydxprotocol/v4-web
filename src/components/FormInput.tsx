import React, { forwardRef } from 'react';

import styled, { css } from 'styled-components';

import { AlertType } from '@/constants/alerts';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Input, InputProps } from '@/components/Input';
import { WithLabel } from '@/components/WithLabel';

type StyleProps = {
  className?: string;
};

type ElementProps = {
  label?: React.ReactNode;
  slotRight?: React.ReactNode;
  validationConfig?: {
    attached?: boolean;
    type: AlertType;
    message: string;
  };
};

export type FormInputProps = ElementProps & StyleProps & InputProps;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ id, label, slotRight, className, validationConfig, ...otherProps }, ref) => (
    <$FormInputContainer className={className} isValidationAttached={validationConfig?.attached}>
      <$InputContainer hasLabel={!!label} hasSlotRight={!!slotRight}>
        {label ? (
          <$WithLabel label={label} inputID={id} disabled={otherProps?.disabled}>
            <Input ref={ref} id={id} {...otherProps} />
          </$WithLabel>
        ) : (
          <Input ref={ref} id={id} {...otherProps} />
        )}
        {slotRight}
      </$InputContainer>
      {validationConfig && (
        <$AlertMessage type={validationConfig.type}>{validationConfig.message}</$AlertMessage>
      )}
    </$FormInputContainer>
  )
);
const $AlertMessage = styled(AlertMessage)``;

const $FormInputContainer = styled.div<{ isValidationAttached?: boolean }>`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;

  ${({ isValidationAttached }) =>
    isValidationAttached &&
    css`
      --input-radius: 0.5em 0.5em 0 0;

      ${$AlertMessage} {
        border-left: none;
        margin: 0;
        border-radius: 0 0 0.5em 0.5em;
      }
    `}
`;

const $InputContainer = styled.div<{ hasLabel?: boolean; hasSlotRight?: boolean }>`
  ${formMixins.inputContainer}

  input {
    ${({ hasLabel }) =>
      !hasLabel &&
      css`
        --form-input-paddingY: 0;
      `}

    padding: var(--form-input-paddingY) var(--form-input-paddingX);
    padding-top: 0;
  }

  ${({ hasSlotRight }) =>
    hasSlotRight &&
    css`
      padding-right: var(--form-input-paddingX);
      input {
        padding-right: 0;
      }
    `}
`;

const $WithLabel = styled(WithLabel)<{ disabled?: boolean }>`
  ${formMixins.inputLabel}

  label {
    ${({ disabled }) => !disabled && 'cursor: text;'}
    padding: var(--form-input-paddingY) var(--form-input-paddingX) 0;
  }
`;
