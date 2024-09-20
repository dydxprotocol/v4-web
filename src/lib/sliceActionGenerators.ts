import { PayloadAction } from '@reduxjs/toolkit';
import { upperFirst } from 'lodash';

type SubSetterActionHandlers<
  T extends object,
  SubState extends object = T,
  StringDescription extends string = '',
> = {
  [Key in keyof SubState & string as `set${Capitalize<StringDescription>}${Capitalize<Key>}`]: (
    // technically this should be WritableDraft<T> from immer.js but we don't depend on that directly
    state: T,
    action: PayloadAction<SubState[Key]>
  ) => void;
};

export function generateTypedSetterActions<
  BaseState extends object,
  SubState extends object = BaseState,
  StringDescription extends string = '',
>(
  baseState: BaseState,
  subGetter: (state: NoInfer<BaseState>) => SubState = (t) => t as any,
  description: StringDescription = '' as const as any
): SubSetterActionHandlers<BaseState, SubState, StringDescription> {
  const keys = Object.keys(subGetter(baseState));
  const result: { [key: string]: any } = {};
  keys.forEach((k) => {
    result[`set${upperFirst(description)}${upperFirst(k)}`] = (state: any, action: any) => {
      (subGetter(state) as any)[k] = action.payload;
    };
  });
  return result as any;
}
