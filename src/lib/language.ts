// matches Amplitude's language detection logic in https://github.com/amplitude/Amplitude-JavaScript/blob/master/src/language.js
export const getBrowserLanguage = (): string => {
  const navigator = globalThis.navigator;
  return (
    (navigator &&
      ((navigator.languages && navigator.languages[0]) ||
        navigator.language ||
        (navigator as any).userLanguage)) ||
    ''
  );
};
