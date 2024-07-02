import { useCallback } from 'react';

import styled from 'styled-components';

import { SubaccountPendingPosition } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { Icon, IconName } from './Icon';
import { Link } from './Link';
import { Output, OutputType } from './Output';
import { PortfolioCard } from './PortfolioCard';

type PotentialPositionCardProps = {
  marketName: string;
  onViewOrders: (marketId: string) => void;
  pendingPosition: SubaccountPendingPosition;
};

export const PotentialPositionCard = ({
  marketName,
  onViewOrders,
  pendingPosition,
}: PotentialPositionCardProps) => {
  const dispatch = useAppDispatch();
  const onCancelOrders = useCallback(
    (marketId: string) => {
      dispatch(openDialog(DialogTypes.CancelPendingOrders({ marketId })));
    },
    [dispatch]
  );

  const stringGetter = useStringGetter();
  const { assetId, freeCollateral, marketId, orderCount } = pendingPosition;

  return (
    <PortfolioCard
      assetName={marketName}
      assetId={assetId}
      detailLabel={stringGetter({ key: STRING_KEYS.MARGIN })}
      detailValue={<Output type={OutputType.Fiat} value={freeCollateral?.current} />}
      actionSlot={
        <>
          <$Link onClick={() => onViewOrders(marketId)} isAccent>
            {stringGetter({ key: orderCount > 1 ? STRING_KEYS.VIEW_ORDERS : STRING_KEYS.VIEW })}{' '}
            <Icon iconName={IconName.Arrow} />
          </$Link>
          <$CancelLink onClick={() => onCancelOrders(marketId)}>
            {stringGetter({ key: orderCount > 1 ? STRING_KEYS.CANCEL_ORDERS : STRING_KEYS.CANCEL })}{' '}
          </$CancelLink>
        </>
      }
    />
  );
};

const $Link = styled(Link)`
  font: var(--font-small-book);
`;

const $CancelLink = styled(Link)`
  --link-color: var(--color-risk-high);
  font: var(--font-small-book);
`;
