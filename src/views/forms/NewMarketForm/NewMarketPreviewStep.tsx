import { FormEvent, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';
import { LIQUIDITY_TIERS, type PotentialMarketItem } from '@/constants/potentialMarkets';
import { useAccountBalance, useStringGetter, useTokenConfigs } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { Icon, IconName } from '@/components/Icon';
import { InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { openDialog } from '@/state/dialogs';

import { log } from '@/lib/telemetry';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

type NewMarketPreviewStepProps = {
  assetData: PotentialMarketItem;
  clobPairId: number;
  liquidityTier: number;
  onBack: () => void;
  onSuccess: () => void;
};

export const NewMarketPreviewStep = ({
  assetData,
  clobPairId,
  liquidityTier,
  onBack,
  onSuccess,
}: NewMarketPreviewStepProps) => {
  const { nativeTokenBalance } = useAccountBalance();
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { chainTokenDenom, chainTokenLabel } = useTokenConfigs();
  const [errorMessage, setErrorMessage] = useState();
  const { exchangeConfigs } = usePotentialMarkets();

  const { label, initialMarginFraction, maintenanceMarginFraction, impactNotional } =
    LIQUIDITY_TIERS[liquidityTier as unknown as keyof typeof LIQUIDITY_TIERS];

  const alertMessage = useMemo(() => {
    if (errorMessage) {
      return {
        type: AlertType.Error,
        message: errorMessage,
      };
    }
    if (nativeTokenBalance.lt(10_000)) {
      return {
        type: AlertType.Error,
        message: stringGetter({
          key: STRING_KEYS.NOT_ENOUGH_BALANCE,
          params: {
            NUM_TOKENS_REQUIRED: 10_000,
            NATIVE_TOKEN_DENOM: chainTokenLabel,
          },
        }),
      };
    }

    return null;
  }, [nativeTokenBalance, errorMessage]);

  const tickSizeDecimal = useMemo(() => {
    if (!assetData) return TOKEN_DECIMALS;
    const p = Math.floor(Math.log(Number(assetData.referencePrice)));
    return Math.abs(p - 3);
  }, [assetData]);

  const isDisabled = alertMessage !== null;

  return (
    <Styled.Form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(undefined);
        try {
          // const response = await submitNewMarketProposal({
          //   id: clobPairId,
          //   symbol: assetData.baseAsset,
          //   exponent: Number(assetData.priceExponent),
          //   minExchanges: Number(assetData.minExchanges),
          //   minPriceChangePpm: Number(assetData.minPriceChangePpm),
          //   exchangeConfigJson: JSON.stringify({
          //     exchanges: exchangeConfigs?.[assetData.baseAsset],
          //   }),
          //   atomicResolution: Number(assetData.atomicResolution),
          //   liquidityTier: Number(liquidityTier),
          //   quantumConversionExponent: Number(assetData.quantumConversionExponent),
          //   stepBaseQuantums: Long.fromString(assetData.stepBaseQuantum),
          //   subticksPerTick: Number(assetData.subticksPerTick),
          // });
          onSuccess();
        } catch (error) {
          log('NewMarketPreviewForm/submitNewMarketProposal', error);
          setErrorMessage(error.message);
        }
      }}
    >
      <h2>
        Confirm new market proposal
        <span>
          {stringGetter({ key: STRING_KEYS.BALANCE })}:{' '}
          <Output
            type={OutputType.Number}
            value={nativeTokenBalance}
            fractionDigits={2}
            slotRight={
              <Tag style={{ marginTop: '0.25rem', marginLeft: '0.5ch' }}>{chainTokenDenom}</Tag>
            }
          />
        </span>
      </h2>
      <Styled.FormInput
        disabled
        label={stringGetter({ key: STRING_KEYS.MARKET })}
        type={InputType.Text}
        value={`${assetData.baseAsset}-USD`}
      />
      <Styled.WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'imf',
            label: 'IMF',
            tooltip: 'initial-margin-fraction',
            value: (
              <Output fractionDigits={2} type={OutputType.Number} value={initialMarginFraction} />
            ),
          },
          {
            key: 'mmf',
            label: 'MMF',
            tooltip: 'maintenance-margin-fraction',
            value: (
              <Output
                fractionDigits={2}
                type={OutputType.Number}
                value={maintenanceMarginFraction}
              />
            ),
          },
          {
            key: 'impact-notional',
            label: stringGetter({ key: STRING_KEYS.IMPACT_NOTIONAL }),
            value: <Output type={OutputType.Fiat} value={impactNotional} />,
          },
        ]}
      >
        <Styled.FormInput
          disabled
          label={stringGetter({ key: STRING_KEYS.LIQUIDITY_TIER })}
          type={InputType.Text}
          value={label}
        />
      </Styled.WithDetailsReceipt>

      <Styled.WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'reference-price',
            label: stringGetter({ key: STRING_KEYS.REFERENCE_PRICE }),
            tooltip: 'reference-price',
            value: (
              <Output
                type={OutputType.Fiat}
                value={assetData.referencePrice}
                fractionDigits={tickSizeDecimal}
              />
            ),
          },
          {
            key: 'message-details',
            label: stringGetter({ key: STRING_KEYS.MESSAGE_DETAILS }),
            value: (
              <Button
                action={ButtonAction.Navigation}
                size={ButtonSize.Small}
                onClick={() =>
                  dispatch(
                    openDialog({
                      type: DialogTypes.NewMarketMessageDetails,
                      dialogProps: { assetData, clobPairId, liquidityTier },
                    })
                  )
                }
              >
                {stringGetter({ key: STRING_KEYS.VIEW_DETAILS })} →
              </Button>
            ),
          },
          {
            key: 'required-balance',
            label: (
              <span>
                {stringGetter({ key: STRING_KEYS.REQUIRED_BALANCE })} <Tag>{chainTokenLabel}</Tag>
              </span>
            ),
            value: (
              <Output
                type={OutputType.Text}
                value="10,000+"
                slotRight={
                  <Styled.Icon
                    $hasError={nativeTokenBalance?.lt(10_000)}
                    iconName={
                      nativeTokenBalance?.gt(10_000) ? IconName.CheckCircle : IconName.CautionCircle
                    }
                  />
                }
              />
            ),
          },
          {
            key: 'wallet-balance',
            label: stringGetter({ key: STRING_KEYS.WALLET_BALANCE }),
            value: (
              <DiffOutput
                withDiff
                hasInvalidNewValue={isDisabled}
                sign={NumberSign.Negative}
                fractionDigits={TOKEN_DECIMALS}
                type={OutputType.Number}
                value={nativeTokenBalance}
                newValue={nativeTokenBalance.minus(10_000)}
              />
            ),
          },
        ]}
      >
        <div />
      </Styled.WithDetailsReceipt>
      {alertMessage && (
        <AlertMessage type={alertMessage.type}>{alertMessage.message} </AlertMessage>
      )}
      <Styled.ButtonRow>
        <Button onClick={onBack}>{stringGetter({ key: STRING_KEYS.BACK })}</Button>
        <Button type={ButtonType.Submit} action={ButtonAction.Primary} state={{ isDisabled }}>
          {stringGetter({ key: STRING_KEYS.ADD_MARKET_STEP_3_TITLE })}
        </Button>
      </Styled.ButtonRow>
      <Styled.Disclaimer>
        {stringGetter({ key: STRING_KEYS.PROPOSAL_DISCLAIMER })}
      </Styled.Disclaimer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;

  h2 {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    span {
      display: flex;
      align-items: center;
    }

    output {
      margin-left: 0.5ch;
    }
  }
`;

Styled.FormInput = styled(FormInput)`
  input {
    font-size: 1rem;
  }
`;

Styled.Icon = styled(Icon)<{ $hasError?: boolean }>`
  margin-left: 0.5ch;

  ${({ $hasError }) => ($hasError ? 'color: var(--color-error);' : 'color: var(--color-success);')}
`;

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  --details-item-fontSize: 1rem;
`;

Styled.Disclaimer = styled.div`
  font: var(--font-small);
  color: var(--color-text-0);
  text-align: center;
  margin-left: 0.5ch;
`;

Styled.ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  width: 100%;
`;
