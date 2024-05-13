/**
 * @description Hook to handle pagination on table views
 */
import { useEffect, useState } from 'react';

import { MenuItem } from '@/constants/menus';

import { PageSize } from '@/components/Table/TablePaginationRow';

const MAX_NUM_PAGE_BUTTONS = 7;
const PAGE_TOGGLE_PLACEHOLDER = '...';

export const useTablePagination = ({
  initialPageSize,
  totalRows,
}: {
  initialPageSize: PageSize;
  totalRows: number;
}) => {
  const [pageSize, setPageSize] = useState(initialPageSize);
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
    const lastPage = Math.max(1, Math.ceil(totalRows / pageSize)) - 1;
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [pageSize]);

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
  }, [pageSize, currentPage]);

  return { currentPage, pageSize, pages, setPageSize, setCurrentPage };
};
