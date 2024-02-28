import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const RestrictedGeoDialog = ({ preventClose, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_TITLE })}
      slotIcon={<$Icon iconName={IconName.Warning} />}
    >
      <$Content>
        {stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_SUBTITLE })}
        {isDev && <NetworkSelectMenu />}
      </$Content>
    </Dialog>
  );
};
const $Icon = styled(Icon)`
  color: var(--color-warning);
`;

const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
