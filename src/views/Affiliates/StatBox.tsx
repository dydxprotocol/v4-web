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
}: PropsWithChildren<IStatCellProps>) => {
  return (
    <StatBox className={className}>
      <StatTitle>{title}</StatTitle>
      {outputType && <StatValue valueSize={valueSize} type={outputType} value={value} />}
      {children}
    </StatBox>
  );
};

export const BorderStatCell = styled(StatCell)<{ border: ('top' | 'bottom' | 'right' | 'left')[] }>`
  ${({ border }) => border.map((b) => `border-${b}: 1px solid var(--color-border);`).join('')}
`;

const StatBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StatTitle = styled.h4`
  color: var(--color-text-0);
  font-size: var(--fontSize-small);
`;

const StatValue = styled(Output)<{ valueSize: 'small' | 'large' }>`
  font-size: ${({ valueSize }) =>
    valueSize === 'large' ? 'var(--fontSize-extra)' : 'var(--fontSize-base)'};
  font-weight: var(--fontWeight-semibold);
`;
