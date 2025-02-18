export interface ValidationError {
  code: string;
  type: ErrorType;
  fields?: string[];
  action?: string | null;
  link?: string | null;
  linkText?: string | null;
  resources: ErrorResources;
}

export interface ErrorResources {
  title?: ErrorString;
  text?: ErrorString;
  action?: string | null;
}

export interface ErrorString {
  stringKey: string;
}

export interface ErrorParam {
  key: string;
  value?: string;
  format?: ErrorFormat | null;
}

export enum ErrorFormat {
  Percent = 'Percent',
}

export enum ErrorType {
  error = 'error',
  warning = 'warning',
}
export function createForm<
  State,
  Reducer extends VanillaReducer<State, any>,
  SummaryArgs,
  Summary,
>(config: {
  reducer: Reducer;
  calculateSummary: (state: State, args: SummaryArgs) => Summary;
  getErrors: (state: State, summary: NoInfer<Summary>) => ValidationError[];
}) {
  return config;
}

export type VanillaReducer<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
> = {
  initialState: State;
  actions: Actions;
};

export function createVanillaReducer<
  State,
  Actions extends { [key: string]: (state: NoInfer<State>, arg: any) => NoInfer<State> },
>(config: VanillaReducer<State, Actions>): VanillaReducer<State, Actions> {
  return config;
}
