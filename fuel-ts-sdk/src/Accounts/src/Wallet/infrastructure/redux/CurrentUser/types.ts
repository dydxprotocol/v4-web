import type { RequestStatus } from '@sdk/shared/lib/redux';
import type { WalletEntity } from '../../../domain';

export interface CurrentUserState {
  data: WalletEntity | null | undefined;
  status: RequestStatus;
  error: string | null | undefined;
}

export const nullCurrentUserState: CurrentUserState = {
  data: undefined,
  error: undefined,
  status: 'uninitialized',
};
