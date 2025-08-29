import React, { forwardRef, useId } from 'react';

import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';

import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Input, InputProps } from '@/components/Input';

type StyleProps = {
  className?: string;
};

type ElementProps = {
  label?: React.ReactNode;
  slotRight?: React.ReactNode;
  slotBottom?: React.ReactNode;
  validationConfig?: {
    type: AlertType;
    message: string;
  };
};

export type SpotFormInputProps = ElementProps & StyleProps & InputProps;

export const SpotFormInput = forwardRef<HTMLInputElement, SpotFormInputProps>(
  ({ label, slotRight, slotBottom, className, validationConfig, ...inputProps }, ref) => {
    const id = useId();

    return (
      <$SpotFormInputContainer>
        <$Container className={className}>
          <$InputContainer>
            {label && <$Label htmlFor={id}>{label}</$Label>}
            <$Input ref={ref} {...inputProps} id={id} />
            {slotBottom && <$SlotBottomContainer>{slotBottom}</$SlotBottomContainer>}
          </$InputContainer>
          {slotRight}
        </$Container>
        {validationConfig && (
          <AlertMessage type={validationConfig.type}>{validationConfig.message}</AlertMessage>
        )}
      </$SpotFormInputContainer>
    );
  }
);

const $SpotFormInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const $Container = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--color-layer-3);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-layer-4);
  gap: 0.5rem;
`;

const $Label = styled.label`
  ${layoutMixins.textTruncate}

  font: var(--font-small-medium);
  color: var(--color-text-0);
`;

const $InputContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 0.25rem;
  flex-direction: column;
  min-width: 0;
`;

const $SlotBottomContainer = styled.div`
  ${layoutMixins.textTruncate}
  font: var(--font-mini-medium);
  color: var(--color-text-0);
`;

const $Input = styled(Input)`
  --input-font: var(--font-medium-medium);
`;
