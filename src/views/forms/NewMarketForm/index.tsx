import { useMemo, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';
import { PERCENT_DECIMALS, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { type NewMarketProposal } from '@/constants/potentialMarkets';

import { useNextClobPairId } from '@/hooks/useNextClobPairId';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { DiffOutput } from '@/components/DiffOutput';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

import { NewMarketPreviewStep } from './NewMarketPreviewStep';
import { NewMarketSelectionStep } from './NewMarketSelectionStep';
import { NewMarketSuccessStep } from './NewMarketSuccessStep';
import { NewMarketPreviewStep as NewMarketPreviewStep2 } from './v7/NewMarketPreviewStep';
import { NewMarketSelectionStep as NewMarketSelectionStep2 } from './v7/NewMarketSelectionStep';

enum NewMarketFormStep {
  SELECTION,
  PREVIEW,
  SUCCESS,
}

export const NewMarketForm = () => {
  const [step, setStep] = useState(NewMarketFormStep.SELECTION);
  const [assetToAdd, setAssetToAdd] = useState<NewMarketProposal>();
  const [tickerToAdd, setTickerToAdd] = useState<string>();
  const [liquidityTier, setLiquidityTier] = useState<number>();
  const [proposalTxHash, setProposalTxHash] = useState<string>();
  const { mintscan: mintscanTxUrl } = useURLConfigs();
  const stringGetter = useStringGetter();

  const { tickersFromProposals } = useNextClobPairId();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  const tickSizeDecimals = useMemo(() => {
    if (!assetToAdd) return TOKEN_DECIMALS;
    const p = Math.floor(Math.log(Number(assetToAdd.meta.referencePrice)));
    return Math.abs(p - 3);
  }, [assetToAdd]);

  const receiptItems = useMemo(() => {
    return [
      {
        key: 'deposit-apr',
        label: 'Deposit APR (30d)',
        value: (
          <Output type={OutputType.Percent} value={0.3256} fractionDigits={PERCENT_DECIMALS} />
        ),
      },
      {
        key: 'deposit-lockup',
        label: 'Deposit Lockup',
        value: (
          <Output type={OutputType.Percent} value={0.3256} fractionDigits={PERCENT_DECIMALS} />
        ),
      },
      {
        key: 'cross-margin-usage',
        label: stringGetter({ key: STRING_KEYS.CROSS_MARGIN_USAGE }),
        value: (
          <Output type={OutputType.Percent} value={0.3256} fractionDigits={PERCENT_DECIMALS} />
        ),
      },
      step === NewMarketFormStep.PREVIEW && {
        key: 'cross-free-collateral',
        label: stringGetter({ key: STRING_KEYS.CROSS_FREE_COLLATERAL }),
        value: (
          <DiffOutput
            withDiff
            type={OutputType.Fiat}
            value={100000}
            newValue={88000}
            fractionDigits={USD_DECIMALS}
          />
        ),
      },
      {
        key: 'megavault-balance',
        label: stringGetter({ key: STRING_KEYS.YOUR_VAULT_BALANCE }),
        value: <Output type={OutputType.Fiat} value={10000} fractionDigits={USD_DECIMALS} />,
      },
    ].filter(isTruthy);
  }, [step, stringGetter]);

  /**
   * Permissionless Markets Flow
   */
  if (testFlags.pml) {
    if (NewMarketFormStep.SUCCESS === step) {
      return <NewMarketSuccessStep href="" />;
    }

    if (NewMarketFormStep.PREVIEW === step && tickerToAdd) {
      return (
        <NewMarketPreviewStep2
          onSuccess={() => {
            setStep(NewMarketFormStep.SUCCESS);
          }}
          onBack={() => setStep(NewMarketFormStep.SELECTION)}
          ticker={tickerToAdd}
          receiptItems={receiptItems}
        />
      );
    }

    return (
      <NewMarketSelectionStep2
        onConfirmMarket={() => {
          setStep(NewMarketFormStep.PREVIEW);
        }}
        setTickerToAdd={setTickerToAdd}
        tickerToAdd={tickerToAdd}
        receiptItems={receiptItems}
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
