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

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';
import { useVaultCalculationForLaunchingMarket } from '@/hooks/vaultsHooks';

import { DetailsItem } from '@/components/Details';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType } from '@/components/Output';
import { MegaVaultYieldOutput } from '@/views/MegaVaultYieldOutput';

import { getSubaccount } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { track } from '@/lib/analytics/analytics';
import { isTruthy } from '@/lib/isTruthy';
import { orEmptyObj } from '@/lib/typeUtils';

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
  setFormStep?: Dispatch<SetStateAction<NewMarketFormStep | undefined>>;
  updateTickerToAdd?: Dispatch<SetStateAction<string | undefined>>;
};

export const NewMarketForm = ({
  defaultLaunchableMarketId,
  setFormStep,
  updateTickerToAdd,
}: NewMarketFormProps) => {
  const [step, setStep] = useState(NewMarketFormStep.SELECTION);
  const [tickerToAdd, setTickerToAdd] = useState<string | undefined>(defaultLaunchableMarketId);
  const [proposalTxHash, setProposalTxHash] = useState<string>();
  const { mintscan: mintscanTxUrl } = useURLConfigs();
  const stringGetter = useStringGetter();

  const subAccount = orEmptyObj(useAppSelector(getSubaccount, shallowEqual));
  const { freeCollateral, marginUsage } = subAccount;
  const currentFreeCollateral = freeCollateral?.toNumber() ?? 0;

  useEffect(() => {
    if (defaultLaunchableMarketId) {
      setTickerToAdd(defaultLaunchableMarketId);
    }
  }, [defaultLaunchableMarketId]);

  const summaryData = useVaultCalculationForLaunchingMarket({
    amount: DEFAULT_VAULT_DEPOSIT_FOR_LAUNCH,
  }).summaryData;
  const { freeCollateral: freeCollateralUpdated, marginUsage: marginUsageUpdated } =
    orEmptyObj(summaryData);

  useEffect(() => {
    setFormStep?.(step);
  }, [setFormStep, step]);

  useEffect(() => {
    updateTickerToAdd?.(tickerToAdd);
  }, [updateTickerToAdd, tickerToAdd]);

  const shouldHideTitleAndDescription = setFormStep !== undefined;

  const trackLaunchMarketFormStepChange = useCallback(
    ({
      currentStep,
      updatedStep,
      ticker,
    }: {
      currentStep: NewMarketFormStep;
      updatedStep: NewMarketFormStep;
      ticker?: string;
    }) => {
      track(
        AnalyticsEvents.LaunchMarketFormStepChange({
          currentStep,
          updatedStep,
          ticker,
          userFreeCollateral: currentFreeCollateral,
        })
      );
    },
    [currentFreeCollateral]
  );

  const freeCollateralDetailItem = useMemo(() => {
    return {
      key: 'cross-free-collateral',
      label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
      value: (
        <DiffOutput
          withDiff={!!freeCollateral?.toNumber()}
          type={OutputType.Fiat}
          value={freeCollateral?.toNumber()}
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
        key: 'est-apr',
        label: `${stringGetter({ key: STRING_KEYS.EST_APR_PLAIN })} (30${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })})`,
        value: <MegaVaultYieldOutput />,
      },
      {
        key: 'lockup-period',
        label: stringGetter({ key: STRING_KEYS.LOCKUP_PERIOD }),
        value: (
          <Output
            type={OutputType.Text}
            value={`~30${stringGetter({ key: STRING_KEYS.DAYS_ABBREVIATED })}`}
          />
        ),
      },
      {
        key: 'cross-margin-usage',
        label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
        value: (
          <DiffOutput
            withDiff={!!marginUsage?.toNumber() && marginUsageUpdated != null}
            type={OutputType.Percent}
            value={marginUsage?.toNumber()}
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

      trackLaunchMarketFormStepChange({
        currentStep: NewMarketFormStep.PREVIEW,
        updatedStep: NewMarketFormStep.SUCCESS,
        ticker: tickerToAdd,
      });
    },
    [tickerToAdd, trackLaunchMarketFormStepChange]
  );

  /**
   * Permissionless Markets Flow
   */

  if (NewMarketFormStep.SUCCESS === step && tickerToAdd && proposalTxHash) {
    return (
      <NewMarketSuccessStep2
        transactionUrl={mintscanTxUrl.replace('{tx_hash}', proposalTxHash)}
        tickerToAdd={tickerToAdd}
      />
    );
  }

  if (NewMarketFormStep.PREVIEW === step && tickerToAdd) {
    return (
      <NewMarketPreviewStep2
        onSuccess={onSuccess}
        onBack={() => {
          setStep(NewMarketFormStep.SELECTION);

          trackLaunchMarketFormStepChange({
            currentStep: NewMarketFormStep.PREVIEW,
            updatedStep: NewMarketFormStep.SELECTION,
            ticker: tickerToAdd,
          });
        }}
        receiptItems={receiptItems}
        shouldHideTitleAndDescription={shouldHideTitleAndDescription}
        ticker={tickerToAdd}
      />
    );
  }

  return (
    <NewMarketSelectionStep2
      hasDefault={!!defaultLaunchableMarketId}
      onConfirmMarket={() => {
        setStep(NewMarketFormStep.PREVIEW);

        trackLaunchMarketFormStepChange({
          currentStep: NewMarketFormStep.SELECTION,
          updatedStep: NewMarketFormStep.PREVIEW,
          ticker: tickerToAdd,
        });
      }}
      freeCollateralDetailItem={freeCollateralDetailItem}
      receiptItems={receiptItems}
      setTickerToAdd={setTickerToAdd}
      shouldHideTitleAndDescription={shouldHideTitleAndDescription}
      tickerToAdd={tickerToAdd}
    />
  );
};
