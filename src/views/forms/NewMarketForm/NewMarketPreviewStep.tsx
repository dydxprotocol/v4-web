import { FormEvent, useCallback, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';
import Long from 'long';
import { encodeJson } from '@dydxprotocol/v4-client-js';
import type { IndexedTx } from '@cosmjs/stargate';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';
import { LIQUIDITY_TIERS, type PotentialMarketItem } from '@/constants/potentialMarkets';

import {
  useAccountBalance,
  useGovernanceVariables,
  useStringGetter,
  useSubaccount,
  useTokenConfigs,
} from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

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

import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type NewMarketPreviewStepProps = {
  assetData: PotentialMarketItem;
  clobPairId: number;
  liquidityTier: number;
  onBack: () => void;
  onSuccess: (hash: string) => void;
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
  const { chainTokenLabel } = useTokenConfigs();
  const [errorMessage, setErrorMessage] = useState();
  const { exchangeConfigs } = usePotentialMarkets();
  const { submitNewMarketProposal } = useSubaccount();
  const { newMarketProposal } = useGovernanceVariables();
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(1e18);
  const initialDepositAmountDecimals = isMainnet ? 0 : 18;
  const initialDepositAmount = initialDepositAmountBN.toFixed(initialDepositAmountDecimals);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const { label, initialMarginFraction, maintenanceMarginFraction, impactNotional } =
    LIQUIDITY_TIERS[liquidityTier as unknown as keyof typeof LIQUIDITY_TIERS];

  const ticker = `${assetData.baseAsset}-USD`;

  const alertMessage = useMemo(() => {
    if (errorMessage) {
      return {
        type: AlertType.Error,
        message: errorMessage,
      };
    }
    if (nativeTokenBalance.lt(initialDepositAmountBN)) {
      return {
        type: AlertType.Error,
        message: stringGetter({
          key: STRING_KEYS.NOT_ENOUGH_BALANCE,
          params: {
            NUM_TOKENS_REQUIRED: initialDepositAmount,
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

        if (!hasAcceptedTerms) {
          dispatch(
            openDialog({
              type: DialogTypes.NewMarketAgreement,
              dialogProps: {
                acceptTerms: () => setHasAcceptedTerms(true),
              },
            })
          );
        } else {
          setErrorMessage(undefined);

          try {
            const tx = await submitNewMarketProposal({
              id: clobPairId,
              ticker,
              priceExponent: assetData.priceExponent,
              minPriceChange: assetData.minPriceChangePpm,
              minExchanges: assetData.minExchanges,
              exchangeConfigJson: JSON.stringify({
                exchanges: exchangeConfigs?.[assetData.baseAsset],
              }),
              atomicResolution: assetData.atomicResolution,
              liquidityTier: liquidityTier,
              quantumConversionExponent: assetData.quantumConversionExponent,
              stepBaseQuantums: Long.fromNumber(assetData.stepBaseQuantum),
              subticksPerTick: assetData.subticksPerTick,
              delayBlocks: newMarketProposal.delayBlocks,
            });

            if ((tx as IndexedTx)?.code === 0) {
              const encodedTx = encodeJson(tx);
              const parsedTx = JSON.parse(encodedTx);
              const hash = parsedTx.hash.toUpperCase();

              if (!hash) {
                throw new Error('Invalid transaction hash');
              }

              onSuccess(hash);
            } else {
              throw new Error('Transaction failed to commit.');
            }
          } catch (error) {
            log('NewMarketPreviewForm/submitNewMarketProposal', error);
            setErrorMessage(error.message);
          }
        }
      }}
    >
      <h2>
        {stringGetter({ key: STRING_KEYS.CONFIRM_NEW_MARKET_PROPOSAL })}
        <span>
          {stringGetter({ key: STRING_KEYS.BALANCE })}:{' '}
          <Output
            type={OutputType.Number}
            value={nativeTokenBalance}
            fractionDigits={2}
            slotRight={
              <Tag style={{ marginTop: '0.25rem', marginLeft: '0.5ch' }}>{chainTokenLabel}</Tag>
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
                type={OutputType.Number}
                value={initialDepositAmount}
                fractionDigits={initialDepositAmountDecimals}
                slotRight={
                  <>
                    {'+ '}
                    <Styled.Icon
                      $hasError={nativeTokenBalance?.lt(initialDepositAmountBN)}
                      iconName={
                        nativeTokenBalance?.gt(initialDepositAmountBN)
                          ? IconName.CheckCircle
                          : IconName.CautionCircle
                      }
                    />
                  </>
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
                value={nativeTokenBalance.isZero() ? undefined : nativeTokenBalance}
                newValue={nativeTokenBalance.minus(initialDepositAmountBN)}
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
          {hasAcceptedTerms
            ? stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })
            : stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS })}
        </Button>
      </Styled.ButtonRow>
      <Styled.Disclaimer>
        {stringGetter({
          key: STRING_KEYS.PROPOSAL_DISCLAIMER,
          params: {
            NUM_TOKENS_REQUIRED: initialDepositAmount,
            NATIVE_TOKEN_DENOM: chainTokenLabel,
          },
        })}
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

Styled.CheckboxContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 1rem;
  align-items: center;
`;

Styled.Disclaimer = styled.div<{ textAlign?: string }>`
  font: var(--font-small);
  color: var(--color-text-0);
  text-align: center;
  margin-left: 0.5ch;

  ${({ textAlign }) => textAlign && `text-align: ${textAlign};`}
`;

Styled.ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  width: 100%;
`;
