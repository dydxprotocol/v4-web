import { useCallback } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { AdjustIsolatedMarginDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

import { getOpenPositionFromId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { AdjustIsolatedMarginForm } from '../forms/AdjustIsolatedMarginForm';

export const AdjustIsolatedMarginDialog = ({
  positionId,
  setIsOpen,
}: DialogProps<AdjustIsolatedMarginDialogProps>) => {
  const stringGetter = useStringGetter();
  const subaccountPosition = useAppSelector(getOpenPositionFromId(positionId), shallowEqual);

  const onIsolatedMarginAdjustment = useCallback(() => setIsOpen?.(false), [setIsOpen]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={subaccountPosition && <AssetIcon symbol={subaccountPosition.assetId} />}
      title={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}
      tw="[--dialog-width:25rem]"
    >
      <$Content>
        <AdjustIsolatedMarginForm
          marketId={positionId}
          onIsolatedMarginAdjustment={onIsolatedMarginAdjustment}
        />
      </$Content>
    </Dialog>
  );
};
const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
