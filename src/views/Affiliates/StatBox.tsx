import { PropsWithChildren } from 'react';

import styled from 'styled-components';

import { Output, OutputType } from '@/components/Output';

interface IStatCellProps {
  className?: string;
  title: string;
  value?: number | string;
  valueSize?: 'small' | 'large';
  outputType?: OutputType;
}

export const StatCell = ({
  title,
  value,
  children,
  className,
  valueSize = 'small',
  outputType,
}: PropsWithChildren<IStatCellProps>) => (
  <StatBox className={className}>
    <StatTitle>{title}</StatTitle>
    {outputType && (
      <StatValue
        valueSize={valueSize}
        type={value ? outputType : OutputType.Text}
        value={value ?? '-'}
      />
    )}
    {children}
  </StatBox>
);

export const BorderStatCell = styled(StatCell)<{ border: ('top' | 'bottom' | 'right' | 'left')[] }>`
  ${({ border }) => border.map((b) => `border-${b}: 1px solid var(--color-border);`).join('')}
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StatTitle = styled.h4`
  color: var(--color-text-0);

  font-size: 14px;
`;

const StatValue = styled(Output)<{ valueSize: 'small' | 'large' }>`
  font-size: ${({ valueSize }) => (valueSize === 'large' ? 28 : 15)}px;
  font-weight: 600;
`;
