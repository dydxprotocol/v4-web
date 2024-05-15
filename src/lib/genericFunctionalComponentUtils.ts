import { ForwardedRef, PropsWithoutRef, ReactNode, RefAttributes, forwardRef } from 'react';

// a functional-only version of forwardRef. This only accepts and returns a functional component essentially and thus
// Typescript can fully apply higher order function type inference
// this is only necessary when render function props has generic type arguments
export const forwardRefFn: <T, P = {}>(
  render: (props: P, ref: ForwardedRef<T>) => ReactNode
) => (props: PropsWithoutRef<P> & RefAttributes<T>) => ReactNode = forwardRef;

// if your input and output components are fully functional, use this to type the styled result
// only necessary when render function props has generic type arguments
/*
Usage:

type NavItemStyleProps = { orientation: 'horizontal' | 'vertical' };
const navItemTypeTemp = getSimpleStyledOutputType(NavItem, {} as NavItemStyleProps);

const $NavItem = styled(NavItem)<NavItemStyleProps>`
  ...styles here
` as typeof navItemTypeTemp;
*/

// Note the output is a total lie, never use it at runtime, just for type inference
export const getSimpleStyledOutputType: <C, P = {}>(
  render: (props: P) => React.ReactNode,
  style: C
) => (props: P & C) => React.ReactNode = () => undefined as any;
