import { OrderSide } from '@/bonsai/forms/trade/types';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';
import { TvChart } from '@/views/charts/TradingView/TvChart';
import { TvChartLaunchable } from '@/views/charts/TradingView/TvChartLaunchable';
import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { calculateCanAccountTrade } from '@/state/accountCalculators';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { openDialog } from '@/state/dialogs';

import { AssetDetails } from './AssetDetails';
import { AssetHeader } from './AssetHeader';
import { AssetPosition } from './AssetPosition';

const AssetPage = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const currentMarketId = useAppSelector(getCurrentMarketId);
  const { isViewingUnlaunchedMarket } = useCurrentMarketId();
  const canAccountTrade = useAppSelector(calculateCanAccountTrade);

  if (currentMarketId == null) {
    return <LoadingSpace id="asset-page-loading" />;
  }

  const pageContent = isViewingUnlaunchedMarket ? (
    <>
      <div tw="row mx-1.25 justify-center gap-0.5 rounded-0.5 border border-solid border-color-border py-0.5 text-color-text-0">
        <Icon iconName={IconName.Info} />
        {stringGetter({ key: STRING_KEYS.LAUNCHABLE_DETAILS })}
      </div>
      <div tw="h-[20rem] font-small-book">
        <TvChartLaunchable marketId={currentMarketId} />
      </div>
      <div tw="flexColumn gap-2 px-1.25">
        <AssetDetails isLaunchableMarket />
      </div>
      {/* TODO: Add localization for details */}
      <div tw="flexColumn mx-1.25 gap-0.25 rounded-0.5 bg-color-layer-3 p-1 text-center">
        <span tw="mb-0.25 text-color-text-2 font-medium-bold">Launch on desktop</span>
        <span tw="text-color-text-1 font-base-book">
          Add $10k into MegaVault to launch this market.
        </span>
        <span tw="text-color-text-0 font-small-book">
          Your funds will earn and estimated <MegaVaultYieldOutput tw="inline" /> APR
        </span>
      </div>
    </>
  ) : (
    <>
      <div tw="mb-1.5 h-[20rem] font-small-book">
        <TvChart />
      </div>
      <div tw="flexColumn gap-2 px-1.25 pb-[5.25rem]">
        <AssetPosition />
        <AssetDetails />
      </div>
    </>
  );

  const footerContent = canAccountTrade ? (
    <>
      <Button
        tw="flex-1 bg-color-negative-dark text-color-negative"
        shape={ButtonShape.Pill}
        onClick={() => dispatch(openDialog(DialogTypes.SimpleUiTrade({ side: OrderSide.SELL })))}
      >
        {stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
      </Button>

      <Button
        tw="flex-1 bg-color-positive-dark text-color-positive"
        shape={ButtonShape.Pill}
        onClick={() => dispatch(openDialog(DialogTypes.SimpleUiTrade({ side: OrderSide.BUY })))}
      >
        {stringGetter({ key: STRING_KEYS.LONG_POSITION_SHORT })}
      </Button>
    </>
  ) : (
    <OnboardingTriggerButton tw="flex-1" shape={ButtonShape.Pill} size={ButtonSize.Base} />
  );

  return (
    <div tw="flexColumn h-full">
      <AssetHeader isLaunchableMarket={isViewingUnlaunchedMarket} />
      {isViewingUnlaunchedMarket ? (
        <div tw="mt-[5.5rem] grid gap-1.5 overflow-auto pb-1.5">{pageContent}</div>
      ) : (
        <>
          <div tw="mt-[4rem] overflow-auto">{pageContent}</div>
          <div
            tw="row fixed bottom-0 left-0 right-0 gap-1.25 px-1.25 py-1.25"
            css={{
              background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), var(--color-layer-1))',
            }}
          >
            {footerContent}
          </div>
        </>
      )}
    </div>
  );
};

export default AssetPage;
