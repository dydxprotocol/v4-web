import { formatZeroNumbers } from '@/lib/formatZeroNumbers';

export type NumberValueProps = {
  value: string;
  withSubscript?: boolean;
  className?: string;
};

export const NumberValue = ({ className, value, withSubscript }: NumberValueProps) => {
  const { currencySign, significantDigits, decimalDigits, zeros, punctuationSymbol } =
    formatZeroNumbers(value);

  if (withSubscript) {
    return (
      <span className={className}>
        {currencySign}
        {significantDigits}
        {punctuationSymbol}
        {Boolean(zeros) && (
          <>
            0
            <sub title={value} tw="text-[0.85em]">
              {zeros}
            </sub>
          </>
        )}
        {decimalDigits}
      </span>
    );
  }

  return value;
};
