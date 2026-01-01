import type { FC } from 'react';

export function propify<TProps extends object, TFilledProps extends Partial<TProps>>(
  Component: FC<TProps>,
  defaultProps: TFilledProps
): FC<Omit<TProps, keyof TFilledProps> & Partial<TFilledProps>> {
  const PropifiedComponent: FC<Omit<TProps, keyof TFilledProps> & Partial<TFilledProps>> = (
    props
  ) => {
    return <Component {...defaultProps} {...(props as TProps)} />;
  };

  PropifiedComponent.displayName = `Propified(${Component.displayName || Component.name || 'Component'})`;

  return PropifiedComponent;
}
