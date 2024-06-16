import styled from 'styled-components';

import { type SubaccountOrder } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

import { useAppDispatch } from '@/state/appTypes';

type ElementProps = {
  marketId: string;
  assetId: string;
  stopLossOrders: SubaccountOrder[];
  takeProfitOrders: SubaccountOrder[];
  setIsOpen: (open: boolean) => void;
};

export const SharePNLAnalyticsDialog = ({
  marketId,
  assetId,
  stopLossOrders,
  takeProfitOrders,
  setIsOpen,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.SHARE_ACTIVITY })}>
      <$Actions>
        <$Action action={ButtonAction.Secondary} slotLeft={<Icon iconName={IconName.Download} />}>
          {stringGetter({ key: STRING_KEYS.DOWNLOAD })}
        </$Action>
        <$Action action={ButtonAction.Primary} slotLeft={<Icon iconName={IconName.SocialX} />}>
          {stringGetter({ key: STRING_KEYS.SHARE })}
        </$Action>
      </$Actions>
    </Dialog>
  );
};

const $Actions = styled.div`
  display: flex;
  gap: 1rem;
`;

const $Action = styled(Button)`
  flex: 1;
`;
