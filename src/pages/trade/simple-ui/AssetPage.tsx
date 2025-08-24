import { OrderSide } from '@/bonsai/forms/trade/types';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH } from '@/constants/numbers';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useCurrentMarketId } from '@/hooks/useCurrentMarketId';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { WithTooltip } from '@/components/WithTooltip';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';
import { ChartSelector } from '@/views/charts/TradingView/ChartSelector';
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
  const { complianceState } = useComplianceState();

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

      <div tw="flexColumn mx-1.25 gap-0.25 rounded-0.5 bg-color-layer-3 p-1 text-center">
        <span tw="mb-0.25 text-color-text-2 font-medium-bold">
          {stringGetter({ key: STRING_KEYS.LAUNCH_ON_DESKTOP })}
        </span>
        <span tw="text-color-text-1 font-base-book">
          {stringGetter({
            key: STRING_KEYS.ADD_FUNDS_TO_LAUNCH,
            params: {
              DEPOSIT_AMOUNT: (
                <Output
                  useGrouping
                  type={OutputType.CompactFiat}
                  tw="inline-block"
                  value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH}
                />
              ),
            },
          })}
        </span>
        <span tw="text-color-text-0 font-small-book">
          {stringGetter({
            key: STRING_KEYS.YOUR_FUNDS_WILL_EARN_EST,
            params: {
              APR_PERCENTAGE: (
                <WithTooltip tooltip="vault-apr-90d">
                  <MegaVaultYieldOutput
                    withLoading
                    yieldType="ninetyDay"
                    tw="inline-block"
                    slotRight={<span>{stringGetter({ key: STRING_KEYS.APR })}</span>}
                  />
                </WithTooltip>
              ),
            },
          })}
        </span>
      </div>
    </>
  ) : (
    <>
      <div tw="mb-1.5 h-[20rem] font-small-book">
        <ChartSelector />
      </div>
      <div tw="flexColumn gap-2 px-1.25 pb-[5.25rem]">
        <AssetPosition />
        <AssetDetails />
      </div>
    </>
  );

  const isDisabled = complianceState !== ComplianceStates.FULL_ACCESS;

  const footerContent = isDisabled ? (
    <Button
      tw="flex-1 border border-solid border-color-layer-6"
      shape={ButtonShape.Pill}
      size={ButtonSize.Large}
      state={ButtonState.Disabled}
      action={ButtonAction.SimpleSecondary}
    >
      {stringGetter({ key: STRING_KEYS.UNAVAILABLE })}
    </Button>
  ) : canAccountTrade ? (
    <>
      <Button
        tw="flex-1 bg-color-negative-dark text-color-negative"
        shape={ButtonShape.Pill}
        size={ButtonSize.Large}
        onClick={() =>
          dispatch(
            openDialog(
              DialogTypes.SimpleUiTrade({ side: OrderSide.SELL, isClosingPosition: false })
            )
          )
        }
      >
        {stringGetter({ key: STRING_KEYS.SHORT_POSITION_SHORT })}
      </Button>

      <Button
        tw="flex-1 bg-color-positive-dark text-color-positive"
        shape={ButtonShape.Pill}
        size={ButtonSize.Large}
        onClick={() =>
          dispatch(
            openDialog(DialogTypes.SimpleUiTrade({ side: OrderSide.BUY, isClosingPosition: false }))
          )
        }
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
        <div tw="grid gap-1.5 overflow-auto py-1.5">{pageContent}</div>
      ) : (
        <>
          <div tw="overflow-auto">{pageContent}</div>
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
