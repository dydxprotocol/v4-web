import styled from 'styled-components';

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
  <div className={className} tw="grid gap-0.5 [--label-textColor:var(--color-text-1)]">
    <$Label htmlFor={inputID}>{label}</$Label>
    {children}
  </div>
);
const $Label = styled.label`
  ${layoutMixins.inlineRow}
  font: var(--font-mini-book);
  color: var(--label-textColor);
`;
