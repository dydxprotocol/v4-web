import { ErrorFormat, ErrorParam, ErrorType, ValidationError } from '@/bonsai/lib/validationErrors';
import { mapValues } from 'lodash';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { assertNever } from '@/lib/assertNever';

import { AlertMessage } from './AlertMessage';
import { Output, OutputType } from './Output';

export const ValidationAlertMessage = ({
  className,
  error,
}: {
  error: ValidationError;
  className?: string;
}) => {
  const stringGetter = useStringGetter();
  return (
    <AlertMessage
      type={error.type === ErrorType.error ? AlertType.Error : AlertType.Warning}
      className={className}
    >
      {stringGetter({
        key:
          error.resources.text?.stringKey ??
          error.resources.title?.stringKey ??
          STRING_KEYS.UNKNOWN_ERROR,
        params:
          renderParams({ params: error.resources.text?.params }) ??
          renderParams({ params: error.resources.title?.params }) ??
          {},
      })}
    </AlertMessage>
  );
};

export const renderParams = ({ params }: { params?: { [key: string]: ErrorParam } }) => {
  return params != null
    ? mapValues(params, (v) => {
        if (v.format == null || v.format === ErrorFormat.String) {
          return v.value;
        }
        if (v.format === ErrorFormat.Percent) {
          return (
            <Output value={v.value} type={OutputType.SmallPercent} fractionDigits={v.decimals} />
          );
        }
        if (v.format === ErrorFormat.Size) {
          return <Output value={v.value} type={OutputType.Number} fractionDigits={v.decimals} />;
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (v.format === ErrorFormat.Price) {
          return <Output value={v.value} type={OutputType.Fiat} fractionDigits={v.decimals} />;
        }
        assertNever(v.format);
        return null;
      })
    : null;
};
