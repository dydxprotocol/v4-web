export type Loadable<T> =
  | { status: 'idle'; data: undefined }
  | { status: 'success'; data: T }
  | { status: 'pending'; data?: T }
  | { status: 'error'; data?: T; error: any };

export function loadablePending<T>() {
  return { status: 'pending' } as { status: 'pending'; data?: T };
}

export function loadableIdle() {
  return { status: 'idle', data: undefined } as const;
}

export function loadableLoaded<T>(value: T) {
  return { status: 'success', data: value } as const;
}
