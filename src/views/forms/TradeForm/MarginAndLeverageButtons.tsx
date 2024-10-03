import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { MarginModeSelector } from '@/views/forms/TradeForm/MarginModeSelector';
import { TargetLeverageButton } from '@/views/forms/TradeForm/TargetLeverageButton';

export const MarginAndLeverageButtons = ({
  openInTradeBox,
  className,
}: {
  openInTradeBox: boolean;
  className?: string;
}) => (
  <$MarginAndLeverageButtons className={className}>
    <MarginModeSelector openInTradeBox={openInTradeBox} />
    <TargetLeverageButton />
  </$MarginAndLeverageButtons>
);

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
