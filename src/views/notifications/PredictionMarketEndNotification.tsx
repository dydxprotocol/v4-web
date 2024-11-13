import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

import { useAppSelector } from '@/state/appTypes';
import { getAssetData } from '@/state/assetsSelectors';
import { getMarketData } from '@/state/perpetualsSelectors';

type ElementProps = {
  hadCorrectOutcome: boolean;
  marketId: string;
};

export const PredictionMarketEndNotification = ({
  hadCorrectOutcome,
  marketId,
  isToast,
  notification,
}: ElementProps & NotificationProps) => {
  const stringGetter = useStringGetter();
  const assetId = useAppSelector((s) => getMarketData(s, marketId))?.assetId;
  const assetData = useAppSelector((s) => getAssetData(s, assetId), shallowEqual);
  const outcome = hadCorrectOutcome
    ? stringGetter({ key: STRING_KEYS.PREDICTION_MARKET_WIN, params: { MARKET: marketId } })
    : stringGetter({ key: STRING_KEYS.PREDICTION_MARKET_LOSS, params: { MARKET: marketId } });

  const body = (
    <span tw="flex flex-col gap-0.5">
      <span tw="text-color-text-1">
        {stringGetter({
          key: STRING_KEYS.PREDICTION_MARKET_CONCLUDED_DESC,
          params: { MARKET: marketId },
        })}
      </span>
      <span tw="text-color-text-2">{outcome}</span>
    </span>
  );

  return (
    <Notification
      isToast={isToast}
      notification={notification}
      slotIcon={<AssetIcon logoUrl={assetData?.resources?.imageUrl} symbol={assetId} />}
      slotTitle={stringGetter({
        key: STRING_KEYS.PREDICTION_MARKET_CONCLUDED,
        params: { MARKET: marketId },
      })}
      slotCustomContent={body}
      slotAction={
        <Link
          tw="text-color-accent visited:text-color-accent"
          to={`${AppRoute.Portfolio}/${PortfolioRoute.History}`}
        >
          {stringGetter({ key: STRING_KEYS.VIEW_FILLS })} →
        </Link>
      }
    />
  );
};
