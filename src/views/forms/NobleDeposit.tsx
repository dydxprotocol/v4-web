import { useState } from 'react';

import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Checkbox } from '@/components/Checkbox';
import { CopyButton } from '@/components/CopyButton';
import { QrCode } from '@/components/QrCode';
import { TimeoutButton } from '@/components/TimeoutButton';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithReceipt } from '@/components/WithReceipt';

export const NobleDeposit = () => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [hasTimedout, setHasTimedout] = useState(false);
  const stringGetter = useStringGetter();
  const { nobleAddress } = useAccounts();

  return (
    <>
      <WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'nobleAddress',
            label: stringGetter({ key: STRING_KEYS.NOBLE_ADDRESS }),
            value:
              hasAcknowledged && hasTimedout
                ? nobleAddress
                : stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TO_REVEAL }),
          },
        ]}
      >
        <$QrCode
          hasLogo
          size={432}
          value={nobleAddress ?? ''}
          blurred={!hasAcknowledged || !hasTimedout}
        />
      </WithDetailsReceipt>

      <$WithReceipt
        slotReceipt={
          <$CheckboxContainer>
            <Checkbox
              checked={hasAcknowledged}
              onCheckedChange={setHasAcknowledged}
              id="acknowledge-secret-phase-risk"
              label={stringGetter({
                key: STRING_KEYS.NOBLE_ACKNOWLEDGEMENT,
              })}
            />
          </$CheckboxContainer>
        }
      >
        <TimeoutButton
          timeoutInSeconds={8}
          onTimeOut={() => setHasTimedout(true)}
          slotFinal={
            <CopyButton state={{ isDisabled: !hasAcknowledged }} value={nobleAddress}>
              {!hasAcknowledged ? stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_RISKS }) : undefined}
            </CopyButton>
          }
        />
      </$WithReceipt>
    </>
  );
};

const $WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

const $QrCode = styled(QrCode)<{ blurred: boolean }>`
  border-radius: 0.5em;

  ${({ blurred }) =>
    blurred &&
    css`
      filter: blur(8px);
    `}
`;

const $CheckboxContainer = styled.div`
  padding: 1rem;
  color: var(--color-text-0);
`;
