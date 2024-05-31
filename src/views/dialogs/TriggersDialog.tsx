import { type SubaccountOrder } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { TriggersForm } from '@/views/forms/TriggersForm/TriggersForm';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

type ElementProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  navigateToMarketOrders: (market: string) => void;
  setIsOpen: (open: boolean) => void;
};

export const TriggersDialog = ({
  marketId,
  assetId,
  stopLossOrders,
  takeProfitOrders,
  navigateToMarketOrders,
  setIsOpen,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.PRICE_TRIGGERS })}
      slotIcon={<AssetIcon symbol={assetId} />}
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
