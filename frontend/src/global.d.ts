import 'react';
import type { ClassValue } from 'clsx';

declare module 'react' {
  interface HTMLAttributes<T> {
    /**
     * Component styles from vanilla-extract or CSS modules
     * Can be a single class or array of classes
     */
    css?: ClassValue | ClassValue[];

    /**
     * Tailwind utility classes (takes precedence over css prop)
     */
    tw?: string;
  }

  interface SVGAttributes<T> {
    /**
     * Component styles from vanilla-extract or CSS modules
     * Can be a single class or array of classes
     */
    css?: ClassValue | ClassValue[];

    /**
     * Tailwind utility classes (takes precedence over css prop)
     */
    tw?: string;
  }

  // Button needs explicit children in React 19
  interface ButtonHTMLAttributes<T> {
    children?: ReactNode;
  }
}

export {};
