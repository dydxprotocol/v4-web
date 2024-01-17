import { FormEvent } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';
import { useDydxClient } from '@/hooks';

type InputProps = {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = ({ label, ...props }: InputProps) => (
  <Styled.Label>
    <span>{label}</span>
    <input type="text" {...props} />
  </Styled.Label>
);

export const NewMarketForm = () => {
  const { compositeClient } = useDydxClient();

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // compositeClient?.validatorClient.post.send()
      }}
    >
      <Input label="Market Name" />
      <Input label="Market Description" />
      <Input label="Ticker" />
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.flexColumn}
  gap: 1rem;
`;
Styled.Label = styled.label`
  background-color: var(--color-layer-5);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
`;
