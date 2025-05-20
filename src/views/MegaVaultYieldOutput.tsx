import { ReactNode, useMemo } from 'react';

import styled, { css } from 'styled-components';

import { NumberSign } from '@/constants/numbers';

import { useLoadedVaultDetails } from '@/hooks/vaultsHooks';

import { Output, OutputType } from '@/components/Output';

import { getNumberSign } from '@/lib/numbers';

export const MegaVaultYieldOutput = ({
  className,
  yieldType = 'ninetyDay',
  slotRight,
  withLoading,
}: {
  className?: string;
  yieldType?: 'ninetyDay' | 'thirtyDay';
  slotRight?: ReactNode;
  withLoading?: boolean;
}) => {
  const vault = useLoadedVaultDetails().data;
  const isVaultDetailsLoading = useLoadedVaultDetails().isLoading;
  const isLoading = withLoading ? isVaultDetailsLoading : false;
  const depositApr =
    yieldType === 'ninetyDay' ? vault?.ninetyDayReturnPercent : vault?.thirtyDayReturnPercent;
  const numberSign = useMemo(() => getNumberSign(depositApr), [depositApr]);

  return (
    <$Output
      className={className}
      type={OutputType.Percent}
      value={depositApr}
      fractionDigits={0}
      sign={numberSign}
      isLoading={isLoading}
      slotRight={isLoading ? null : slotRight}
    />
  );
};

const $Output = styled(Output)<{ sign: NumberSign }>`
  ${({ sign }) =>
    ({
      [NumberSign.Positive]: css`
        color: var(--color-positive);
      `,
      [NumberSign.Negative]: css`
        color: var(--color-negative);
      `,
      [NumberSign.Neutral]: null,
    })[sign]}
`;
