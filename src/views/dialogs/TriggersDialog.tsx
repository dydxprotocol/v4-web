import { BonsaiHelpers } from '@/bonsai/ontology';

import { DialogProps, TriggersDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { TriggersForm } from '@/views/forms/TriggersForm/TriggersForm';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

import { testFlags } from '@/lib/testFlags';

export const TriggersDialog = ({
  positionUniqueId,
  marketId,
  assetId,
  navigateToMarketOrders,
  setIsOpen,
}: DialogProps<TriggersDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const logoUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);
  const { isMobile } = useBreakpoints();
  const isSimpleUi = testFlags.simpleUi && isMobile;

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.PRICE_TRIGGERS })}
      slotIcon={<AssetIcon logoUrl={logoUrl} symbol={assetId} />}
      placement={isSimpleUi ? DialogPlacement.FullScreen : DialogPlacement.Default}
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
