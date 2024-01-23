import { useMemo, useState } from 'react';

import { POTENTIAL_MARKETS } from '@/constants/potentialMarkets';

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

  // Given a ticker, return a unique clob pair id with basic hashing
  const getNewClobPairId = (ticker: string): number => {
    let hash = 2166136261n;
    for (let i = 0; i < ticker.length; i++) {
      hash ^= BigInt(ticker.charCodeAt(i));
      hash *= 16777619n;
    }
    return Number(hash & 2147483647n);
  };

  const clobPairId = useMemo(() => {
    if (!assetToAdd) return undefined;
    return getNewClobPairId(assetToAdd.symbol);
  }, [assetToAdd]);

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
