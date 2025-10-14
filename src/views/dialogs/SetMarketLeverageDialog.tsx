import { useMemo, useState } from 'react';

import { BonsaiCore, BonsaiHelpers } from '@/bonsai/ontology';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonState, ButtonType } from '@/constants/buttons';
import { DialogProps, SetMarketLeverageDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
import { useStringGetter } from '@/hooks/useStringGetter';

import { formMixins } from '@/styles/formMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Input, InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { Slider } from '@/components/Slider';
import { AccentTag } from '@/components/Tag';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSelectedMarketLeverage } from '@/state/raw';

import { useDisappearingValue } from '@/lib/disappearingValue';
import { mapIfPresent } from '@/lib/do';
import { calculateMarketMaxLeverage } from '@/lib/marketsHelpers';
import { MaybeBigNumber, MustBigNumber } from '@/lib/numbers';
import { sleep } from '@/lib/timeUtils';
import { orEmptyObj } from '@/lib/typeUtils';

export const SetMarketLeverageDialog = ({
  marketId,
  setIsOpen,
}: DialogProps<SetMarketLeverageDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const marketData = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectMarketSummaryById,
    marketId
  );
  const { assetId, initialMarginFraction, effectiveInitialMarginFraction, displayableTicker } =
    orEmptyObj(marketData);

  const logoUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);

  const effectiveSelectedLeverage = useAppSelectorWithArgs(
    BonsaiHelpers.markets.selectEffectiveSelectedMarketLeverage,
    marketId
  );

  const positions = useAppSelector(BonsaiCore.account.parentSubaccountPositions.data);
  const parentSubaccountSummary = useAppSelector(BonsaiCore.account.parentSubaccountSummary.data);

  const currentPosition = useMemo(() => {
    return positions?.find((p) => p.market === marketId);
  }, [positions, marketId]);

  const maxLeverage = useMemo(() => {
    return calculateMarketMaxLeverage({
      initialMarginFraction: MaybeBigNumber(initialMarginFraction)?.toNumber(),
      effectiveInitialMarginFraction,
    });
  }, [initialMarginFraction, effectiveInitialMarginFraction]);

  const minLeverage = useMemo(() => {
    if (!currentPosition) {
      return 1;
    }

    const positionValue = currentPosition.value.abs();

    if (currentPosition.marginMode === 'ISOLATED') {
      // For isolated: min leverage = ceil(position value / margin)
      const margin = currentPosition.marginValueInitial;
      if (margin.lte(0)) {
        return maxLeverage;
      }
      return Math.ceil(positionValue.div(margin).toNumber());
    }
    // For cross: calculate free collateral without this position's contribution
    if (!parentSubaccountSummary) {
      return 1;
    }

    const crossFreeCollateralRaw = parentSubaccountSummary.rawFreeCollateral;
    const initialRiskFromSelectedLeverage = currentPosition.initialRiskFromSelectedLeverage;

    // Add back the initial risk from this position to get leftover margin
    const leftoverMargin = crossFreeCollateralRaw.plus(initialRiskFromSelectedLeverage);

    if (leftoverMargin.lte(0)) {
      // Account is underwater, lock leverage at max
      return maxLeverage;
    }

    return Math.ceil(positionValue.div(leftoverMargin).toNumber());
  }, [currentPosition, parentSubaccountSummary, maxLeverage]);

  const [leverageInputValue, setLeverageInputValue] = useState(
    MustBigNumber(effectiveSelectedLeverage).toFixed(0)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useDisappearingValue<string>(undefined);

  const onSliderDrag = ([newLeverage]: number[]) => {
    const newLeverageString = mapIfPresent(newLeverage, (lev) => MustBigNumber(lev).toFixed(0));
    if (newLeverageString) {
      setLeverageInputValue(newLeverageString);
    }
  };

  const onValueCommit = ([newLeverage]: number[]) => {
    const newLeverageString = mapIfPresent(newLeverage, (lev) => MustBigNumber(lev).toFixed(0));
    if (newLeverageString) {
      setLeverageInputValue(newLeverageString);
    }
  };

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMessage(undefined);
    setIsLoading(true);

    try {
      const leverageBN = MaybeBigNumber(leverageInputValue);

      if (leverageBN == null || leverageBN.lt(minLeverage) || leverageBN.gt(maxLeverage)) {
        throw new Error('Invalid leverage value');
      }

      // Simulate network delay
      await sleep(1000);

      dispatch(setSelectedMarketLeverage({ marketId, leverage: leverageBN.toNumber() }));
      setIsOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save leverage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({
        fallback: 'Set Market Leverage',
      })}
      tw="[--dialog-width:25rem]"
    >
      <form onSubmit={onSave} tw="flexColumn gap-1">
        <div>
          <div tw="flex items-center gap-0.5">
            <AssetIcon logoUrl={logoUrl} symbol={assetId} tw="[--asset-icon-size:1.5rem]" />
            <span tw="text-color-text-2 font-base-medium">{displayableTicker}</span>
            <AccentTag tw="font-small-medium">
              MAX
              <Output
                tw="ml-0.25"
                type={OutputType.Multiple}
                fractionDigits={0}
                value={maxLeverage}
              />
            </AccentTag>
          </div>

          <$LeverageInputContainer>
            <div tw="w-full">
              <$LeverageSlider
                label="MarketLeverage"
                min={minLeverage}
                max={maxLeverage}
                step={1}
                value={MustBigNumber(leverageInputValue).abs().toNumber()}
                onSliderDrag={onSliderDrag}
                onValueCommit={onValueCommit}
              />
            </div>
            <$InnerInputContainer>
              <Input
                type={InputType.Leverage}
                value={leverageInputValue}
                max={maxLeverage}
                onInput={({ formattedValue }: { formattedValue: string }) => {
                  setLeverageInputValue(formattedValue);
                }}
                placeholder={`${MustBigNumber(leverageInputValue).toFixed(2)}×`}
              />
            </$InnerInputContainer>
          </$LeverageInputContainer>
        </div>

        {errorMessage && <AlertMessage type={AlertType.Error}>{errorMessage}</AlertMessage>}

        <Button
          type={ButtonType.Submit}
          tw="w-full"
          action={ButtonAction.Primary}
          state={isLoading ? ButtonState.Loading : ButtonState.Default}
        >
          {stringGetter({ key: STRING_KEYS.SAVE, fallback: 'Save' })}
        </Button>
      </form>
    </Dialog>
  );
};

const $LeverageInputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-height: 3.5rem;
  --input-backgroundColor: none;
`;

const $InnerInputContainer = styled.div`
  ${formMixins.inputContainer}
  --input-backgroundColor: var(--color-layer-4);
  --input-borderColor: none;
  --input-height: 2.25rem;
  --input-width: 5rem;

  margin-left: 0.25rem;

  input {
    text-align: end;
    padding: 0 var(--form-input-paddingX);
  }
`;

const $LeverageSlider = styled(Slider)`
  height: 1.375rem;
  --slider-track-background: linear-gradient(
    90deg,
    var(--color-layer-7) 0%,
    var(--color-text-2) 100%
  );
`;
