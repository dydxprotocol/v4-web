import { useCallback } from 'react';

import styled from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog, openDialog } from '@/state/dialogs';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const ExternalNavKeplrDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { keplrDashboard, accountExportLearnMore } = useURLConfigs();
  const dispatch = useAppDispatch();
  const { isTablet } = useBreakpoints();

  const onExternalNavDialog = useCallback(() => {
    dispatch(closeDialog());
    dispatch(
      openDialog({
        type: DialogTypes.ExternalLink,
        dialogProps: {
          buttonText: stringGetter({ key: STRING_KEYS.CONTINUE }),
          link: keplrDashboard,
          title: stringGetter({ key: STRING_KEYS.LEAVING_WEBSITE_STAKING_GOVERNANCE }),
          slotContent: stringGetter({
            key: STRING_KEYS.STAKE_WITH_KEPLR_AND_LEAVING_DESCRIPTION,
            params: {
              CTA: stringGetter({ key: STRING_KEYS.CONTINUE }),
            },
          }),
        },
      })
    );
  }, [dispatch]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.HAVE_YOU_EXPORTED })}
      placement={isTablet ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        <$Button type={ButtonType.Button} size={ButtonSize.XLarge} onClick={onExternalNavDialog}>
          <span>
            {stringGetter({
              key: STRING_KEYS.NAVIGATE_TO_KEPLR,
              params: {
                STRONG_YES: <strong>{stringGetter({ key: STRING_KEYS.YES })}</strong>,
              },
            })}
          </span>

          <$IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.XSmall}
          />
        </$Button>

        <$Button type={ButtonType.Link} size={ButtonSize.XLarge} href={accountExportLearnMore}>
          <span>
            {stringGetter({
              key: STRING_KEYS.LEARN_TO_EXPORT,
              params: {
                STRONG_NO: <strong>{stringGetter({ key: STRING_KEYS.NO })}</strong>,
              },
            })}
          </span>

          <$IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.XSmall}
          />
        </$Button>
      </$Content>
    </Dialog>
  );
};

const $Content = styled.div`
  ${layoutMixins.stickyArea0}
  --stickyArea0-bottomHeight: 2rem;
  --stickyArea0-bottomGap: 1rem;
  --stickyArea0-totalInsetBottom: 0.5rem;

  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

const $Button = styled(Button)`
  --button-font: var(--font-base-book);
  --button-padding: 0 1.5rem;

  gap: 0;

  justify-content: space-between;
`;

const $IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;
