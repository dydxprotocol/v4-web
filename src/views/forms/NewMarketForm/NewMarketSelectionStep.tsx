import { FormEvent, useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-radio-group';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import {
  NUM_ORACLES_TO_QUALIFY_AS_SAFE,
  type NewMarketProposal,
} from '@/constants/potentialMarkets';

import {
  useAccountBalance,
  useBreakpoints,
  useGovernanceVariables,
  useStringGetter,
  useTokenConfigs,
} from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';

import { breakpoints } from '@/styles';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { WithReceipt } from '@/components/WithReceipt';

import { OnboardingTriggerButton } from '@/views/dialogs/OnboardingTriggerButton';

import { getOnboardingState } from '@/state/accountSelectors';
import { openDialog } from '@/state/dialogs';
import { getMarketIds } from '@/state/perpetualsSelectors';

import { isTruthy } from '@/lib/isTruthy';
import { MustBigNumber } from '@/lib/numbers';

type NewMarketSelectionStepProps = {
  assetToAdd?: NewMarketProposal;
  clobPairId?: number;
  setAssetToAdd: (assetToAdd?: NewMarketProposal) => void;
  onConfirmMarket: () => void;
  liquidityTier?: number;
  setLiquidityTier: (liquidityTier?: number) => void;
  tickSizeDecimals: number;
  tickersFromProposals: Set<string>;
};

