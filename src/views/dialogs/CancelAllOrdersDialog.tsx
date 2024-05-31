import { useCallback, useMemo } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';

import { getNonZeroPendingPositions } from '@/state/accountSelectors';

import { CancelAllOrdersInMarketForm } from '../forms/CancelAllOrdersInMarketForm';

type CancelAllOrdersDialogProps = {
  setIsOpen?: (open: boolean) => void;
  marketId: string;
};

export const CancelAllOrdersDialog = ({ setIsOpen, marketId }: CancelAllOrdersDialogProps) => {
  const stringGetter = useStringGetter();
  const allPending = useSelector(getNonZeroPendingPositions, shallowEqual);
  const pendingPosition = useMemo(
    () => allPending?.find((p) => p.marketId === marketId),
    [allPending, marketId]
  );

  const onSuccessfulCancel = useCallback(() => setIsOpen?.(false), [setIsOpen]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={pendingPosition && <AssetIcon symbol={pendingPosition.assetId} />}
      title={stringGetter({
        key:
          (pendingPosition?.orderCount ?? 0) !== 1
            ? STRING_KEYS.CANCEL_ORDERS
            : STRING_KEYS.CANCEL_ORDER,
      })}
    >
      <CancelAllOrdersInMarketForm marketId={marketId} onCancelComplete={onSuccessfulCancel} />
    </Dialog>
  );
};
