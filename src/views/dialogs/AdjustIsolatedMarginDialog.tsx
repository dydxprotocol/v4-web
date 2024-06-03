import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import type { SubaccountPosition } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

import { getOpenPositionFromId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { AdjustIsolatedMarginForm } from '../forms/AdjustIsolatedMarginForm';

type ElementProps = {
  positionId: SubaccountPosition['id'];
  setIsOpen?: (open: boolean) => void;
};

export const AdjustIsolatedMarginDialog = ({ positionId, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const subaccountPosition = useAppSelector(getOpenPositionFromId(positionId), shallowEqual);

  const onIsolatedMarginAdjustment = useCallback(() => setIsOpen?.(false), [setIsOpen]);

  return (
    <$Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={subaccountPosition && <AssetIcon symbol={subaccountPosition.assetId} />}
      title={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}
    >
      <$Content>
        <AdjustIsolatedMarginForm
          marketId={positionId}
          onIsolatedMarginAdjustment={onIsolatedMarginAdjustment}
        />
      </$Content>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-width: 25rem;
`;
const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
