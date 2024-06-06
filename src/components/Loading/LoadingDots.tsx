import styled, { css } from 'styled-components';

// Types/constants
export type LoadingDotsProps = {
  size?: number;
};

// Component
export const LoadingDots: React.FC<LoadingDotsProps> = ({ size = 1 }: LoadingDotsProps) => (
  <LoadingDotsContainer size={size}>
    <i />
    <i />
    <i />
  </LoadingDotsContainer>
);

// Style
const LoadingDotsContainer = styled.div<{ size: number }>`
  // Props/defaults
  --size: 1;

  // Variants
  ${({ size }) => css`
    --size: ${size};
  `}

  // Calculations
  --dot-size: calc(var(--size) * 0.0875em);

  // Rules
  display: inline-grid;
  grid-auto-flow: column;
  gap: var(--dot-size);
  user-select: none;

  > * {
    width: var(--dot-size);
    height: var(--dot-size);
    background-color: currentColor;
    border-radius: 50%;
    animation: Dot 1.4s infinite both;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }

  @keyframes Dot {
    0% {
      opacity: 0.2;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0.2;
    }
  }
`;
