import { shallowEqual, useSelector } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import type { SubaccountPosition } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { GradientCard } from '@/components/GradientCard';
import { ToggleGroup } from '@/components/ToggleGroup';

import { getOpenPositionFromId } from '@/state/accountSelectors';

import { AdjustIsolatedMarginForm } from '../forms/AdjustIsolatedMarginForm';

type ElementProps = {
  positionId: SubaccountPosition['id'];
  setIsOpen?: (open: boolean) => void;
};

export const AdjustIsolatedMarginDialog = ({ positionId, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const subaccountPosition = useSelector(getOpenPositionFromId(positionId), shallowEqual);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={subaccountPosition && <AssetIcon symbol={subaccountPosition.assetId} />}
      title={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}
    >
      <Styled.Content>
        <AdjustIsolatedMarginForm marketId={positionId} />
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

Styled.ToggleGroup = styled(ToggleGroup)`
  ${formMixins.inputToggleGroup}
`;

Styled.GradientCard = styled(GradientCard)`
  ${layoutMixins.spacedRow}
  height: 4rem;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  align-items: center;
`;

Styled.Column = styled.div`
  ${layoutMixins.column}
  font: var(--font-small-medium);
`;

Styled.TertiarySpan = styled.span`
  color: var(--color-text-0);
`;
