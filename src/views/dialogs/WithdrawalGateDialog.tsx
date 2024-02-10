import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter, useURLConfigs } from '@/hooks';
import { LinkOutIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
  isTransfer?: boolean;
  estimatedUnblockTime?: string | null;
};

export const WithdrawalGateDialog = ({
  setIsOpen,
  isTransfer,
  estimatedUnblockTime,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { withdrawalGateLearnMore } = useURLConfigs();

  return (
    <Dialog
      isOpen
      stacked
      setIsOpen={setIsOpen}
      title={
        isTransfer
          ? stringGetter({ key: STRING_KEYS.TRANSFERS_PAUSED })
          : stringGetter({ key: STRING_KEYS.WITHDRAWALS_PAUSED })
      }
      slotIcon={
        <Styled.IconContainer>
          <Styled.Icon iconName={IconName.Warning} />
        </Styled.IconContainer>
      }
      slotFooter={
        <Styled.ButtonRow>
          <Button
            type={ButtonType.Link}
            action={ButtonAction.Secondary}
            href={withdrawalGateLearnMore}
          >
            {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
            <LinkOutIcon />
          </Button>
          <Button action={ButtonAction.Primary} onClick={() => setIsOpen(false)}>
            {stringGetter({ key: STRING_KEYS.CLOSE })}
          </Button>
        </Styled.ButtonRow>
      }
    >
      <Styled.Content>
        {stringGetter({
          key: STRING_KEYS.WITHDRAWALS_PAUSED_DESC,
          params: {
            ESTIMATED_DURATION: estimatedUnblockTime,
          },
        })}
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  min-width: 4.5rem;
  min-height: 4.5rem;
  background-color: var(--color-gradient-warning);
`;

Styled.Icon = styled(Icon)`
  color: var(--color-warning);
  font-size: 2.5rem;
  margin-bottom: 0.125rem;
`;

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

Styled.ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;
