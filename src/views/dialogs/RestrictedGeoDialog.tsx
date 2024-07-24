import { DialogProps, RestrictedGeoDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

export const RestrictedGeoDialog = ({
  preventClose,
  setIsOpen,
}: DialogProps<RestrictedGeoDialogProps>) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_TITLE })}
      slotIcon={<Icon iconName={IconName.Warning} tw="text-warning" />}
    >
      <div tw="column gap-1">
        {stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_SUBTITLE })}
        {isDev && <NetworkSelectMenu />}
      </div>
    </Dialog>
  );
};
