import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { TOKEN_DECIMALS } from '@/constants/numbers';
import { type NewMarketProposal } from '@/constants/potentialMarkets';

import { useNextClobPairId, useURLConfigs } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

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

  const { nextAvailableClobPairId, tickersFromProposals } = useNextClobPairId();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  const tickSizeDecimals = useMemo(() => {
    if (!assetToAdd) return TOKEN_DECIMALS;
    const p = Math.floor(Math.log(Number(assetToAdd.meta.referencePrice)));
    return Math.abs(p - 3);
  }, [assetToAdd]);

  if (!hasPotentialMarketsData || !nextAvailableClobPairId) {
    return <$LoadingSpace id="new-market-form" />;
  }

  if (NewMarketFormStep.SUCCESS === step && proposalTxHash) {
    return <NewMarketSuccessStep href={mintscanTxUrl.replace('{tx_hash}', proposalTxHash)} />;
  }

  if (NewMarketFormStep.PREVIEW === step) {
    if (assetToAdd && liquidityTier && nextAvailableClobPairId) {
      return (
        <NewMarketPreviewStep
          assetData={assetToAdd}
          clobPairId={nextAvailableClobPairId}
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
      onConfirmMarket={() => setStep(NewMarketFormStep.PREVIEW)}
      assetToAdd={assetToAdd}
      clobPairId={nextAvailableClobPairId}
      setAssetToAdd={setAssetToAdd}
      liquidityTier={liquidityTier}
      setLiquidityTier={setLiquidityTier}
      tickSizeDecimals={tickSizeDecimals}
      tickersFromProposals={tickersFromProposals}
    />
  );
};
const $LoadingSpace = styled(LoadingSpace)`
  min-height: 18.75rem;
`;
