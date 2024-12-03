export type Loadable<T> =
  | { status: 'success'; data: T }
  | { status: 'pending'; data?: T }
  | { status: 'error'; error: any; data?: T };

export function loadablePending() {
  return { status: 'pending' } as const;
}

export function loadableLoaded<T>(value: T) {
  return { status: 'success', data: value } as const;
}
