// implemntation based on https://github.com/stefalda/react-localization/blob/master/src/LocalizedStrings.js
import React from 'react';

const PLACEHOLDER_REGEX = /(\{[\d|\w]+\})/;

export type StringGetterParams = Record<string, any>;

const formatString = <T extends StringGetterParams>(
  str: string,
  params?: T
): string | Array<string | React.ReactNode> => {
  let hasObject = false;
  const res = (str || '')
    .split(PLACEHOLDER_REGEX)
    .filter((textPart) => !!textPart)
    .map((textPart, index) => {
      if (textPart.match(PLACEHOLDER_REGEX)) {
        const matchedKey = textPart.slice(1, -1);
        const valueForPlaceholder = params?.[matchedKey];

        if (React.isValidElement(valueForPlaceholder)) {
          hasObject = true;
          return React.Children.toArray(valueForPlaceholder).map((component) => ({
            ...(component as React.ReactElement),
            key: index.toString(),
          }));
        }

        return valueForPlaceholder;
      }
      return textPart;
    });
  // If the results contains a object return an array otherwise return a string
  if (hasObject) return res;
  return res.join('');
};

export default formatString;
