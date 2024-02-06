import { useCallback } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useBreakpoints, useStringGetter, useURLConfigs } from '@/hooks';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { layoutMixins } from '@/styles/layoutMixins';
import { DialogTypes } from '@/constants/dialogs';
import { closeDialog, openDialog } from '@/state/dialogs';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const ExternalNavStrideDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { strideZoneApp, accountExportLearnMore } = useURLConfigs();
  const dispatch = useDispatch();
  const { isTablet } = useBreakpoints();

  const openExternalNavDialog = useCallback(() => {
    dispatch(closeDialog());
    dispatch(
      openDialog({
        type: DialogTypes.ExternalLink,
        dialogProps: {
          buttonText: (
            <Styled.Span>
              Liquid Stake on Stride <Icon iconName={IconName.LinkOut} />
            </Styled.Span>
          ),
          link: strideZoneApp,
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
      <Styled.Content>
        <Styled.Button
          type={ButtonType.Button}
          size={ButtonSize.XLarge}
          onClick={openExternalNavDialog}
        >
          <span>
            {stringGetter({
              key: STRING_KEYS.NAVIGATE_TO_KEPLR,
              params: {
                STRONG_YES: <strong>{stringGetter({ key: STRING_KEYS.YES })}</strong>,
              },
            })}
          </span>

          <Styled.IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.XSmall}
          />
        </Styled.Button>

        <Styled.Button
          type={ButtonType.Link}
          size={ButtonSize.XLarge}
          href={accountExportLearnMore}
        >
          <span>
            {stringGetter({
              key: STRING_KEYS.LEARN_TO_EXPORT,
              params: {
                STRONG_NO: <strong>{stringGetter({ key: STRING_KEYS.NO })}</strong>,
              },
            })}
          </span>

          <Styled.IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.XSmall}
          />
        </Styled.Button>
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TextToggle = styled.div`
  ${layoutMixins.stickyFooter}
  color: var(--color-accent);
  cursor: pointer;

  margin-top: auto;

  &:hover {
    text-decoration: underline;
  }
`;

Styled.Content = styled.div`
  ${layoutMixins.stickyArea0}
  --stickyArea0-bottomHeight: 2rem;
  --stickyArea0-bottomGap: 1rem;
  --stickyArea0-totalInsetBottom: 0.5rem;

  ${layoutMixins.flexColumn}
  gap: 1rem;
`;

Styled.Button = styled(Button)`
  --button-font: var(--font-base-book);
  --button-padding: 0 1.5rem;

  gap: 0;

  justify-content: space-between;
`;

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

Styled.Span = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5ch;
`;
