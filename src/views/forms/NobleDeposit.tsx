import { useState } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';

import { OpacityToken } from '@/constants/styles/base';
import { STRING_KEYS } from '@/constants/localization';
import { layoutMixins } from '@/styles/layoutMixins';

import { useAccounts, useStringGetter } from '@/hooks';

import { CopyButton } from '@/components/CopyButton';
import { QrCode } from '@/components/QrCode';
import { Checkbox } from '@/components/Checkbox';
import { Icon, IconName } from '@/components/Icon';
import { TimeoutButton } from '@/components/TimeoutButton';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithReceipt } from '@/components/WithReceipt';

import { generateFadedColorVariant } from '@/lib/styles';

export const NobleDeposit = () => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
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
            value: nobleAddress,
          },
        ]}
      >
        <Styled.QrCodeContainer>
          <Styled.QrCode size={432} value={nobleAddress || ''} />
        </Styled.QrCodeContainer>
      </WithDetailsReceipt>

      <Styled.WaitingSpan>
        <Styled.CautionIconContainer>
          <Icon iconName={IconName.CautionCircleStroked} />
        </Styled.CautionIconContainer>

        <p>{stringGetter({ key: STRING_KEYS.NOBLE_WARNING })}</p>
      </Styled.WaitingSpan>

      <Styled.WithReceipt
        slotReceipt={
          <Styled.CheckboxContainer>
            <Checkbox
              checked={hasAcknowledged}
              onCheckedChange={setHasAcknowledged}
              id="acknowledge-secret-phase-risk"
              label={stringGetter({
                key: STRING_KEYS.NOBLE_ACKNOWLEDGEMENT,
              })}
            />
          </Styled.CheckboxContainer>
        }
      >
        <TimeoutButton
          timeoutInSeconds={8}
          slotFinal={<CopyButton state={{ isDisabled: !hasAcknowledged }} value={nobleAddress} />}
        />
      </Styled.WithReceipt>
    </>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.WaitingSpan = styled.span`
  ${layoutMixins.row}
  gap: 1rem;
  color: var(--color-text-1);
`;

Styled.WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

Styled.QrCodeContainer = styled.div`
  display: flex;
  justify-content: center;

  padding: 0.5rem;

  background-color: var(--color-layer-2);
  border-radius: 0.5rem;
`;

Styled.QrCode = styled(QrCode)`
  max-height: 20rem;
  width: fit-content;

  svg {
    max-height: 20rem;
  }
`;

Styled.CheckboxContainer = styled.div`
  padding: 1rem;
  color: var(--color-text-0);
`;

Styled.CautionIconContainer = styled.div`
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
