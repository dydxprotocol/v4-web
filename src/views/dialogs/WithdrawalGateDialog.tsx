import styled from 'styled-components';

import { ButtonAction, ButtonType } from '@/constants/buttons';
import { DialogProps, WithdrawalGatedDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { LinkOutIcon } from '@/icons';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

export const WithdrawalGateDialog = ({
  setIsOpen,
  estimatedUnblockTime,
  transferType,
}: DialogProps<WithdrawalGatedDialogProps>) => {
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
          <Icon iconName={IconName.Warning} tw="mb-0.125 text-[2.5rem] text-warning" />
        </$IconContainer>
      }
      slotFooter={
        <div tw="grid grid-cols-[1fr_1fr] gap-1">
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
        </div>
      }
    >
      <div tw="gap-1 column">
        {stringGetter({
          key: STRING_KEYS.WITHDRAWALS_PAUSED_DESC,
          params: {
            ESTIMATED_DURATION: estimatedUnblockTime,
          },
        })}
      </div>
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
