import { forwardRef } from 'react';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { layoutMixins } from '@/styles/layoutMixins';
import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Input, InputProps } from '@/components/Input';
import { WithLabel } from '@/components/WithLabel';

type StyleProps = {
  className?: string;
};

type ElementProps = {
  label: React.ReactNode;
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
    <Styled.FormInputContainer
      className={className}
      isValidationAttached={validationConfig?.attached}
    >
      <Styled.InputContainer hasSlotRight={!!slotRight}>
        <Styled.WithLabel label={label} inputID={id}>
          <Input ref={ref} id={id} {...otherProps} />
        </Styled.WithLabel>
        {slotRight}
      </Styled.InputContainer>
      {validationConfig && (
        <Styled.AlertMessage type={validationConfig.type}>
          {validationConfig.message}
        </Styled.AlertMessage>
      )}
    </Styled.FormInputContainer>
  )
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.AlertMessage = styled(AlertMessage)``;

Styled.FormInputContainer = styled.div<{ isValidationAttached?: boolean }>`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;

  ${({ isValidationAttached }) =>
    isValidationAttached &&
    css`
      --input-radius: 0.5em 0.5em 0 0;

      ${Styled.AlertMessage} {
        border-left: none;
        margin: 0;
        border-radius: 0 0 0.5em 0.5em;
      }
    `}
`;

Styled.InputContainer = styled.div<{ hasSlotRight?: boolean }>`
  ${formMixins.inputContainer}

  input {
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

Styled.WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}

  label {
    cursor: text;
    padding: var(--form-input-paddingY) var(--form-input-paddingX) 0;
  }
`;
