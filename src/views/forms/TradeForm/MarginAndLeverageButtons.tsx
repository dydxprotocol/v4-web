import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { MarginModeSelector } from '@/views/forms/TradeForm/MarginModeSelector';

type StyleProps = {
  className?: string;
};

export const MarginAndLeverageButtons = ({ className }: StyleProps) => {
  return (
    <$MarginAndLeverageButtons className={className}>
      <MarginModeSelector />
    </$MarginAndLeverageButtons>
  );
};

const $MarginAndLeverageButtons = styled.div`
  display: flex;
  gap: 0.5rem;

  abbr,
  button {
    ${layoutMixins.flexExpandToSpace}
    height: 2.25rem;
    flex-basis: 100%;
  }
`;
