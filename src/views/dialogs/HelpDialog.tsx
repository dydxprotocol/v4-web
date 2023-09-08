import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';
import { Close } from '@radix-ui/react-dialog';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { ButtonAction, ButtonType } from '@/constants/buttons';
import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const HELP_URL = `https://docs.google.com/forms/d/e/1FAIpQLSezLsWCKvAYDEb7L-2O4wOON1T56xxro9A2Azvl6IxXHP_15Q/viewform?usp=sf_link`;

/**
 * HelpDialog
 * - Will temporarily be used as a 'Give Feedback' dialog.
 * - It will ask users to navigate to a Google Form in order to record feedback.
 */
export const HelpDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.PROVIDE_FEEDBACK })}
      description={stringGetter({ key: STRING_KEYS.PROVIDE_FEEDBACK_DESCRIPTION })}
    >
      <Styled.Content>
        <p>
          You will be navigated to a Google Form where you will be able to provide feedback. Thank
          you for your contribution!
        </p>
        <Styled.ButtonRow>
          <Close asChild>
            <Button
              action={ButtonAction.Primary}
              type={ButtonType.Link}
              href={HELP_URL}
              slotRight={<Icon iconName={IconName.LinkOut} />}
            >
              {stringGetter({ key: STRING_KEYS.CONTINUE })}
            </Button>
          </Close>
        </Styled.ButtonRow>
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ButtonRow = styled.div`
  ${layoutMixins.row}

  gap: 0.5rem;
  justify-content: end;
`;

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
