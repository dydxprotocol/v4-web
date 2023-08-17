import { useEffect, useState } from 'react';

import { breakpoints } from '@/styles';

export enum MediaQueryKeys {
  isMobile = 'isMobile',
  isNotMobile = 'isNotMobile',
  isTablet = 'isTablet',
  isNotTablet = 'isNotTablet',
  isDesktopSmall = 'isDesktopSmall',
  isDesktopMedium = 'isDesktopMedium',
  isDesktopLarge = 'isDesktopLarge',
}

export const mediaQueryLists = {
  [MediaQueryKeys.isMobile]: globalThis.matchMedia(breakpoints.mobile),
  [MediaQueryKeys.isNotMobile]: globalThis.matchMedia(breakpoints.notMobile),
  [MediaQueryKeys.isTablet]: globalThis.matchMedia(breakpoints.tablet),
  [MediaQueryKeys.isNotTablet]: globalThis.matchMedia(breakpoints.notTablet),
  [MediaQueryKeys.isDesktopSmall]: globalThis.matchMedia(breakpoints.desktopSmall),
  [MediaQueryKeys.isDesktopMedium]: globalThis.matchMedia(breakpoints.desktopMedium),
  [MediaQueryKeys.isDesktopLarge]: globalThis.matchMedia(breakpoints.desktopLarge),
};

export const uniqueMediaQueryLists = { ...mediaQueryLists };

export const useBreakpoints = () => {
  // { [typeof breakpoints['string']]: [boolean, () => void] }
  const state = Object.fromEntries(
    Object.entries(mediaQueryLists).map(([key, mediaQueryList]) => [
      key,
      useState(mediaQueryList.matches),
    ])
  );

  useEffect(() => {
    // { [typeof breakpoints['string']]: () => void }
    const callbacks: { [key: string]: (e: MediaQueryListEvent) => void } = {};

    Object.entries(mediaQueryLists).forEach(([key, mediaQueryList]) => {
      const [, setMatches] = state[key];

      callbacks[key] = (e) => {
        setMatches(e.matches);
      };

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', callbacks[key]);
      }
    });

    return () => {
      Object.entries(mediaQueryLists).forEach(([key, mediaQueryList]) => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', callbacks[key]);
        }
      });
    };
  }, []);

  // { [typeof breakpoints['string']]: boolean }
  const breakpointMatches = Object.fromEntries(
    Object.entries(state).map(([key, [matches]]) => [key, matches])
  );

  return breakpointMatches;
};
