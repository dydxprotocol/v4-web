import { FormEvent, useMemo, useState } from 'react';
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
import type { NewMarketProposal } from '@/constants/potentialMarkets';

import {
  useAccountBalance,
  useGovernanceVariables,
  useStringGetter,
  useSubaccount,
  useTokenConfigs,
  useURLConfigs,
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
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { openDialog } from '@/state/dialogs';

import { MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type NewMarketPreviewStepProps = {
  assetData: NewMarketProposal;
  clobPairId: number;
  liquidityTier: number;
  onBack: () => void;
  onSuccess: (hash: string) => void;
  tickSizeDecimals: number;
};

export const NewMarketPreviewStep = ({
  assetData,
  clobPairId,
  liquidityTier,
  onBack,
  onSuccess,
  tickSizeDecimals,
}: NewMarketPreviewStepProps) => {
  const { nativeTokenBalance } = useAccountBalance();
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const [errorMessage, setErrorMessage] = useState();
  const { liquidityTiers } = usePotentialMarkets();
  const { submitNewMarketProposal } = useSubaccount();
  const { newMarketProposal } = useGovernanceVariables();
  const { newMarketProposalLearnMore } = useURLConfigs();
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(
    Number(`1e${chainTokenDecimals}`)
  );
  const initialDepositAmountDecimals = isMainnet ? 0 : chainTokenDecimals;
  const initialDepositAmount = initialDepositAmountBN.toFixed(initialDepositAmountDecimals);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { label, initialMarginFraction, maintenanceMarginFraction, impactNotional } =
    liquidityTiers[liquidityTier as unknown as keyof typeof liquidityTiers];

  const { params, meta } = assetData ?? {};
  const {
    ticker,
    priceExponent,
    minExchanges,
    minPriceChange,
    exchangeConfigJson,
    atomicResolution,
    quantumConversionExponent,
    stepBaseQuantums,
    subticksPerTick,
  } = params ?? {};

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
          setIsLoading(true);
          setErrorMessage(undefined);

          try {
            const tx = await submitNewMarketProposal({
              id: clobPairId,
              ticker,
              priceExponent,
              minPriceChange,
              minExchanges,
              exchangeConfigJson: JSON.stringify({
                exchanges: exchangeConfigJson,
              }),
              atomicResolution,
              liquidityTier,
              quantumConversionExponent,
              stepBaseQuantums: Long.fromNumber(stepBaseQuantums),
              subticksPerTick,
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
          } finally {
            setIsLoading(false);
          }
        }
      }}
    >
      <h2>
        {stringGetter({ key: STRING_KEYS.CONFIRM_NEW_MARKET_PROPOSAL })}
        <Styled.Balance>
          {stringGetter({ key: STRING_KEYS.BALANCE })}:{' '}
          <Output
            type={OutputType.Number}
            value={nativeTokenBalance}
            fractionDigits={TOKEN_DECIMALS}
            slotRight={<Styled.Tag>{chainTokenLabel}</Styled.Tag>}
          />
        </Styled.Balance>
      </h2>
      <Styled.FormInput
        disabled
        label={stringGetter({ key: STRING_KEYS.MARKET })}
        type={InputType.Text}
        value={ticker}
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
                value={meta.referencePrice}
                fractionDigits={tickSizeDecimals}
              />
            ),
          },
          {
            key: 'message-details',
            label: stringGetter({ key: STRING_KEYS.MESSAGE_DETAILS }),
            value: (
              <Styled.Button
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
              </Styled.Button>
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
            label: (
              <span>
                {stringGetter({ key: STRING_KEYS.WALLET_BALANCE })} <Tag>{chainTokenLabel}</Tag>
              </span>
            ),
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
        <Button
          type={ButtonType.Submit}
          action={ButtonAction.Primary}
          state={{ isDisabled, isLoading }}
        >
          {hasAcceptedTerms
            ? stringGetter({ key: STRING_KEYS.PROPOSE_NEW_MARKET })
            : stringGetter({ key: STRING_KEYS.ACKNOWLEDGE_TERMS })}
        </Button>
      </Styled.ButtonRow>
      <Styled.DisclaimerContainer>
        <Styled.Disclaimer>
          {stringGetter({
            key: STRING_KEYS.PROPOSAL_DISCLAIMER_1,
            params: {
              NUM_TOKENS_REQUIRED: initialDepositAmount,
              NATIVE_TOKEN_DENOM: chainTokenLabel,
              HERE: (
                <Styled.Link href={newMarketProposalLearnMore}>
                  {stringGetter({ key: STRING_KEYS.HERE })}
                </Styled.Link>
              ),
            },
          })}
        </Styled.Disclaimer>
      </Styled.DisclaimerContainer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;

  h2 {
    ${layoutMixins.row}
    justify-content: space-between;
    margin: 0;
    font: var(--font-large-medium);
    color: var(--color-text-2);
  }
`;

Styled.Balance = styled.span`
  ${layoutMixins.inlineRow}
  font: var(--font-small-book);
  margin-top: 0.125rem;

  output {
    margin-left: 0.5ch;
  }
`;

Styled.Tag = styled(Tag)`
  margin-left: 0.5ch;
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

Styled.DisclaimerContainer = styled.div`
  min-width: 100%;
  width: min-content;
`;

Styled.Disclaimer = styled.div<{ textAlign?: string }>`
  font: var(--font-small-book);
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

Styled.Button = styled(Button)`
  --button-padding: 0;
`;

Styled.Link = styled(Link)`
  --link-color: var(--color-accent);
  display: inline;
`;
