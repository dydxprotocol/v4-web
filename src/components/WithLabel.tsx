import styled, { type AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  label?: React.ReactNode;
  children?: React.ReactNode;
  inputID?: string;
};

type StyleProps = {
  className?: string;
};

export const WithLabel = ({ label, inputID, children, className }: ElementProps & StyleProps) => (
  <$WithLabel className={className}>
    <$Label htmlFor={inputID}>{label}</$Label>
    {children}
  </$WithLabel>
);
const $WithLabel = styled.div`
  --label-textColor: var(--color-text-1);

  display: grid;
  gap: 0.5rem;
`;

const $Label = styled.label`
  ${layoutMixins.inlineRow}
  font: var(--font-mini-book);
  color: var(--label-textColor);
`;
