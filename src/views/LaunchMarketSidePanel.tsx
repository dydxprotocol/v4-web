import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

export const LaunchMarketSidePanel = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const items = [
    {
      title: 'Deposit to MegaVault',
      body: 'Immediately launch a new market on dYdX Chain by depositing 10,000 USDC into MegaVault. Your deposit will earn an estimated 34.56% APR (based on the last 30 days).',
    },
    {
      title: 'Trade',
      body: 'As soon as you launch {MARKET}, it will be available to trade.',
    },
  ];

  const steps = items.map((item, idx) => (
    <div key={item.title} tw="flex flex-row">
      <div tw="h-3 w-3 min-w-3 rounded-[50%] bg-color-layer-0 text-color-text-0">{idx + 1}</div>
      <div>
        <span tw="text-color-text-1">{item.title}</span>
        <span tw="text-color-text-0">{item.body}</span>
      </div>
    </div>
  ));

  return (
    <$Container>
      <h2>Instantly launch ETH-USD</h2>
      {steps}
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
  ${tw`flex flex-col gap-1`}
  padding: 1rem;

  button {
    width: 100%;
  }
`;
