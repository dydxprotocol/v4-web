import { useEffect } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import { AbacusApiStatus } from '@/constants/abacus';
import { CLIENT_NETWORK_CONFIGS } from '@/constants/networks';
import { UNICODE } from '@/constants/unicode';

import { STRING_KEYS } from '@/constants/localization';
import { useApiState, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Link } from '@/components/Link';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';

import { closeDialog } from '@/state/dialogs';

import { getSelectedNetwork } from '@/state/appSelectors';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const ExchangeOfflineDialog = ({ preventClose, setIsOpen }: ElementProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { status, statusErrorMessage } = useApiState();
  const selectedNetwork = useSelector(getSelectedNetwork);

  const showTestnetMaintenanceMessage =
    import.meta.env.MODE === 'production' &&
    CLIENT_NETWORK_CONFIGS[selectedNetwork].dydxChainId === 'dydx-testnet-2';

  useEffect(() => {
    if (status === AbacusApiStatus.NORMAL && !showTestnetMaintenanceMessage) {
      dispatch(closeDialog());
    }
  }, [status, selectedNetwork]);

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.UNAVAILABLE })}
    >
      <Styled.Content>
        {showTestnetMaintenanceMessage ? (
          <>
            <p>Testnet is currently shutdown for maintenance. Please check back!</p>
            <Styled.Link href="https://v4-teacher.vercel.app/testnets/schedule">
              {stringGetter({ key: STRING_KEYS.LEARN_MORE })} {UNICODE.ARROW_RIGHT}
            </Styled.Link>
          </>
        ) : (
          <p>{statusErrorMessage}</p>
        )}
        {import.meta.env.MODE !== 'production' && <NetworkSelectMenu />}
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

Styled.Link = styled(Link)`
  display: contents;
  --link-color: var(--color-accent);
`;
