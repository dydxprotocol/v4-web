import { useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { type PotentialMarketItem } from '@/constants/potentialMarkets';
import { useNextClobPairId, useURLConfigs } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { NewMarketSelectionStep } from './NewMarketSelectionStep';
import { NewMarketPreviewStep } from './NewMarketPreviewStep';
import { NewMarketSuccessStep } from './NewMarketSuccessStep';

enum NewMarketFormStep {
  SELECTION,
  PREVIEW,
  SUCCESS,
}

export const NewMarketForm = () => {
  const [step, setStep] = useState(NewMarketFormStep.SELECTION);
  const [assetToAdd, setAssetToAdd] = useState<PotentialMarketItem>();
  const [liquidityTier, setLiquidityTier] = useState<number>();
  const [proposalTxHash, setProposalTxHash] = useState<string>();
  const { mintscan: mintscanTxUrl } = useURLConfigs();

  const { nextAvailableClobPairId } = useNextClobPairId();
  const { hasPotentialMarketsData } = usePotentialMarkets();

  if (!hasPotentialMarketsData || !nextAvailableClobPairId) {
    return <Styled.LoadingSpace id="new-market-form" />;
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
        />
      );
    }
  }

  return (
    <NewMarketSelectionStep
      onConfirmMarket={() => setStep(NewMarketFormStep.PREVIEW)}
      shouldDisableConfirmButton={
        !assetToAdd || liquidityTier === undefined || !nextAvailableClobPairId
      }
      assetToAdd={assetToAdd}
      clobPairId={nextAvailableClobPairId}
      setAssetToAdd={setAssetToAdd}
      liquidityTier={liquidityTier}
      setLiquidityTier={setLiquidityTier}
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.LoadingSpace = styled(LoadingSpace)`
  min-height: 18.75rem;
`;
