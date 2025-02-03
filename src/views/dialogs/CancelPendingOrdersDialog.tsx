import { useCallback, useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';

import { CancelPendingOrdersDialogProps, DialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

import { getNonZeroPendingPositions } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { CancelAllOrdersInMarketForm } from '../forms/CancelAllOrdersInMarketForm';

export const CancelPendingOrdersDialog = ({
  setIsOpen,
  marketId,
}: DialogProps<CancelPendingOrdersDialogProps>) => {
  const stringGetter = useStringGetter();
  const allPending = useAppSelector(getNonZeroPendingPositions, shallowEqual);
  const pendingPosition = useMemo(
    () => allPending?.find((p) => p.marketId === marketId),
    [allPending, marketId]
  );

  const logoUrl = useParameterizedSelector(
    BonsaiHelpers.assets.createSelectAssetLogo,
    pendingPosition?.assetId
  );

  const onSuccessfulCancel = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={pendingPosition && <AssetIcon logoUrl={logoUrl} symbol={pendingPosition.assetId} />}
      title={stringGetter({
        key:
          (pendingPosition?.orders.length ?? 0) !== 1
            ? STRING_KEYS.CANCEL_ORDERS
            : STRING_KEYS.CANCEL_ORDER,
      })}
    >
      <CancelAllOrdersInMarketForm marketId={marketId} onCancelComplete={onSuccessfulCancel} />
    </Dialog>
  );
};
