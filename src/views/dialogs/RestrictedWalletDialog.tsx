import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const RestrictedWalletDialog = ({ preventClose, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.WALLET_RESTRICTED_ERROR_TITLE })}
      slotIcon={<Styled.Icon iconName={IconName.Warning} />}
    >
      <Styled.Content>
        {stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_SUBTITLE })}
        {isDev && <NetworkSelectMenu />}
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Icon = styled(Icon)`
  color: var(--color-warning);
`;

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
