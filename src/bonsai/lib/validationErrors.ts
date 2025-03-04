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
  params?: { [key: string]: ErrorParam };
}

export interface ErrorParam {
  value: string | number;
  format?: ErrorFormat | null;
  decimals?: number;
}

export enum ErrorFormat {
  Percent = 'Percent',
  Size = 'Size',
  Price = 'Price',
  String = 'String',
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

interface SimpleValidationErrorParams {
  code: string;
  type: ErrorType;
  fields?: string[];
  titleKey?: string;
  textKey?: string;
  titleParams?: { [key: string]: ErrorParam };
  textParams?: { [key: string]: ErrorParam };
}

export function simpleValidationError({
  code,
  type,
  fields,
  titleKey,
  textKey,
  textParams,
  titleParams,
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
            params: titleParams,
          }
        : undefined,
      text: textKey
        ? {
            stringKey: textKey,
            params: textParams,
          }
        : undefined,
      action: null,
    },
  };
}
