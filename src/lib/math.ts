export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const lerp = (percent: number, from: number, to: number) => from + percent * (to - from);

export const map = (n: number, start1: number, stop1: number, start2: number, stop2: number) => lerp((n - start1) / (stop1 - start1), start2, stop2);
