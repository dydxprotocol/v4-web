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
  <$Container className={className} tw="grid gap-0.5 [--label-textColor:--color-text-1]">
    <label htmlFor={inputID} tw="inlineRow text-[color:--label-textColor] font-mini-book">
      {label}
    </label>
    {children}
  </$Container>
);

const $Container = styled.div`
  label {
    ${layoutMixins.textTruncate}
  }
`;
