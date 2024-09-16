import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Output, OutputType } from '@/components/Output';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const LaunchMarketSidePanel = ({
  className,
  launchableMarketId,
}: {
  className?: string;
  launchableMarketId?: string;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const items = [
    {
      title: stringGetter({
        key: STRING_KEYS.DEPOSIT_TO_DESTINATION,
        params: { DESTINATION_CHAIN: 'MegaVault' },
      }),
      body: stringGetter({
        key: STRING_KEYS.MARKET_LAUNCH_DETAILS_2,
        params: {
          DEPOSIT_AMOUNT: `${10_000} USDC`,
          APR_PERCENTAGE: <Output type={OutputType.Percent} value={0.3456} />,
          PAST_DAYS: 30,
        },
      }),
    },
    {
      title: stringGetter({ key: STRING_KEYS.TRADE }),
      body: stringGetter({
        key: STRING_KEYS.AVAILABLE_TO_TRADE_POST_LAUNCH,
        params: { MARKET: launchableMarketId },
      }),
    },
  ];

  const steps = items.map((item, idx) => (
    <div key={item.title} tw="flex flex-row gap-0.5">
      <div tw="flex h-3 w-3 min-w-3 items-center justify-center rounded-[50%] bg-color-layer-3 text-color-text-0">
        {idx + 1}
      </div>
      <div tw="flex flex-col">
        <span tw="text-color-text-1">{item.title}</span>
        <span tw="text-color-text-0">{item.body}</span>
      </div>
    </div>
  ));

  return (
    <$Container className={className}>
      <h2 tw="text-large text-color-text-2">
        {stringGetter({
          key: STRING_KEYS.INSTANTLY_LAUNCH,
          params: { MARKET: launchableMarketId },
        })}
      </h2>
      <div tw="flex flex-col gap-1">{steps}</div>
      <Button
        action={ButtonAction.Primary}
        onClick={() => {
          dispatch(openDialog(DialogTypes.LaunchMarket()));
        }}
      >
        {stringGetter({ key: STRING_KEYS.LAUNCH_MARKET })}
      </Button>
    </$Container>
  );
};

const $Container = styled.section`
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;

  button {
    width: 100%;
  }
`;
