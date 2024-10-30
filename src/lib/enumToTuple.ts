type EnumKeys<T> = keyof T;
export type StrictEnumTuple<T> = {
  [K in EnumKeys<T>]: T[K] extends number ? T[K] : never;
} extends { [key: string]: infer U }
  ? U[]
  : never;
