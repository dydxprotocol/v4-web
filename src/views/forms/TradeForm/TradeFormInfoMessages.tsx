import { type Nullable } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { LocalStorageKey } from '@/constants/localStorage';
import { STRING_KEYS } from '@/constants/localization';
import { PREDICTION_MARKET } from '@/constants/markets';
import { StatsigFlags } from '@/constants/statsig';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAllStatsigGateValues } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { AlertMessage } from '@/components/AlertMessage';
import { Link } from '@/components/Link';

export const TradeFormInfoMessages = ({ marketId }: { marketId: Nullable<string> }) => {
  const stringGetter = useStringGetter();
  const { predictionMarketLearnMore } = useURLConfigs();
  const featureFlags = useAllStatsigGateValues();

  const [hasSeenTradeFormMessageTrumpWin, setHasSeenTradeFormMessageTrumpWin] = useLocalStorage({
    key: LocalStorageKey.HasSeenTradeFormMessageTRUMPWIN,
    defaultValue: false,
  });

  if (
    featureFlags?.[StatsigFlags.ffShowPredictionMarketsUi] &&
    marketId === PREDICTION_MARKET.TRUMPWIN &&
    !hasSeenTradeFormMessageTrumpWin
  ) {
    return (
      <AlertMessage type={AlertType.Notice}>
        <div tw="text-color-text-1">
          {stringGetter({
            key: STRING_KEYS.TRUMPWIN_DESC,
            params: {
              LEARN_MORE: (
                <Link
                  isInline
                  href={predictionMarketLearnMore}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  tw="underline"
                >
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
                </Link>
              ),
              DISMISS: (
                <Link
                  isInline
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setHasSeenTradeFormMessageTrumpWin(true);
                  }}
                  tw="underline"
                >
                  {stringGetter({ key: STRING_KEYS.DISMISS })}
                </Link>
              ),
            },
          })}
        </div>
      </AlertMessage>
    );
  }

  return null;
};
