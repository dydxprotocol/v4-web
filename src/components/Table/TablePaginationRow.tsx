import { Dispatch, SetStateAction } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { type MenuItem } from '@/constants/menus';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { ToggleGroup } from '@/components/ToggleGroup';

export const PAGE_SIZES = [5, 10, 15, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

type ElementProps = {
  currentPage: number;
  pageSize: PageSize;
  pages: MenuItem<string>[];
  totalRows: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setPageSize: Dispatch<SetStateAction<PageSize>>;
};

export const TablePaginationRow = ({
  currentPage,
  pageSize,
  pages,
  totalRows,
  setCurrentPage,
  setPageSize,
}: ElementProps) => {
  const stringGetter = useStringGetter();

  const pageNumberToDisplay = (pageNumber: number) => String(pageNumber + 1);
  const pageToggles = () => {
    const buttonProps = {
      action: ButtonAction.Navigation,
      shape: ButtonShape.Square,
      size: ButtonSize.XSmall,
    };

    return (
      <$InlineRow>
        <IconButton
          {...buttonProps}
          iconName={IconName.ChevronLeft}
          onClick={() => setCurrentPage(currentPage - 1)}
          state={{ isDisabled: currentPage === 0 }}
        />
        <$ToggleGroup
          {...buttonProps}
          value={pageNumberToDisplay(currentPage)}
          items={pages}
          onValueChange={(pageNumber: string) => setCurrentPage(Number(pageNumber) - 1)}
          truncateLabel={false}
        />
        <IconButton
          {...buttonProps}
          iconName={IconName.ChevronRight}
          onClick={() => setCurrentPage(currentPage + 1)}
          state={{
            isDisabled: pageNumberToDisplay(currentPage) === pages[pages.length - 1]?.value,
          }}
        />
      </$InlineRow>
    );
  };

  const pageSizeSelector = () => (
    <$InlineRow>
      {stringGetter({
        key: STRING_KEYS.SHOW,
        params: {
          NUMBER: (
            <DropdownSelectMenu
              value={String(pageSize)}
              items={PAGE_SIZES.map((size) => ({
                label: String(size),
                value: String(size),
              }))}
              onValueChange={(value: String) => setPageSize(Number(value) as PageSize)}
              tw="[--dropdownSelectMenu-item-font-size:--fontSize-mini]"
            />
          ),
        },
      })}
    </$InlineRow>
  );

  return (
    <$PaginationRow>
      {stringGetter({
        key: STRING_KEYS.SHOWING_NUM_OUT_OF_TOTAL,
        params: {
          START: currentPage * pageSize + 1,
          END: Math.min((currentPage + 1) * pageSize, totalRows),
          TOTAL: totalRows,
        },
      })}
      {pageToggles()}
      {pageSizeSelector()}
    </$PaginationRow>
  );
};

const $InlineRow = tw.div`inlineRow`;

const $PaginationRow = styled.div`
  ${layoutMixins.spacedRow}
  padding: var(--tableCell-padding);
`;

const $ToggleGroup = styled(ToggleGroup)`
  [data-disabled] {
    border: none;
    background-color: transparent;
  }
`;
