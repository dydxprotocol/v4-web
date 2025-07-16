import { BonsaiHelpers } from '@/bonsai/ontology';

import { DialogProps, TriggersDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Dialog, DialogPlacement } from '@/components/Dialog';
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
  const logoUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);
  const isSimpleUi = useSimpleUiEnabled();

  const config = isSimpleUi
    ? {
        title: stringGetter({ key: STRING_KEYS.PRICE_TRIGGERS }),
        placement: DialogPlacement.FullScreen,
        description: stringGetter({ key: STRING_KEYS.TRIGGER_DIALOG_DESCRIPTION }),
        slotIcon: <AssetIcon logoUrl={logoUrl} symbol={assetId} />,
      }
    : {
        title: stringGetter({ key: STRING_KEYS.PRICE_TRIGGERS }),
        placement: DialogPlacement.Default,
        slotIcon: <AssetIcon logoUrl={logoUrl} symbol={assetId} />,
      };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={config.title}
      slotIcon={config.slotIcon}
      placement={config.placement}
      description={config.description}
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
