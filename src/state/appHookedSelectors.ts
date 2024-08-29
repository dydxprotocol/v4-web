import { hookedSelectors } from '@/lib/hookify/hookedSelectors';

import { AppDispatch, RootState, store } from './_store';
import { appQueryClient } from './appQueryClient';

export const {
  useQueryHf,
  useHookedSelectorHf,
  useHookedSelector,
  useDispatchHf,
  useAppSelectorHf,
  createHookedSelector,
} = hookedSelectors<RootState, AppDispatch>(store, appQueryClient);
