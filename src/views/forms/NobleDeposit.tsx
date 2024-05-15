import { useState } from 'react';

import styled, { css, type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { OpacityToken } from '@/constants/styles/base';

import { useAccounts, useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Checkbox } from '@/components/Checkbox';
import { CopyButton } from '@/components/CopyButton';
import { QrCode } from '@/components/QrCode';
import { TimeoutButton } from '@/components/TimeoutButton';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithReceipt } from '@/components/WithReceipt';

import { generateFadedColorVariant } from '@/lib/styles';

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
            allowUserSelection: true,
          },
        ]}
      >
        <$QrCode
          hasLogo
          size={432}
          value={nobleAddress || ''}
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
const $WaitingSpan = styled.span`
  ${layoutMixins.row}
  gap: 1rem;
  color: var(--color-text-1);
`;

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

const $CautionIconContainer = styled.div`
  ${layoutMixins.stack}
  min-width: 2.5rem;
  height: 2.5rem;
  align-items: center;
  border-radius: 50%;
  overflow: hidden;
  color: var(--color-warning);

  svg {
    width: 1.125em;
    height: 1.125em;
    justify-self: center;
  }

  &:before {
    content: '';
    width: 2.5rem;
    height: 2.5rem;
    background-color: ${({ theme }) =>
      generateFadedColorVariant(theme.warning, OpacityToken.Opacity16)};
  }
`;
