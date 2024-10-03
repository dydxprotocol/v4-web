import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { MarginModeSelector } from '@/views/forms/TradeForm/MarginModeSelector';
import { TargetLeverageButton } from '@/views/forms/TradeForm/TargetLeverageButton';

export const MarginAndLeverageButtons = ({ openInTradeBox }: { openInTradeBox: boolean }) => (
  <$MarginAndLeverageButtons>
    <MarginModeSelector openInTradeBox={openInTradeBox} />
    <TargetLeverageButton />
  </$MarginAndLeverageButtons>
);

const $MarginAndLeverageButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;

  border-bottom: var(--border);

  abbr,
  button {
    ${layoutMixins.flexExpandToSpace}
    height: 2.25rem;
    flex-basis: 100%;
  }
`;
