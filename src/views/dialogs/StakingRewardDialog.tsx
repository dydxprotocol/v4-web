import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getSubaccountEquity } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

export const StakingRewardDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { usdcLabel } = useTokenConfigs();

  const { current: equity, postOrder: newEquity } =
    useAppSelector(getSubaccountEquity, shallowEqual) ?? {};

  const HARDCODED_XCXC = {
    gasFee: 0.32,
    gain: 2.55,
  };

  const detailItems = [
    {
      key: 'equity',
      label: (
        <>
          {stringGetter({ key: STRING_KEYS.EQUITY })} <Tag>{usdcLabel}</Tag>
        </>
      ),
      value: (
        <DiffOutput
          type={OutputType.Fiat}
          value={equity}
          newValue={newEquity}
          sign={NumberSign.Positive}
          withDiff={equity !== newEquity}
        />
      ),
    },
    {
      key: 'gas-fees',
      label: (
        <>
          {stringGetter({ key: STRING_KEYS.EST_GAS })} <Tag>{usdcLabel}</Tag>
        </>
      ),
      value: <Output type={OutputType.Fiat} value={HARDCODED_XCXC.gasFee} />,
    },
  ];

  return (
    <$Dialog isOpen setIsOpen={setIsOpen} hasHeaderBlur={false}>
      <$Container>
        <$AssetContainer>
          <$Pill>
            <$PositiveOutput
              type={OutputType.Asset}
              value={HARDCODED_XCXC.gain}
              showSign={ShowSign.Both}
            />
            {usdcLabel}
          </$Pill>
          <$AssetIcon symbol="USDC" />
        </$AssetContainer>
        <$Heading>{stringGetter({ key: STRING_KEYS.CLAIM_STAKING_REWARDS })}</$Heading>
        <$WithDetailsReceipt detailItems={detailItems}>
          <Button action={ButtonAction.Primary}>
            {stringGetter({
              key: STRING_KEYS.CLAIM_USDC_AMOUNT,
              params: {
                USDC_AMOUNT: HARDCODED_XCXC.gain,
              },
            })}
          </Button>
        </$WithDetailsReceipt>
      </$Container>
    </$Dialog>
  );
};

const $Dialog = styled(Dialog)`
  --dialog-header-paddingBottom: 0rem;
`;

const $Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    background-image: url('/chart-dots-background-dark.svg'),
      linear-gradient(to top, var(--color-layer-3) 60%, var(--color-green-dark) 130%);
    mask-image: linear-gradient(to bottom, var(--color-layer-3) 20%, transparent);
  }
`;

const $AssetContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const $Pill = styled.div`
  border-radius: 1rem;
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  gap: 0.5ch;

  background: var(--color-green-dark);
  color: var(--color-text-2);

  margin-bottom: -0.5rem;
  z-index: 1;
`;

const $AssetIcon = styled(AssetIcon)`
  font-size: 5rem;
`;

const $Heading = styled.h3`
  font: var(--font-extra-bold);
  color: var(--color-text-2);
  z-index: 1;
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  width: 100%;
  z-index: 1;
`;

const $PositiveOutput = styled(Output)`
  --output-sign-color: var(--color-positive);
`;
