import { useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { STRING_KEYS } from '@/constants/localization';
import { useAccounts, useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';

type ElementProps = {
  preventClose?: boolean;
  reason: UnauthorizedReason;
  setIsOpen?: (open: boolean) => void;
};

export enum UnauthorizedReason {
  OFAC,
  GEO,
  ELLIPTIC,
}

export const UnauthorizedDialog = ({ preventClose, reason, setIsOpen }: ElementProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const message = {
    [UnauthorizedReason.ELLIPTIC]: 'Your account is not authorized to trade on this network.',
    [UnauthorizedReason.GEO]: 'Your account is not authorized to trade from your location.',
    [UnauthorizedReason.OFAC]: 'Your account is not authorized to trade with this counterparty.',
  }[reason];

  const { disconnect } = useAccounts();

  // Disconnect the user if their wallet was flagged by Elliptic
  useEffect(() => {
    if (reason === UnauthorizedReason.ELLIPTIC) {
      disconnect();
    }
  }, [reason]);

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.UNAVAILABLE })}
    >
      <StyledContent>{message}</StyledContent>
    </Dialog>
  );
};

const StyledContent = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
