import React, { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

interface ExoticComponentWithDisplayName<P extends object = {}> extends React.ExoticComponent<P> {
  defaultProps?: Partial<P> | undefined;
  displayName?: string | undefined;
}

type AnyComponent<P extends object = any> =
  | ExoticComponentWithDisplayName<P>
  | React.ComponentType<P>;

export const twClassed = <TargetProps extends { className?: string; children?: React.ReactNode }>(
  Component: AnyComponent<TargetProps>,
  boundClassName?: string
) => {
  return (props: ComponentProps<typeof Component>) => {
    const { className, children } = props;
    return (
      <Component {...props} className={twMerge(boundClassName, className)}>
        {children}
      </Component>
    );
  };
};

const wrapNative = (nativeName: keyof JSX.IntrinsicElements) => (boundClassName: string) =>
  twClassed(
    ({ children, ...others }: JSX.IntrinsicElements[typeof nativeName]) =>
      React.createElement(nativeName, { ...others }, children),
    boundClassName
  );

twClassed.div = wrapNative('div');
