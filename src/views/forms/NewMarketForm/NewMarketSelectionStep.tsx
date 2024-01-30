import { FormEvent, useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-radio-group';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import {
  LIQUIDITY_TIERS,
  NUM_ORACLES_TO_QUALIFY_AS_SAFE,
  type PotentialMarketItem,
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
import { Icon, IconName } from '@/components/Icon';
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
  assetToAdd?: PotentialMarketItem;
  clobPairId?: number;
  setAssetToAdd: (assetToAdd?: PotentialMarketItem) => void;
  onConfirmMarket: () => void;
  liquidityTier?: number;
  setLiquidityTier: (liquidityTier?: number) => void;
  tickSizeDecimals: number;
};

export const NewMarketSelectionStep = ({
  assetToAdd,
  clobPairId,
  setAssetToAdd,
  onConfirmMarket,
  liquidityTier,
  setLiquidityTier,
  tickSizeDecimals,
}: NewMarketSelectionStepProps) => {
  const dispatch = useDispatch();
  const { nativeTokenBalance } = useAccountBalance();
  const onboardingState = useSelector(getOnboardingState);
  const isDisconnected = onboardingState === OnboardingState.Disconnected;
  const { isMobile } = useBreakpoints();
  const marketIds = useSelector(getMarketIds, shallowEqual);
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const { potentialMarkets, exchangeConfigs } = usePotentialMarkets();
  const stringGetter = useStringGetter();
  const { newMarketProposal } = useGovernanceVariables();
  const initialDepositAmountBN = MustBigNumber(newMarketProposal.initialDepositAmount).div(
    Number(`1e${chainTokenDecimals}`)
  );
  const initialDepositAmountDecimals = isMainnet ? 0 : chainTokenDecimals;
  const initialDepositAmount = initialDepositAmountBN.toFixed(initialDepositAmountDecimals);

  const [tempLiquidityTier, setTempLiquidityTier] = useState<number>();
  const [canModifyLiqTier, setCanModifyLiqTier] = useState(false);

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
      setTempLiquidityTier(assetToAdd.liquidityTier);
      setLiquidityTier(assetToAdd.liquidityTier);
    }
  }, [assetToAdd]);

  const filteredPotentialMarkets = useMemo(() => {
    return potentialMarkets?.filter(
      ({ baseAsset, numOracles }) =>
        exchangeConfigs?.[baseAsset] !== undefined &&
        Number(numOracles) >= NUM_ORACLES_TO_QUALIFY_AS_SAFE &&
        !marketIds.includes(`${baseAsset}-USD`)
    );
  }, [exchangeConfigs, potentialMarkets, marketIds]);

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (canModifyLiqTier) {
          setLiquidityTier(tempLiquidityTier);
          setCanModifyLiqTier(false);
        } else {
          onConfirmMarket();
        }
      }}
    >
      <h2>
        {stringGetter({ key: STRING_KEYS.ADD_A_MARKET })}
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
      <SearchSelectMenu
        items={[
          {
            group: 'markets',
            groupLabel: stringGetter({ key: STRING_KEYS.MARKETS }),
            items:
              filteredPotentialMarkets?.map((potentialMarket: PotentialMarketItem) => ({
                value: potentialMarket.baseAsset,
                label: potentialMarket?.assetName ?? potentialMarket.baseAsset,
                tag: `${potentialMarket.baseAsset}-USD`,
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
            {assetToAdd?.assetName ?? assetToAdd.baseAsset} <Tag>{assetToAdd?.baseAsset}-USD</Tag>
          </Styled.SelectedAsset>
        ) : (
          'e.g. "BTC-USD"'
        )}
      </SearchSelectMenu>
      {assetToAdd && (
        <>
          <div>{stringGetter({ key: STRING_KEYS.POPULATED_DETAILS })}</div>
          <div>
            <Styled.Root value={tempLiquidityTier} onValueChange={setTempLiquidityTier}>
              <Styled.Header>
                {stringGetter({ key: STRING_KEYS.LIQUIDITY_TIER })}
                <Styled.ButtonRow>
                  <Button
                    shape={ButtonShape.Pill}
                    onClick={() => {
                      if (canModifyLiqTier) {
                        setTempLiquidityTier(liquidityTier);
                      }
                      setCanModifyLiqTier(!canModifyLiqTier);
                    }}
                  >
                    {canModifyLiqTier ? (
                      stringGetter({ key: STRING_KEYS.CANCEL })
                    ) : (
                      <>
                        {stringGetter({ key: STRING_KEYS.MODIFY })}{' '}
                        <Icon iconName={IconName.Pencil} />
                      </>
                    )}
                  </Button>
                  {canModifyLiqTier && (
                    <Button
                      shape={ButtonShape.Pill}
                      action={ButtonAction.Primary}
                      onClick={() => {
                        setLiquidityTier(tempLiquidityTier);
                        setCanModifyLiqTier(false);
                      }}
                    >
                      {stringGetter({ key: STRING_KEYS.SAVE })}
                    </Button>
                  )}
                </Styled.ButtonRow>
              </Styled.Header>

              {Object.keys(LIQUIDITY_TIERS).map((tier) => {
                const { maintenanceMarginFraction, impactNotional, label, initialMarginFraction } =
                  LIQUIDITY_TIERS[tier as unknown as keyof typeof LIQUIDITY_TIERS];
                return (
                  <Styled.LiquidityTierRadioButton
                    key={tier}
                    value={Number(tier)}
                    selected={Number(tier) === tempLiquidityTier}
                    disabled={!canModifyLiqTier}
                  >
                    <Styled.Header style={{ marginLeft: '1rem' }}>
                      {label}
                      {Number(tier) === assetToAdd?.liquidityTier && (
                        <Tag style={{ marginLeft: '0.5ch' }}>
                          ✨ {stringGetter({ key: STRING_KEYS.RECOMMENDED })}
                        </Tag>
                      )}
                    </Styled.Header>
                    <Styled.Details
                      layout={isMobile ? 'stackColumn' : 'rowColumns'}
                      withSeparators={!isMobile}
                      items={[
                        {
                          key: 'imf',
                          label: 'IMF',
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
                    value={assetToAdd.referencePrice}
                    fractionDigits={tickSizeDecimals}
                  />
                ),
              },
              assetToAdd && {
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
                          dialogProps: { assetData: assetToAdd, clobPairId, liquidityTier },
                        })
                      )
                    }
                  >
                    {stringGetter({ key: STRING_KEYS.VIEW_DETAILS })} →
                  </Button>
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
            {canModifyLiqTier
              ? stringGetter({ key: STRING_KEYS.SAVE })
              : stringGetter({ key: STRING_KEYS.PREVIEW_MARKET_PROPOSAL })}
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

Styled.ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;

  button {
    min-width: 80px;
  }
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
