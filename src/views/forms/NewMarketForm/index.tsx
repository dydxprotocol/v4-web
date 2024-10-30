import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { shallowEqual } from 'react-redux';

import { AnalyticsEvents } from '@/constants/analytics';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH, NumberSign } from '@/constants/numbers';
import { type NewMarketProposal } from '@/constants/potentialMarkets';

import { useNextClobPairId } from '@/hooks/useNextClobPairId';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import { useVaultCalculationForLaunchingMarket } from '@/hooks/vaultsHooks';

import { DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';

import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { track } from '@/lib/analytics/analytics';
import { isTruthy } from '@/lib/isTruthy';
import { getTickSizeDecimalsFromPrice } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';
import { orEmptyObj } from '@/lib/typeUtils';

import { NewMarketPreviewStep } from './NewMarketPreviewStep';
import { NewMarketSelectionStep } from './NewMarketSelectionStep';
import { NewMarketSuccessStep } from './NewMarketSuccessStep';
import { NewMarketPreviewStep as NewMarketPreviewStep2 } from './v7/NewMarketPreviewStep';
import { NewMarketSelectionStep as NewMarketSelectionStep2 } from './v7/NewMarketSelectionStep';
import { NewMarketSuccessStep as NewMarketSuccessStep2 } from './v7/NewMarketSuccessStep';

export enum NewMarketFormStep {
  SELECTION,
  PREVIEW,
  SUCCESS,
}

type NewMarketFormProps = {
  defaultLaunchableMarketId?: string;
  onCloseDialog?: () => void;
  setFormStep?: Dispatch<SetStateAction<NewMarketFormStep | undefined>>;
  setIsParentLoading?: Dispatch<SetStateAction<boolean>>;
  updateTickerToAdd?: Dispatch<SetStateAction<string | undefined>>;
};

export const NewMarketForm = ({
  defaultLaunchableMarketId,
  onCloseDialog,
  setFormStep,
  setIsParentLoading,
  updateTickerToAdd,
}: NewMarketFormProps) => {
  const [step, setStep] = useState(NewMarketFormStep.SELECTION);
  const [assetToAdd, setAssetToAdd] = useState<NewMarketProposal>();
  const [tickerToAdd, setTickerToAdd] = useState<string | undefined>(defaultLaunchableMarketId);
  const [liquidityTier, setLiquidityTier] = useState<number>();
  const [proposalTxHash, setProposalTxHash] = useState<string>();
  const { mintscan: mintscanTxUrl } = useURLConfigs();
  const stringGetter = useStringGetter();

  const { tickersFromProposals } = useNextClobPairId();
  const { hasPotentialMarketsData } = usePotentialMarkets();
  const subAccount = orEmptyObj(useAppSelector(getSubaccount, shallowEqual));
  const { freeCollateral, marginUsage } = subAccount;

  const summaryData = useVaultCalculationForLaunchingMarket({
    amount: DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH,
  }).summaryData;
  const { freeCollateral: freeCollateralUpdated, marginUsage: marginUsageUpdated } =
    orEmptyObj(summaryData);

  const tickSizeDecimals = useMemo(() => {
    return getTickSizeDecimalsFromPrice(assetToAdd?.meta.referencePrice);
  }, [assetToAdd]);

  useEffect(() => {
    setFormStep?.(step);
  }, [setFormStep, step]);

  useEffect(() => {
    updateTickerToAdd?.(tickerToAdd);
  }, [updateTickerToAdd, tickerToAdd]);

  const shouldHideTitleAndDescription = setFormStep !== undefined;

  const freeCollateralDetailItem = useMemo(() => {
    return {
      key: 'cross-free-collateral',
      label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
      value: (
        <DiffOutput
          withDiff={!!freeCollateral?.current}
          type={OutputType.Fiat}
          value={freeCollateral?.current}
          newValue={freeCollateralUpdated}
          sign={NumberSign.Negative}
          hasInvalidNewValue={(freeCollateralUpdated ?? 0) < 0}
        />
      ),
    };
  }, [freeCollateral, freeCollateralUpdated, stringGetter]);

  const receiptItems: DetailsItem[] = useMemo(() => {
    return [
      {
        key: 'deposit-apr',
        label: `${stringGetter({ key: STRING_KEYS.DEPOSIT_APR })} (30${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })})`,
        value: <MegaVaultYieldOutput />,
      },
      {
        key: 'deposit-lockup',
        label: stringGetter({ key: STRING_KEYS.DEPOSIT_LOCKUP }),
        value: (
          <Output
            type={OutputType.Text}
            value={`30${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`}
          />
        ),
      },
      {
        key: 'cross-margin-usage',
        label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
        value: (
          <DiffOutput
            withDiff={!!marginUsage?.current && marginUsageUpdated != null}
            type={OutputType.Percent}
            value={marginUsage?.current}
            newValue={marginUsageUpdated}
            sign={NumberSign.Negative}
            hasInvalidNewValue={(marginUsageUpdated ?? 0) < 0 || (marginUsageUpdated ?? 0) > 1}
          />
        ),
      },
      step === NewMarketFormStep.PREVIEW && freeCollateralDetailItem,
      {
        key: 'megavault-balance',
        label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
        value: <Output type={OutputType.Fiat} value={DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH} />,
      },
    ].filter(isTruthy);
  }, [freeCollateralDetailItem, marginUsage, marginUsageUpdated, step, stringGetter]);

  const onSuccess = useCallback(
    (txHash: string) => {
      setProposalTxHash(txHash);
      setStep(NewMarketFormStep.SUCCESS);

      track(
        AnalyticsEvents.LaunchMarketFormStepChange({
          currentStep: NewMarketFormStep.PREVIEW,
          updatedStep: NewMarketFormStep.SUCCESS,
          ticker: tickerToAdd,
        })
      );
    },
    [tickerToAdd]
  );

  /**
   * Permissionless Markets Flow
   */
  if (testFlags.pml) {
    if (NewMarketFormStep.SUCCESS === step && tickerToAdd && proposalTxHash) {
      return (
        <NewMarketSuccessStep2
          transactionUrl={mintscanTxUrl.replace('{tx_hash}', proposalTxHash)}
          tickerToAdd={tickerToAdd}
          onCloseDialog={onCloseDialog}
          onLaunchAnotherMarket={() => {
            setTickerToAdd(undefined);
            setStep(NewMarketFormStep.SELECTION);

            track(
              AnalyticsEvents.LaunchMarketFormStepChange({
                currentStep: NewMarketFormStep.SUCCESS,
                updatedStep: NewMarketFormStep.SELECTION,
                ticker: undefined,
              })
            );
          }}
        />
      );
    }

    if (NewMarketFormStep.PREVIEW === step && tickerToAdd) {
      return (
        <NewMarketPreviewStep2
          onSuccess={onSuccess}
          onBack={() => {
            setStep(NewMarketFormStep.SELECTION);

            track(
              AnalyticsEvents.LaunchMarketFormStepChange({
                currentStep: NewMarketFormStep.PREVIEW,
                updatedStep: NewMarketFormStep.SELECTION,
                ticker: tickerToAdd,
              })
            );
          }}
          receiptItems={receiptItems}
          setIsParentLoading={setIsParentLoading}
          shouldHideTitleAndDescription={shouldHideTitleAndDescription}
          ticker={tickerToAdd}
        />
      );
    }

    return (
      <NewMarketSelectionStep2
        onConfirmMarket={() => {
          setStep(NewMarketFormStep.PREVIEW);

          track(
            AnalyticsEvents.LaunchMarketFormStepChange({
              currentStep: NewMarketFormStep.SELECTION,
              updatedStep: NewMarketFormStep.PREVIEW,
              ticker: tickerToAdd,
            })
          );
        }}
        freeCollateralDetailItem={freeCollateralDetailItem}
        receiptItems={receiptItems}
        setTickerToAdd={setTickerToAdd}
        shouldHideTitleAndDescription={shouldHideTitleAndDescription}
        tickerToAdd={tickerToAdd}
      />
    );
  }

  /**
   * Current Market Proposal Flow
   */

  if (!hasPotentialMarketsData) {
    return <LoadingSpace id="new-market-form" tw="min-h-[18.75rem]" />;
  }

  if (NewMarketFormStep.SUCCESS === step && proposalTxHash) {
    return <NewMarketSuccessStep href={mintscanTxUrl.replace('{tx_hash}', proposalTxHash)} />;
  }

  if (NewMarketFormStep.PREVIEW === step) {
    if (assetToAdd && liquidityTier) {
      return (
        <NewMarketPreviewStep
          assetData={assetToAdd}
          liquidityTier={liquidityTier}
          onBack={() => setStep(NewMarketFormStep.SELECTION)}
          onSuccess={(hash: string) => {
            setProposalTxHash(hash);
            setStep(NewMarketFormStep.SUCCESS);
          }}
          tickSizeDecimals={tickSizeDecimals}
        />
      );
    }
  }

  return (
    <NewMarketSelectionStep
      onConfirmMarket={() => {
        setStep(NewMarketFormStep.PREVIEW);
      }}
      assetToAdd={assetToAdd}
      setAssetToAdd={setAssetToAdd}
      liquidityTier={liquidityTier}
      setLiquidityTier={setLiquidityTier}
      tickSizeDecimals={tickSizeDecimals}
      tickersFromProposals={tickersFromProposals}
    />
  );
};
