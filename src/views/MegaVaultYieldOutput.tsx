import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useLoadedVaultDetails } from '@/hooks/vaultsHooks';

import { Output, OutputType } from '@/components/Output';

import { getNumberSign } from '@/lib/numbers';

export const MegaVaultYieldOutput = ({
  className,
  yieldType = 'ninetyDay',
}: {
  className?: string;
  yieldType?: 'ninetyDay' | 'thirtyDay';
}) => {
  const stringGetter = useStringGetter();
  const vault = useLoadedVaultDetails().data;
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
      slotRight={<span>{stringGetter({ key: STRING_KEYS.APR })}</span>}
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
