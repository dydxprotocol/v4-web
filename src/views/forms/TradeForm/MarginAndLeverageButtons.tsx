import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { MarginModeSelector } from '@/views/forms/TradeForm/MarginModeSelector';
import { TargetLeverageButton } from '@/views/forms/TradeForm/TargetLeverageButton';

import { testFlags } from '@/lib/testFlags';

type ElementProps = {
  openInTradeBox: boolean;
};

type StyleProps = {
  className?: string;
};

export const MarginAndLeverageButtons = ({
  openInTradeBox,
  className,
}: ElementProps & StyleProps) => {
  const { uiRefresh } = testFlags;

  return (
    <$MarginAndLeverageButtons className={className}>
      <MarginModeSelector openInTradeBox={openInTradeBox} />
      {!uiRefresh && <TargetLeverageButton />}
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
