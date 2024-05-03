import styled, { AnyStyledComponent } from 'styled-components';

import { formatZeroNumbers } from '@/lib/formatZeroNumbers';

export type NumberValueProps = {
  value: string;
  withSubscript?: boolean;
  className?: string;
};

export const NumberValue = ({ className, value, withSubscript }: NumberValueProps) => {
  const { significantDigits, decimalDigits, zeros, punctuationSymbol } = formatZeroNumbers(value);

  if (withSubscript) {
    return (
      <span className={className}>
        {significantDigits}
        {punctuationSymbol}
        {Boolean(zeros) && (
          <>
            0<Styled.Sub title={value}>{zeros}</Styled.Sub>
          </>
        )}
        {decimalDigits}
      </span>
    );
  }

  return value;
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Sub = styled.sub`
  font-size: 0.85em;
`;
