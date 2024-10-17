import { useCallback } from 'react';

import { SubaccountPendingPosition } from '@/constants/abacus';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAssetImageUrl } from '@/state/assetsSelectors';
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
  const assetImgUrl = useAppSelector((s) => getAssetImageUrl(s, assetId));

  return (
    <PortfolioCard
      assetName={marketName}
      assetId={assetId}
      assetImgUrl={assetImgUrl}
      detailLabel={stringGetter({ key: STRING_KEYS.MARGIN })}
      detailValue={<Output type={OutputType.Fiat} value={freeCollateral?.current} />}
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
