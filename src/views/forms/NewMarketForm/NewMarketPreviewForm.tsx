import { FormEvent, useEffect, useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-radio-group';
import { useDispatch, useSelector } from 'react-redux';

import { OnboardingState } from '@/constants/account';
import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { LIQUIDITY_TIERS, MOCK_DATA } from '@/constants/potentialMarkets';
import { useAccountBalance, useDydxClient } from '@/hooks';

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

import { isTruthy } from '@/lib/isTruthy';

import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';
import { Input, InputType } from '@/components/Input';
import { FormInput } from '@/components/FormInput';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { CheckIcon } from '@/icons';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';
import { DiffOutput } from '@/components/DiffOutput';

type NewMarketPreviewFormProps = {
  assetData: (typeof MOCK_DATA)[number];
  liquidityTier: string;
  onBack: () => void;
};

export const NewMarketPreviewForm = ({
  assetData,
  liquidityTier,
  onBack,
}: NewMarketPreviewFormProps) => {
  const { compositeClient } = useDydxClient();
  const { nativeTokenBalance } = useAccountBalance();

  const { label, initialMarginFraction, maintenanceMarginFraction, impactNotional } =
    LIQUIDITY_TIERS[liquidityTier as unknown as keyof typeof LIQUIDITY_TIERS];

  return (
    <Styled.Form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // compositeClient?.validatorClient.post.send()
      }}
    >
      <h2>Confirm new market proposal</h2>
      <FormInput label="Market" type={InputType.Text} value={`${assetData.symbol}-USD`} />
      <WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'imf',
            label: 'IMF',
            value: (
              <Output fractionDigits={2} type={OutputType.Number} value={initialMarginFraction} />
            ),
          },
          {
            key: 'mmf',
            label: 'MMF',
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
            label: 'Impact Notional',
            value: <Output type={OutputType.Fiat} value={impactNotional} />,
          },
        ]}
      >
        <FormInput label="Liquidity tier" type={InputType.Text} value={label} />
      </WithDetailsReceipt>

      <WithDetailsReceipt
        side="bottom"
        detailItems={[
          {
            key: 'required-balance',
            label: 'Required balance',
            value: <Output type={OutputType.Text} value="10,000+" slotRight={<CheckIcon />} />,
          },
          {
            key: 'wallet-balance',
            label: 'Wallet balance',
            value: (
              <DiffOutput
                withDiff
                hasInvalidNewValue={nativeTokenBalance.lt(10_000)}
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
      </WithDetailsReceipt>
      <Styled.ButtonRow>
        <Button onClick={onBack}>Back</Button>
        <Button type={ButtonType.Submit} action={ButtonAction.Primary}>
          Propose new market
        </Button>
      </Styled.ButtonRow>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
  ${layoutMixins.stickyArea0}
  --stickyArea0-background: transparent;
`;

Styled.SearchSelectMenu = styled(SearchSelectMenu)``;

Styled.SelectedAsset = styled.span`
  color: var(--color-text-2);
`;

Styled.Disclaimer = styled.div`
  font: var(--font-small);
  color: var(--color-text-0);
  margin-left: 0.5ch;
`;

Styled.Header = styled.div`
  color: var(--color-text-2);
  font: var(--font-base-medium);
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
`;

Styled.ReceiptDetails = styled(Details)`
  padding: 0.375rem 0.75rem 0.25rem;
  font-size: 0.8125em;
`;

Styled.ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
`;
