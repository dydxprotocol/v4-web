import { type SubaccountOrder } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { TriggersForm } from '@/views/forms/TriggersForm/TriggersForm';

type ElementProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];

  setIsOpen: (open: boolean) => void;
};

export const TriggersDialog = ({
  marketId,
  assetId,
  stopLossOrders,
  takeProfitOrders,
  setIsOpen,
}: ElementProps) => {
  const stringGetter = useStringGetter();

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
      />
    </Dialog>
  );
};
