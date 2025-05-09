import { OrderSide } from '@/bonsai/forms/trade/types';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { TvChart } from '@/views/charts/TradingView/TvChart';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import AssetDetails from './AssetDetails';
import AssetHeader from './AssetHeader';
import AssetPosition from './AssetPosition';

const AssetPage = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isViewingUnlaunchedMarket } = useCurrentMarketId();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  const pageContent = isViewingUnlaunchedMarket ? (
    <div>Launch on Desktop</div>
  ) : (
    <>
      <div tw="mb-2 h-[18.75rem] font-small-book">
        <TvChart />
      </div>
      <div tw="flexColumn gap-2 px-1.25 pb-[5.25rem]">
        <AssetPosition />
        <AssetDetails />
      </div>
    </>
  );

  return (
    <div tw="flexColumn h-full">
      <AssetHeader />
      <div tw="mt-[4rem] overflow-auto">{pageContent}</div>
      {!isViewingUnlaunchedMarket && (
        <div
          tw="row fixed bottom-0 left-0 right-0 gap-1.25 px-1.25 py-1.25"
          css={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
          }}
        >
          {canAccountTrade ? (
            <>
              <Button
                tw="flex-1 bg-color-negative-dark text-color-negative"
                shape={ButtonShape.Pill}
                onClick={() =>
                  dispatch(openDialog(DialogTypes.SimpleUiTrade({ side: OrderSide.SELL })))
                }
              >
                {stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
              </Button>

              <Button
                tw="flex-1 bg-color-positive-dark text-color-positive"
                shape={ButtonShape.Pill}
                onClick={() =>
                  dispatch(openDialog(DialogTypes.SimpleUiTrade({ side: OrderSide.BUY })))
                }
              >
                {stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })}
              </Button>
            </>
          ) : (
            <OnboardingTriggerButton tw="flex-1" shape={ButtonShape.Pill} size={ButtonSize.Base} />
          )}
        </div>
      )}
    </div>
  );
};

export default AssetPage;
