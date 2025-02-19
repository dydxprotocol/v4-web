import { useCallback } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';

import { AdjustIsolatedMarginDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

import { getOpenPositionFromId } from '@/state/accountSelectors';

import { AdjustIsolatedMarginForm } from '../forms/AdjustIsolatedMarginForm';

export const AdjustIsolatedMarginDialog = ({
  positionId,
  setIsOpen,
}: DialogProps<AdjustIsolatedMarginDialogProps>) => {
  const stringGetter = useStringGetter();
  const subaccountPosition = useParameterizedSelector(getOpenPositionFromId, positionId);
  const logoUrl = useParameterizedSelector(
    BonsaiHelpers.assets.createSelectAssetLogo,
    subaccountPosition?.assetId
  );

  const onIsolatedMarginAdjustment = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={
        subaccountPosition && <AssetIcon logoUrl={logoUrl} symbol={subaccountPosition.assetId} />
      }
      title={stringGetter({ key: STRING_KEYS.ADJUST_ISOLATED_MARGIN })}
      tw="[--dialog-width:25rem]"
    >
      <div tw="column gap-1">
        <AdjustIsolatedMarginForm
          positionId={positionId}
          onIsolatedMarginAdjustment={onIsolatedMarginAdjustment}
        />
      </div>
    </Dialog>
  );
};
