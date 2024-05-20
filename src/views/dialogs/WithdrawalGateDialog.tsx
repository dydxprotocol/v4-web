import styled from 'styled-components';

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
  transferType: 'withdrawal' | 'transfer';
  estimatedUnblockTime?: string | null;
};

export const WithdrawalGateDialog = ({
  setIsOpen,
  estimatedUnblockTime,
  transferType,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const { withdrawalGateLearnMore } = useURLConfigs();

  return (
    <Dialog
      isOpen
      stacked
      setIsOpen={setIsOpen}
      title={
        {
          withdrawal: stringGetter({ key: STRING_KEYS.WITHDRAWALS_PAUSED }),
          transfer: stringGetter({ key: STRING_KEYS.TRANSFERS_PAUSED }),
        }[transferType]
      }
      slotIcon={
        <$IconContainer>
          <$Icon iconName={IconName.Warning} />
        </$IconContainer>
      }
      slotFooter={
        <$ButtonRow>
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
        </$ButtonRow>
      }
    >
      <$Content>
        {stringGetter({
          key: STRING_KEYS.WITHDRAWALS_PAUSED_DESC,
          params: {
            ESTIMATED_DURATION: estimatedUnblockTime,
          },
        })}
      </$Content>
    </Dialog>
  );
};
const $IconContainer = styled.div`
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

const $Icon = styled(Icon)`
  color: var(--color-warning);
  font-size: 2.5rem;
  margin-bottom: 0.125rem;
`;

const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

const $ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;
