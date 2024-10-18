import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { NumberSign } from '@/constants/numbers';

import { useLoadedVaultDetails } from '@/hooks/vaultsHooks';

import { Output, OutputType } from '@/components/Output';

import { getNumberSign } from '@/lib/numbers';

export const MegaVaultYieldOutput = ({ className }: { className?: string }) => {
  const vault = useLoadedVaultDetails().data;
  const depositApr = vault?.thirtyDayReturnPercent;
  const numberSign = useMemo(() => getNumberSign(depositApr), [depositApr]);

  return (
    <$Output
      className={className}
      type={OutputType.Percent}
      value={depositApr}
      fractionDigits={0}
      sign={numberSign}
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
