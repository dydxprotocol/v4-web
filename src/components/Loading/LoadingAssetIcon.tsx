import styled, { keyframes } from 'styled-components';

export const LoadingAssetIcon = styled.div`
  height: var(--loading-asset-icon-size, 1em);
  min-height: var(--loading-asset-icon-size, 1em);
  width: var(--loading-asset-icon-size, 1em);
  min-width: var(--loading-asset-icon-size, 1em);

  background: linear-gradient(
    116deg,
    hsla(245, 11%, 55%, 0.4) 0%,
    currentColor 50%,
    hsla(245, 11%, 55%, 0.4) 100%
  );
  background-size: 200% auto;
  border-radius: 50%;
  opacity: 0.6;

  animation: ${keyframes`
    from {
      background-position: 0 0;
    }
    to {
      background-position: -200% 0;
    }
  `} 1.5s linear infinite;
`;
