import styled, { keyframes } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

type LoadingSpinnerProps = {
  id?: string;
  className?: string;
  disabled?: boolean;
};
// In some strange cases, hiding a spinner on one part of the page causes the linearGradient to
// be hidden on all other instances of the page. An id can be passed in to prevent this.
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  id,
  className,
  disabled = false,
}: LoadingSpinnerProps) => {
  return (
    <$Spinner className={className}>
      <$LoadingSpinnerSvg
        id={id}
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="19"
          cy="19"
          r="16"
          stroke="var(--color-layer-1)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {!disabled && (
          <path
            d="M35 19.248C35 22.1935 34.1611 25.08 32.5786 27.5797C30.9961 30.0794 28.7334 32.0923 26.0474 33.3897C23.3614 34.6871 20.3597 35.217 17.3831 34.9194C14.4066 34.6217 11.5744 33.5084 9.20825 31.7058C6.84207 29.9032 5.03667 27.4835 3.99704 24.7216C2.95741 21.9596 2.7252 18.966 3.32678 16.0807C3.92836 13.1953 5.33963 10.5338 7.40035 8.39841C9.46107 6.26299 12.0887 4.73918 14.9848 4"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
      </$LoadingSpinnerSvg>
    </$Spinner>
  );
};

type LoadingSpaceProps = { className?: string; id: string };
export const LoadingSpace: React.FC<LoadingSpaceProps> = ({ className, id }: LoadingSpaceProps) => (
  <$LoadingSpaceContainer className={className}>
    <LoadingSpinner id={id} />
  </$LoadingSpaceContainer>
);
const $LoadingSpaceContainer = styled.div`
  ${layoutMixins.centered}
`;

const $Spinner = styled.div`
  --spinner-width: auto;

  line-height: 0;
  color: var(--color-text-0);
`;

const $LoadingSpinnerSvg = styled.svg`
  width: var(--spinner-width);
  height: auto;

  animation: ${keyframes`
    to {
      transform: rotate(1turn);
    }
  `} 1.5s linear infinite;
`;
