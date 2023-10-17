import { useCallback, useState, useMemo } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { Root, Trigger, Content } from '@radix-ui/react-collapsible';
import { StatusResponse } from '@0xsquid/sdk';

import { useInterval, useStringGetter } from '@/hooks';

import { STRING_KEYS } from '@/constants/localization';
import { AlertType } from '@/constants/alerts';

import { formatSeconds } from '@/lib/timeUtils';

import { AlertMessage } from '@/components/AlertMessage';
import { Output, OutputType } from '@/components/Output';
import { WithReceipt } from '@/components/WithReceipt';
import { Icon, IconName } from '@/components/Icon';
import { TransferStatusSteps } from '@/views/TransferStatusSteps';
import { LoadingDots } from '@/components/Loading/LoadingDots';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  type: 'withdrawal' | 'deposit';
  toAmount?: number;
  triggeredAt?: number;
  status?: StatusResponse;
};

export const TransferStatusToast = ({
  type,
  toAmount,
  triggeredAt = Date.now(),
  status,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const [open, setOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>();

  // @ts-ignore status.errors is not in the type definition but can be returned
  const error = status?.errors?.length ? status?.errors[0] : status?.error;

  const updateSecondsLeft = useCallback(() => {
    const fromChainEta = (status?.fromChain?.chainData?.estimatedRouteDuration || 0) * 1000;
    const toChainEta = (status?.toChain?.chainData?.estimatedRouteDuration || 0) * 1000;
    setSecondsLeft(Math.floor((triggeredAt + fromChainEta + toChainEta - Date.now()) / 1000));
  }, [status]);

  useInterval({ callback: updateSecondsLeft });

  if (!status) return <LoadingDots size={3} />;

  const statusString =
    type === 'deposit'
      ? status?.squidTransactionStatus === 'success'
        ? STRING_KEYS.DEPOSIT_COMPLETE
        : STRING_KEYS.DEPOSIT_STATUS
      : status?.squidTransactionStatus === 'success'
      ? STRING_KEYS.WITHDRAW_COMPLETE
      : STRING_KEYS.WITHDRAW_STATUS;

  return (
    <Styled.Root open={open} onOpenChange={setOpen}>
      <WithReceipt
        hideReceipt={!open}
        side="bottom"
        slotReceipt={
          <Styled.Receipt>
            <TransferStatusSteps status={status} type={type} />
          </Styled.Receipt>
        }
      >
        <Styled.BridgingStatus>
          <Styled.Status>
            {stringGetter({
              key: statusString,
              params: {
                AMOUNT_USD: <Styled.InlineOutput type={OutputType.Fiat} value={toAmount} />,
                ESTIMATED_DURATION: (
                  <Styled.InlineOutput
                    type={OutputType.Text}
                    value={formatSeconds(Math.max(secondsLeft || 0, 0))}
                  />
                ),
              },
            })}
          </Styled.Status>
          {error && (
            <AlertMessage type={AlertType.Error}>
              {stringGetter({
                key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
                params: {
                  ERROR_MESSAGE: error.message || stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }),
                },
              })}
            </AlertMessage>
          )}
          <Styled.Trigger>
            <Styled.TriggerIcon>
              <Icon iconName={IconName.Caret} />
            </Styled.TriggerIcon>
            {stringGetter({ key: open ? STRING_KEYS.HIDE_DETAILS : STRING_KEYS.VIEW_DETAILS })}
          </Styled.Trigger>
        </Styled.BridgingStatus>
      </WithReceipt>
    </Styled.Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)`
  margin: 0.5rem -1rem -1rem -1rem;
  color: var(--color-text-0);
  font: var(--font-small-book);
`;

Styled.Receipt = styled.div`
  padding: 0 1rem;
`;

Styled.BridgingStatus = styled.div`
  ${layoutMixins.flexColumn};
  background-color: var(--color-layer-3);

  gap: 0.5rem;
  padding: 0 1rem 1rem 1rem;
  border-radius: 0.5rem;
`;

Styled.Status = styled.div`
  color: var(--color-text-0);

  font-size: 0.875rem;
`;

Styled.InlineOutput = styled(Output)`
  display: inline-block;

  color: var(--color-text-1);
`;

Styled.Content = styled(Content)`
  ${layoutMixins.flexColumn};

  gap: 0.5rem;
  padding: 1rem;
`;

Styled.Step = styled.div`
  ${layoutMixins.row};

  gap: 0.5rem;
`;

Styled.Trigger = styled(Trigger)`
  display: flex;
  align-items: center;
  gap: 0.5em;

  color: var(--color-accent);
  user-select: none;
  &:focus {
    outline: none;
  }
`;

Styled.TriggerIcon = styled.span`
  width: 0.75em;

  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);

  ${Styled.Trigger}[data-state='open'] & {
    rotate: -0.5turn;
  }
`;
