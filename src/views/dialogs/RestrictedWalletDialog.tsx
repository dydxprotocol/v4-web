import { DialogProps, RestrictedWalletDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

export const RestrictedWalletDialog = ({
  preventClose,
  setIsOpen,
}: DialogProps<RestrictedWalletDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.WALLET_RESTRICTED_ERROR_TITLE })}
      slotIcon={<Icon iconName={IconName.Warning} tw="text-color-warning" />}
    >
      <div tw="column gap-1">
        {stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_SUBTITLE })}
        {isDev && <NetworkSelectMenu />}
      </div>
    </Dialog>
  );
};
