import { PayloadAction } from '@reduxjs/toolkit';
import { upperFirst } from 'lodash';
// todo remove this when we upgrade typescript to 5.4 or whenever NoInfer is added
import { NoInfer } from 'react-redux';

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

// Given an initial state object which has all properties (no optional properties excluded please),
// generate a setProperty action for each property on the state
// so { x: 1, y: 1 } turns into { setX, setY } actions which just set the property
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
