import { useCallback, useEffect, useMemo, useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { AlertType } from '@/constants/alerts';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { NumberSign, TOKEN_DECIMALS } from '@/constants/numbers';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { AlertMessage } from '@/components/AlertMessage';
import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { DiffOutput } from '@/components/DiffOutput';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import { getSubaccountEquity } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { BigNumberish, MustBigNumber } from '@/lib/numbers';
import { log } from '@/lib/telemetry';

type ElementProps = {
  validators: string[];
  usdcRewards: BigNumberish;
  setIsOpen: (open: boolean) => void;
};

export const StakingRewardDialog = ({ validators, usdcRewards, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();
  const { usdcLabel, usdcDecimals } = useTokenConfigs();

  const { getWithdrawRewardFee, withdrawReward } = useSubaccount();
  const { usdcBalance } = useAccountBalance();

  const { current: equity } = useAppSelector(getSubaccountEquity, shallowEqual) ?? {};

  const [error, setError] = useState<string>();
  const [fee, setFee] = useState<BigNumberish>();
  const [isLoading, setIsLoading] = useState(false);

  const showNotEnoughGasWarning = MustBigNumber(usdcBalance).lt(fee ?? 0);

  useEffect(() => {
    getWithdrawRewardFee(validators)
      .then((stdFee) => {
        if (stdFee.amount.length > 0) {
          const feeAmount = stdFee.amount[0].amount;
          setFee(MustBigNumber(formatUnits(BigInt(feeAmount), usdcDecimals)));
        } else {
          setFee(undefined);
        }
      })
      .catch((err) => {
        log('StakeRewardDialog/getWithdrawRewardFee', err);
        setFee(undefined);
      });
  }, [getWithdrawRewardFee, usdcDecimals, validators]);

  const detailItems = useMemo(() => {
    const newEquity = MustBigNumber(equity).plus(usdcRewards);
    return [
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
            withDiff={MustBigNumber(equity) !== newEquity}
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
        value: <Output type={OutputType.Fiat} value={fee} />,
      },
    ];
  }, [equity, usdcLabel, usdcRewards, fee, stringGetter]);

  const claimRewards = useCallback(async () => {
    try {
      setIsLoading(true);
      await withdrawReward(validators);
      setIsOpen(false);
    } catch (err) {
      log('StakeRewardDialog/withdrawReward', err);
      setError(err.message); // TODO: OTE-400
    } finally {
      setIsLoading(false);
    }
  }, [validators, withdrawReward, setIsOpen]);

  return (
    <$Dialog isOpen setIsOpen={setIsOpen} hasHeaderBlur={false}>
      <$Container>
        <$AssetContainer>
          <$Pill>
            <$PositiveOutput
              type={OutputType.Asset}
              value={usdcRewards}
              showSign={ShowSign.Both}
              minimumFractionDigits={TOKEN_DECIMALS}
            />
            {usdcLabel}
          </$Pill>
          <$AssetIcon symbol="USDC" />
        </$AssetContainer>
        <$Heading>{stringGetter({ key: STRING_KEYS.CLAIM_STAKING_REWARDS })}</$Heading>
        {showNotEnoughGasWarning && (
          <AlertMessage type={AlertType.Warning}>
            {stringGetter({
              key: STRING_KEYS.TRANSFER_INSUFFICIENT_GAS, // TODO: OTE-400
              params: { USDC_BALANCE: usdcBalance },
            })}
          </AlertMessage>
        )}
        {error && <AlertMessage type={AlertType.Error}> {error} </AlertMessage>}
        <$WithDetailsReceipt detailItems={detailItems}>
          <Button
            action={ButtonAction.Primary}
            onClick={claimRewards}
            state={{ isLoading, isDisabled: fee === undefined }}
          >
            {stringGetter({
              key: STRING_KEYS.CLAIM_USDC_AMOUNT,
              params: {
                USDC_AMOUNT: (
                  <Output
                    type={OutputType.Asset}
                    value={usdcRewards}
                    showSign={ShowSign.None}
                    minimumFractionDigits={TOKEN_DECIMALS}
                  />
                ),
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
