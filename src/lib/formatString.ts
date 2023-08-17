// implemntation based on https://github.com/stefalda/react-localization/blob/master/src/LocalizedStrings.js
import React from 'react';
const placeholderRegex = /(\{[\d|\w]+\})/;

const formatString = (str: string, params: { [key: string]: string | React.ReactNode } = {}): string | Array<string | React.ReactNode> => {
  let hasObject = false;
  const res = (str || '')
    .split(placeholderRegex)
    .filter((textPart) => !!textPart)
    .map((textPart, index) => {
      if (textPart.match(placeholderRegex)) {
        const matchedKey = textPart.slice(1, -1);
        let valueForPlaceholder = params[matchedKey];

        if (React.isValidElement(valueForPlaceholder)) {
          hasObject = true;
          return React.Children.toArray(valueForPlaceholder).map((component) => ({
            ...component,
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
