import styled, { css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  children: React.ReactNode;
};

type StyleProps = {
  className?: string;
  showFadeStart: boolean;
  showFadeEnd: boolean;
};

export const HorizontalScrollContainer = ({
  children,
  className,
  showFadeStart,
  showFadeEnd,
}: ElementProps & StyleProps) => {
  return showFadeStart || showFadeEnd ? (
    <$Container className={className} showFadeStart={showFadeStart} showFadeEnd={showFadeEnd}>
      {children}
    </$Container>
  ) : (
    children
  );
};

const $Container = styled.div<{
  showFadeStart: boolean;
  showFadeEnd: boolean;
}>`
  ${({ showFadeStart }) =>
    !showFadeStart &&
    css`
      &:before {
        opacity: 0;
      }
    `}

  ${({ showFadeEnd }) =>
    !showFadeEnd &&
    css`
      &:after {
        opacity: 0;
      }
    `};

  ${layoutMixins.scrollAreaFadeStart}
  ${layoutMixins.scrollAreaFadeEnd}
  
  display: flex;
  align-items: center;
  overflow: hidden;

  transition: opacity 0.3s var(--ease-out-expo);
`;
