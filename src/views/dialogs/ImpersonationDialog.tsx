import { useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { ComboboxDialogMenu } from '@/components/ComboboxDialogMenu';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const ImpersonationDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return <div>Impersonation</div>;
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ComboboxDialogMenu = styled(ComboboxDialogMenu)`
  --dialog-content-paddingBottom: 0.5rem;
`;
