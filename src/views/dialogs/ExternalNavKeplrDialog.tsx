import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useBreakpoints, useStringGetter } from '@/hooks';

import { Button } from '@/components/Button';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

// TODO: replace placeholder URL with real URLs when avaialble
const KEPLR_DASHBOARD_URL = 'https://testnet.keplr.app/';
const HELP_URL = 'https://help.dydx.exchange/en/articles/2921366-how-do-i-create-an-account-or-sign-up';

export const ExternalNavKeplrDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { isTablet } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.HAVE_YOU_EXPORTED })}
      placement={isTablet ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      <Styled.Content>
        <Styled.Button type={ButtonType.Link} size={ButtonSize.XLarge} href={KEPLR_DASHBOARD_URL}>
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

        <Styled.Button type={ButtonType.Link} size={ButtonSize.XLarge} href={HELP_URL}>
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
`;
