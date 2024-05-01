import styled, { AnyStyledComponent } from 'styled-components';

import { formatZeroNumbers } from '@/lib/formatZeroNumbers';

export type CompressedOutputProps = {
  value: string;
  compressZeros?: boolean;
  className?: string;
};

export const CompressedNumberOutput = (props: CompressedOutputProps) => {
  const { value, compressZeros, ...otherProps } = props;
  const { significantDigits, decimalDigits, zeros, punctuationSymbol } = formatZeroNumbers(value);

  if (compressZeros) {
    return (
      <div {...otherProps}>
        {significantDigits}
        {punctuationSymbol}
        {Boolean(zeros) && (
          <>
            0<Styled.Sub title={value}>{zeros}</Styled.Sub>
          </>
        )}
        {decimalDigits}
      </div>
    );
  }

  return value;
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Sub = styled.sub`
  font-size: 0.85em;
`;
