/**
 * @description Hook to handle pagination on table views
 */
import { useCallback, useEffect, useState } from 'react';

import { MenuItem } from '@/constants/menus';

import { PAGE_SIZES, PageSize } from '@/components/Table/TablePaginationRow';

import { useAppDispatch } from '@/state/appTypes';
import { setTablePageSize } from '@/state/appUiConfigs';
import { getSavedTablePageSize } from '@/state/appUiConfigsSelectors';

import { useParameterizedSelector } from './useParameterizedSelector';

const MAX_NUM_PAGE_BUTTONS = 7;
const PAGE_TOGGLE_PLACEHOLDER = '...';

function validPageSizeOrUndefined(num: number | undefined): PageSize | undefined {
  if (num == null) {
    return undefined;
  }
  if (PAGE_SIZES.indexOf(num as PageSize) >= 0) {
    return num as PageSize;
  }
  return undefined;
}

export const useTablePagination = ({
  initialPageSize,
  totalRows,
  shouldResetOnTotalRowsChange,
  tableId,
}: {
  initialPageSize: PageSize;
  totalRows: number;
  shouldResetOnTotalRowsChange?: boolean;
  tableId: string;
}) => {
  const savedPageSize = useParameterizedSelector(getSavedTablePageSize, tableId);
  const [pageSize, setPageSizeState] = useState(
    validPageSizeOrUndefined(savedPageSize) ?? initialPageSize
  );
  const dispatch = useAppDispatch();
  const setPageSize = useCallback(
    (next: PageSize) => {
      setPageSizeState(next);
      if (tableId) {
        dispatch(setTablePageSize({ tableId, pageSize: next }));
      }
    },
    [dispatch, tableId]
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<MenuItem<string>[]>([]);

  const pageNumberToDisplay = (pageNumber: number) => String(pageNumber + 1);
  const pageNumberToMenuItem = (pageNumber: number) => ({
    value: pageNumberToDisplay(pageNumber),
    label: pageNumberToDisplay(pageNumber),
  });
  const placeholderPageItem = (key: string) => {
    return {
      value: key,
      label: PAGE_TOGGLE_PLACEHOLDER,
      disabled: true,
    };
  };

  useEffect(() => {
    if (shouldResetOnTotalRowsChange) {
      setCurrentPage(0);
    }
  }, [pageSize, totalRows, shouldResetOnTotalRowsChange]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(totalRows / pageSize)) - 1;
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, pageSize, totalRows]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const lastPage = totalPages - 1;

    if (totalPages <= MAX_NUM_PAGE_BUTTONS) {
      setPages(
        [...Array(Math.min(MAX_NUM_PAGE_BUTTONS, totalPages)).keys()].map((i) =>
          pageNumberToMenuItem(i)
        )
      );
    } else if (currentPage < 2 || lastPage - currentPage < 2) {
      setPages([
        pageNumberToMenuItem(0),
        pageNumberToMenuItem(1),
        pageNumberToMenuItem(2),
        placeholderPageItem('placeholder'),
        pageNumberToMenuItem(lastPage - 2),
        pageNumberToMenuItem(lastPage - 1),
        pageNumberToMenuItem(lastPage),
      ]);
    } else {
      setPages([
        pageNumberToMenuItem(0),
        placeholderPageItem('placeholder1'),
        pageNumberToMenuItem(currentPage - 1),
        pageNumberToMenuItem(currentPage),
        pageNumberToMenuItem(currentPage + 1),
        placeholderPageItem('placeholder2'),
        pageNumberToMenuItem(lastPage),
      ]);
    }
  }, [pageSize, currentPage, totalRows]);

  return { currentPage, pageSize, pages, setPageSize, setCurrentPage };
};
