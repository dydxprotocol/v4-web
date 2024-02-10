import styled, { AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { useStringGetter, useURLConfigs } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { Button } from '@/components/Button';
import { LinkOutIcon } from '@/icons';
import { ButtonAction, ButtonType } from '@/constants/buttons';

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

  width: 72px;
  height: 72px;
  border-radius: 50%;
  min-width: 72px;
  min-height: 72px;
  background-color: rgba(100, 100, 0, 0.1);
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
