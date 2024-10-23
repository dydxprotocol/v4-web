import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  label?: React.ReactNode;
  children?: React.ReactNode;
  inputID?: string;
  preventDefault?: boolean;
};

type StyleProps = {
  className?: string;
};

export const WithLabel = ({
  label,
  inputID,
  children,
  className,
  preventDefault,
}: ElementProps & StyleProps) => (
  <$Container className={className} tw="grid [--label-textColor:--color-text-1]">
    {/* Sometimes we don't want labels to trigger their contents' onClick properties */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
    <label
      htmlFor={inputID}
      tw="inlineRow text-[color:--label-textColor] font-mini-book"
      onClick={(e) => {
        if (preventDefault) e.preventDefault();
      }}
    >
      {label}
    </label>
    {children}
  </$Container>
);

const $Container = styled.div`
  label {
    ${layoutMixins.textTruncate}
    text-align: start;
    > *:not(:last-child) {
      margin-right: 0.5ch;
    }
  }
`;
