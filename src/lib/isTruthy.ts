/** Boolean() with type narrowing */
export const isTruthy = <T extends any>(n?: T | false | null | undefined | 0): n is T =>
    Boolean(n);
