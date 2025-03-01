import { ErrorType, ValidationError } from '@/bonsai/lib/validationErrors';

import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from './AlertMessage';

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
        params: error.resources.text?.params ?? error.resources.title?.params ?? {},
      })}
    </AlertMessage>
  );
};
