import styled, { keyframes } from 'styled-components';

export const LoadingOutput = styled.div`
  --loadingOutput-width: 4em;
  --loadingOutput-color: currentColor;

  background: linear-gradient(
    116deg,
    hsla(245, 11%, 55%, 0.4) 0%,
    var(--loadingOutput-color) 50%,
    hsla(245, 11%, 55%, 0.4) 100%
  );
  background-size: 200% auto;
  border-radius: 0.5em;
  height: 1em;
  width: var(--loadingOutput-width);
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
