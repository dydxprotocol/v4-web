import { QueryObserver } from '@tanstack/react-query';

export function safeSubscribeObserver<Obs extends QueryObserver<any, any, any, any, any>>(
  observer: Obs,
  handleResult: Parameters<Obs['subscribe']>[0]
): () => void {
  handleResult(observer.getCurrentResult());
  const unsub = observer.subscribe(handleResult);
  return unsub;
}
