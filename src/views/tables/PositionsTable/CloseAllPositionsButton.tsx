import { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { openDialog } from '@/state/dialogs';

export const CloseAllPositionsButton = () => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();

  const onCloseAllClick = useCallback(() => {
    dispatch(openDialog(DialogTypes.CloseAllPositionsConfirmation()));
  }, [dispatch]);

  return (
    <$ActionTextButton
      action={ButtonAction.Primary}
      size={ButtonSize.XSmall}
      onClick={onCloseAllClick}
    >
      {stringGetter({ key: STRING_KEYS.CLOSE_ALL })}
    </$ActionTextButton>
  );
};

const $ActionTextButton = styled(Button)`
  --button-textColor: var(--color-red);
  --button-height: var(--item-height);
  --button-padding: 0 0.25rem;
  --button-backgroundColor: transparent;
  --button-border: none;
  pointer-events: auto;
`;
