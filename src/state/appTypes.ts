import { useDispatch, useSelector, useStore } from 'react-redux';
import { createSelector } from 'reselect';

import type { AppDispatch, RootState, RootStore } from './_store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<RootStore>();
export const createAppSelector = createSelector.withTypes<RootState>();
