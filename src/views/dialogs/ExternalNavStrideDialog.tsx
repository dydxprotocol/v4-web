import { useCallback } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogProps, DialogTypes, ExternalNavStrideDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog, forceOpenDialog } from '@/state/dialogs';

export const ExternalNavStrideDialog = ({
  setIsOpen,
}: DialogProps<ExternalNavStrideDialogProps>) => {
  const stringGetter = useStringGetter();
  const { strideZoneApp, accountExportLearnMore } = useURLConfigs();
  const dispatch = useAppDispatch();
  const { isTablet } = useBreakpoints();

  const openExternalNavDialog = useCallback(() => {
    dispatch(closeDialog());
    dispatch(
      forceOpenDialog(
        DialogTypes.ExternalLink({
          buttonText: (
            <span tw="flex items-center gap-[0.5ch]">
              {stringGetter({ key: STRING_KEYS.LIQUID_STAKE_ON_STRIDE })}
              <Icon iconName={IconName.LinkOut} />
            </span>
          ),
          link: strideZoneApp,
          title: stringGetter({ key: STRING_KEYS.LIQUID_STAKING_AND_LEAVING }),
          slotContent: stringGetter({
            key: STRING_KEYS.LIQUID_STAKING_AND_LEAVING_DESCRIPTION,
            params: {
              CTA: stringGetter({ key: STRING_KEYS.LIQUID_STAKE_ON_STRIDE }),
            },
          }),
        })
      )
    );
  }, [dispatch, strideZoneApp, stringGetter]);

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.HAVE_YOU_EXPORTED })}
      placement={isTablet ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <$Content>
        <$Button type={ButtonType.Button} size={ButtonSize.XLarge} onClick={openExternalNavDialog}>
          <span>
            {stringGetter({
              key: STRING_KEYS.NAVIGATE_TO_STRIDE,
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

const $IconButton = tw(IconButton)`text-text-0 [--color-border:var(--color-layer-6)]`;
