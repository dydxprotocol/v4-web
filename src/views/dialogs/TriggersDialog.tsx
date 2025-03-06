import { BonsaiHelpers } from '@/bonsai/ontology';

import { DialogProps, TriggersDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog } from '@/components/Dialog';
import { TriggersForm } from '@/views/forms/TriggersForm/TriggersForm';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

export const TriggersDialog = ({
  positionUniqueId,
  marketId,
  assetId,
  navigateToMarketOrders,
  setIsOpen,
}: DialogProps<TriggersDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const logoUrl = useParameterizedSelector(BonsaiHelpers.assets.createSelectAssetLogo, assetId);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.PRICE_TRIGGERS })}
      slotIcon={<AssetIcon logoUrl={logoUrl} symbol={assetId} />}
    >
      <TriggersForm
        positionUniqueId={positionUniqueId}
        onViewOrdersClick={() => {
          dispatch(closeDialog());
          navigateToMarketOrders(marketId);
        }}
      />
    </Dialog>
  );
};
