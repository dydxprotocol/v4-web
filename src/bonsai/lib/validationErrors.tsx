import { AlertType } from '@/constants/alerts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { AlertMessage } from '@/components/AlertMessage';

export interface ValidationError {
  code: string;
  type: ErrorType;
  fields?: string[];
  action?: string | null;
  link?: string | null;
  linkText?: string | null;
  resources: ErrorResources;
}

export interface ErrorResources {
  // title is meant for showing in the disabled button text
  title?: ErrorString;
  // text is for showing in alerts
  text?: ErrorString;
  action?: string | null;
}

export interface ErrorString {
  stringKey: string;
}

export interface ErrorParam {
  key: string;
  value?: string;
  format?: ErrorFormat | null;
}

export enum ErrorFormat {
  Percent = 'Percent',
}

export enum ErrorType {
  error = 'error',
  warning = 'warning',
}

export function getAlertsToRender(errors: ValidationError[]) {
  const error = errors.find(
    (e) => e.resources.text?.stringKey != null && e.type === ErrorType.error
  );
  if (error) {
    return [error];
  }
  const allOthers = errors.filter((e) => e.resources.text?.stringKey != null);
  if (allOthers.length > 0) {
    return allOthers;
  }
  return undefined;
}

export function getFormDisabledButtonStringKey(errors: ValidationError[]) {
  return errors.find((e) => e.resources.title?.stringKey != null && e.type === ErrorType.error)
    ?.resources.title?.stringKey;
}

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
      })}
    </AlertMessage>
  );
};

interface SimpleValidationErrorParams {
  code: string;
  type: ErrorType;
  fields?: string[];
  titleKey?: string;
  textKey?: string;
}

export function simpleValidationError({
  code,
  type,
  fields,
  titleKey,
  textKey,
}: SimpleValidationErrorParams): ValidationError {
  return {
    code,
    type,
    fields,
    action: null,
    link: null,
    linkText: null,
    resources: {
      title: titleKey
        ? {
            stringKey: titleKey,
          }
        : undefined,
      text: textKey
        ? {
            stringKey: textKey,
          }
        : undefined,
      action: null,
    },
  };
}
