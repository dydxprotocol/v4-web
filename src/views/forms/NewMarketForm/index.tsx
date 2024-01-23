import { useState } from 'react';

import { POTENTIAL_MARKETS } from '@/constants/potentialMarkets';
import { useNextClobPairId } from '@/hooks';

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
  const [assetToAdd, setAssetToAdd] = useState<(typeof POTENTIAL_MARKETS)[number]>();
  const [liquidityTier, setLiquidityTier] = useState<string>();

  const clobPairId = useNextClobPairId();

  if (NewMarketFormStep.SUCCESS === step) {
    return <NewMarketSuccessStep href="google.com" />;
  }

  if (NewMarketFormStep.PREVIEW === step) {
    if (assetToAdd && liquidityTier && clobPairId) {
      return (
        <NewMarketPreviewStep
          assetData={assetToAdd}
          clobPairId={clobPairId}
          liquidityTier={liquidityTier}
          onBack={() => setStep(NewMarketFormStep.SELECTION)}
          onSuccess={() => setStep(NewMarketFormStep.SUCCESS)}
        />
      );
    }
  }

  return (
    <NewMarketSelectionStep
      onConfirmMarket={() => setStep(NewMarketFormStep.PREVIEW)}
      shouldDisableConfirmButton={!assetToAdd || !liquidityTier || !clobPairId}
      assetToAdd={assetToAdd}
      setAssetToAdd={setAssetToAdd}
      liquidityTier={liquidityTier}
      setLiquidityTier={setLiquidityTier}
    />
  );
};