export const NewMarketSelectionStep = ({
  assetToAdd,
  clobPairId,
  setAssetToAdd,
  onConfirmMarket,
  liquidityTier,
  setLiquidityTier,
  tickSizeDecimals,
  tickersFromProposals,
}: NewMarketSelectionStepProps) => {
  const dispatch = useDispatch();
  const { nativeTokenBalance } = useAccountBalance();
  const onboardingState = useSelector(getOnboardingState);
  const isDisconnected = onboardingState === OnboardingState.Disconnected;
  const { isMobile } = useBreakpoints();
  const marketIds = useSelector(getMarketIds, shallowEqual);
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const { potentialMarkets, liquidityTiers } = usePotentialMarkets();
  const stringGetter = useStringGetter();
  const { newMarketProposal } = useGovernanceVariables();
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(
    Number(`1e${chainTokenDecimals}`)
  );
  const initialDepositAmountDecimals = isMainnet ? 0 : chainTokenDecimals;
  const initialDepositAmount = initialDepositAmountBN.toFixed(initialDepositAmountDecimals);

  const [tempLiquidityTier, setTempLiquidityTier] = useState<number>();

  const alertMessage = useMemo(() => {
    if (nativeTokenBalance.lt(initialDepositAmountBN)) {
      return {
        type: AlertType.Warning,
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
  }, [nativeTokenBalance, stringGetter]);

  useEffect(() => {
    if (assetToAdd) {
      setTempLiquidityTier(assetToAdd.params.liquidityTier);
      setLiquidityTier(assetToAdd.params.liquidityTier);
    }
  }, [assetToAdd]);

  const filteredPotentialMarkets = useMemo(() => {
    return potentialMarkets?.filter(
      ({ params: { ticker, exchangeConfigJson } }) =>
        exchangeConfigJson.length >= NUM_ORACLES_TO_QUALIFY_AS_SAFE && !marketIds.includes(ticker)
    );
  }, [potentialMarkets, marketIds]);

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onConfirmMarket();
      }}
    >
      <h2>
        {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
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
      <SearchSelectMenu
        items={[
          {
            group: 'markets',
            groupLabel: stringGetter({ key: STRING_KEYS.MARKETS }),
            items:
              filteredPotentialMarkets?.map((potentialMarket: NewMarketProposal) => ({
                value: potentialMarket.baseAsset,
                label: potentialMarket.meta.assetName,
                tag: potentialMarket.params.ticker,
                slotAfter: tickersFromProposals.has(potentialMarket.params.ticker) && (
                  <Tag isHighlighted>{stringGetter({ key: STRING_KEYS.VOTING_LIVE })}</Tag>
                ),
                onSelect: () => {
                  setAssetToAdd(potentialMarket);
                },
              })) ?? [],
          },
        ]}
        label={stringGetter({ key: STRING_KEYS.MARKETS })}
      >
        {assetToAdd ? (
          <Styled.SelectedAsset>
            {assetToAdd.meta.assetName} <Tag>{assetToAdd.params.ticker}</Tag>
          </Styled.SelectedAsset>
        ) : (
          `${stringGetter({ key: STRING_KEYS.EG })} "BTC-USD"`
        )}
      </SearchSelectMenu>
      {assetToAdd && (
        <>
          <div>{stringGetter({ key: STRING_KEYS.POPULATED_DETAILS })}</div>
          <div>
            <Styled.Root value={tempLiquidityTier} onValueChange={setTempLiquidityTier}>
              <Styled.Header>{stringGetter({ key: STRING_KEYS.LIQUIDITY_TIER })}</Styled.Header>

              {Object.keys(liquidityTiers).map((tier) => {
                const { maintenanceMarginFraction, impactNotional, label, initialMarginFraction } =
                  liquidityTiers[tier as unknown as keyof typeof liquidityTiers];
                return (
                  <Styled.LiquidityTierRadioButton
                    disabled
                    key={tier}
                    value={Number(tier)}
                    selected={Number(tier) === tempLiquidityTier}
                  >
                    <Styled.Header style={{ marginLeft: '1rem' }}>
                      {label}
                      {Number(tier) === assetToAdd?.params.liquidityTier && (
                        <Tag style={{ marginLeft: '0.5ch' }}>
                          ✨ {stringGetter({ key: STRING_KEYS.RECOMMENDED })}
                        </Tag>
                      )}
                    </Styled.Header>
                    <Styled.Details
                      layout={isMobile ? 'grid' : 'rowColumns'}
                      withSeparators={!isMobile}
                      items={[
                        {
                          key: 'imf',
                          label: stringGetter({ key: STRING_KEYS.INITIAL_MARGIN_FRACTION_SHORT }),
                          tooltip: 'initial-margin-fraction',
                          value: (
                            <Output
                              fractionDigits={2}
                              type={OutputType.Number}
                              value={initialMarginFraction}
                            />
                          ),
                        },
                        {
                          key: 'mmf',
                          label: stringGetter({
                            key: STRING_KEYS.MAINTENANCE_MARGIN_FRACTION_SHORT,
                          }),
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
                    />
                  </Styled.LiquidityTierRadioButton>
                );
              })}
            </Styled.Root>
          </div>
        </>
      )}
      {alertMessage && (
        <AlertMessage type={alertMessage.type}>{alertMessage.message} </AlertMessage>
      )}
      <WithReceipt
        slotReceipt={
          <Styled.ReceiptDetails
            items={[
              assetToAdd && {
                key: 'reference-price',
                label: stringGetter({ key: STRING_KEYS.REFERENCE_PRICE }),
                tooltip: 'reference-price',
                value: (
                  <Output
                    type={OutputType.Fiat}
                    value={assetToAdd.meta?.referencePrice}
                    fractionDigits={tickSizeDecimals}
                  />
                ),
              },
              assetToAdd && {
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
                          dialogProps: { assetData: assetToAdd, clobPairId, liquidityTier },
                        })
                      )
                    }
                  >
                    {stringGetter({ key: STRING_KEYS.VIEW_DETAILS })} →
                  </Styled.Button>
                ),
              },
              {
                key: 'dydx-required',
                label: (
                  <span>
                    {stringGetter({ key: STRING_KEYS.REQUIRED_BALANCE })}{' '}
                    <Tag>{chainTokenLabel}</Tag>
                  </span>
                ),
                value: (
                  <Styled.Disclaimer>
                    {stringGetter({
                      key: STRING_KEYS.OR_MORE,
                      params: {
                        NUMBER: (
                          <Styled.Output
                            useGrouping
                            type={OutputType.Number}
                            value={initialDepositAmountBN}
                            fractionDigits={initialDepositAmountDecimals}
                          />
                        ),
                      },
                    })}
                  </Styled.Disclaimer>
                ),
              },
            ].filter(isTruthy)}
          />
        }
      >
        {isDisconnected ? (
          <OnboardingTriggerButton />
        ) : (
          <Button
            type={ButtonType.Submit}
            state={{ isDisabled: !assetToAdd || !liquidityTier === undefined || !clobPairId }}
            action={ButtonAction.Primary}
          >
            {stringGetter({ key: STRING_KEYS.PREVIEW_MARKET_PROPOSAL })}
          </Button>
        )}
      </WithReceipt>
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

Styled.SelectedAsset = styled.span`
  color: var(--color-text-2);
`;

Styled.Disclaimer = styled.div`
  color: var(--color-text-0);
  margin-left: 0.5ch;
`;

Styled.Header = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  color: var(--color-text-2);
  font: var(--font-base-medium);
  justify-content: space-between;
`;

Styled.Root = styled(Root)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-layer-6);
  background-color: var(--color-layer-4);
`;

Styled.LiquidityTierRadioButton = styled(Item)<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  border-radius: 0.625rem;
  border: 1px solid var(--color-layer-6);
  padding: 1rem 0;
  font: var(--font-mini-book);

  &:disabled {
    cursor: default;
  }

  ${({ selected }) => selected && 'background-color: var(--color-layer-2)'}
`;

Styled.Details = styled(Details)`
  margin-top: 0.5rem;
  padding: 0;

  dt {
    text-align: left;
  }

  @media ${breakpoints.mobile} {
    padding: 0 1rem;

    dd {
      margin-bottom: 0.5rem;
    }
  }
`;

Styled.ReceiptDetails = styled(Details)`
  padding: 0.375rem 0.75rem 0.25rem;
`;

Styled.Output = styled(Output)`
  display: inline-block;
`;

Styled.Button = styled(Button)`
  --button-padding: 0;
`;
