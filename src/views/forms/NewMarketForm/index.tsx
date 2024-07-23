import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { TOKEN_DECIMALS } from '@/constants/numbers';
import { type NewMarketProposal } from '@/constants/potentialMarkets';

import { useNextClobPairId } from '@/hooks/useNextClobPairId';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { NewMarketPreviewStep } from './NewMarketPreviewStep';
import { NewMarketSelectionStep } from './NewMarketSelectionStep';
import { NewMarketSuccessStep } from './NewMarketSuccessStep';

enum NewMarketFormStep {
  SELECTION,
  PREVIEW,
  SUCCESS,
}

export const NewMarketForm = () => {
  const [step, setStep] = useState(NewMarketFormStep.SELECTION);
  const [assetToAdd, setAssetToAdd] = useState<NewMarketProposal>();
  const [liquidityTier, setLiquidityTier] = useState<number>();
  const [proposalTxHash, setProposalTxHash] = useState<string>();
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const { tickersFromProposals } = useNextClobPairId();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  const tickSizeDecimals = useMemo(() => {
    if (!assetToAdd) return TOKEN_DECIMALS;
    const p = Math.floor(Math.log(Number(assetToAdd.meta.referencePrice)));
    return Math.abs(p - 3);
  }, [assetToAdd]);

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
