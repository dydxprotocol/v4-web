import { useCallback } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { PendingIsolatedPosition } from '@/bonsai/types/summaryTypes';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { orEmptyObj } from '@/lib/typeUtils';

import { Icon, IconName } from './Icon';
import { Link } from './Link';
import { Output, OutputType } from './Output';
import { PortfolioCard } from './PortfolioCard';

type PotentialPositionCardProps = {
  onViewOrders: (marketId: string) => void;
  pendingPosition: PendingIsolatedPosition;
};

export const PotentialPositionCard = ({
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
  const { displayableAsset, equity, marketId, orders } = pendingPosition;
  const orderCount = orders.length;
  const marketSummaries = orEmptyObj(useAppSelector(BonsaiCore.markets.markets.data));
  const { name, logo } = orEmptyObj(marketSummaries[marketId]);

  return (
    <PortfolioCard
      assetName={name ?? displayableAsset}
      assetImgUrl={logo}
      detailLabel={stringGetter({ key: STRING_KEYS.MARGIN })}
      detailValue={<Output type={OutputType.Fiat} value={equity} />}
      actionSlot={
        <>
          <Link onClick={() => onViewOrders(marketId)} isAccent tw="font-small-book">
            {stringGetter({ key: orderCount > 1 ? STRING_KEYS.VIEW_ORDERS : STRING_KEYS.VIEW })}{' '}
            <Icon iconName={IconName.Arrow} />
          </Link>
          <Link
            onClick={() => onCancelOrders(marketId)}
            tw="font-small-book [--link-color:--color-risk-high]"
          >
            {stringGetter({ key: orderCount > 1 ? STRING_KEYS.CANCEL_ORDERS : STRING_KEYS.CANCEL })}{' '}
          </Link>
        </>
      }
    />
  );
};
