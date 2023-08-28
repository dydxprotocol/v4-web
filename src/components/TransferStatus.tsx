import { useCallback, useState } from 'react';
import { useQuery } from 'react-query';
import styled, { css, keyframes, type AnyStyledComponent } from 'styled-components';
import { Root, Trigger, Content } from '@radix-ui/react-collapsible';

import type { TransferStatus } from '@/constants/abacus';

import { useInterval, useStringGetter } from '@/hooks';
import { useSquid } from '@/hooks/useSquid';

import { STRING_KEYS } from '@/constants/localization';

import { formatSeconds } from '@/lib/timeUtils';
import abacusStateManager from '@/lib/abacus';

import { Output, OutputType } from '@/components/Output';
import { Link } from '@/components/Link';
import { WithReceipt } from '@/components/WithReceipt';
import { Icon, IconName } from '@/components/Icon';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';
import { DateTime } from 'luxon';
import { LoadingDots } from './Loading/LoadingDots';

type ElementProps = {
  txHash: string;
  toChainId: string;
  fromChainId?: string;
  toAmount?: number;
  triggeredAt?: number;
};

export const TransferStatusToast = ({ txHash, toChainId, fromChainId, toAmount, triggeredAt = Date.now() }: ElementProps) => {
  const stringGetter = useStringGetter();
  const [open, setOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>();

  const squid = useSquid();

  const { data: status } = useQuery({
    queryKey: ['getTransactionStatus', { transactionId: txHash, toChainId, fromChainId }],
    queryFn: async () => await squid?.getStatus({ transactionId: txHash, toChainId, fromChainId }),
    refetchInterval: 30_000,
  });

  const updateSecondsLeft = useCallback(() => {
    const fromChainEta = (status?.fromChain?.chainData?.estimatedRouteDuration || 0) * 1000;
    const toChainEta = (status?.toChain?.chainData?.estimatedRouteDuration || 0) * 1000;
    setSecondsLeft(Math.floor((triggeredAt + fromChainEta + toChainEta - Date.now()) / 1000));
  }, [status]);

  useInterval({ callback: updateSecondsLeft });

  if (!status) return <LoadingDots size={3} />;

  return (
    <Styled.Root open={open} onOpenChange={setOpen}>
      <WithReceipt
        hideReceipt={!open}
        side="bottom"
        slotReceipt={
          <Styled.Content>
            {/* {statusSteps.map(({ status, label, url, eta }, index) => {
              return (
                <Styled.Step key={index}>
                  {url ? (
                    <Link href={url}>
                      <span>{label}</span>
                      <Icon iconName={IconName.LinkOut} />
                    </Link>
                  ) : (
                    <span>{label}</span>
                  )}
                </Styled.Step>
              );
            })} */}
          </Styled.Content>
        }
      >
        <Styled.BridgingStatus>
          <Styled.Status>
            {stringGetter({
              key: STRING_KEYS.DEPOSIT_STATUS,
              params: {
                AMOUNT_USD: (
                  <Styled.InlineOutput
                    type={OutputType.Fiat}
                    value={toAmount}
                  />
                ),
                ESTIMATED_DURATION: (
                  <Styled.InlineOutput
                    type={OutputType.Text}
                    value={formatSeconds(secondsLeft || 0)}
                  />
                ),
              },
            })}
          </Styled.Status>
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
  margin: 0 -1rem -1rem -1rem;
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
