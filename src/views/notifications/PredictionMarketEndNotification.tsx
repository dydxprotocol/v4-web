import { BonsaiHelpers } from '@/bonsai/ontology';
import { Link } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, PortfolioRoute } from '@/constants/routes';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
// eslint-disable-next-line import/no-cycle
import { Notification, type NotificationProps } from '@/components/Notification';

import { orEmptyObj } from '@/lib/typeUtils';

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
  const marketData = orEmptyObj(
    useParameterizedSelector(BonsaiHelpers.markets.createSelectMarketSummaryById, marketId)
  );
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
      slotIcon={<AssetIcon logoUrl={marketData.logo} symbol={marketData.assetId} />}
      slotTitle={stringGetter({
        key: STRING_KEYS.PREDICTION_MARKET_CONCLUDED,
        params: { MARKET: marketData.displayableTicker },
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
