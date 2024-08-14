import { DialogProps, TriggersDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { TriggersForm } from '@/views/forms/TriggersForm/TriggersForm';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

export const TriggersDialog = ({
  marketId,
  assetId,
  stopLossOrders,
  takeProfitOrders,
  navigateToMarketOrders,
  setIsOpen,
}: DialogProps<TriggersDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.PRICE_TRIGGERS })}
      slotIcon={<AssetIcon symbol={assetId} />}
      withOverlay={false}
      clickOutsideToClose
    >
      <TriggersForm
        marketId={marketId}
        stopLossOrders={stopLossOrders}
        takeProfitOrders={takeProfitOrders}
        onViewOrdersClick={() => {
          dispatch(closeDialog());
          navigateToMarketOrders(marketId);
        }}
      />
    </Dialog>
  );
};
