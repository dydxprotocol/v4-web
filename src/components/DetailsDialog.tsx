import styled from 'styled-components';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import { layoutMixins } from '@/styles/layoutMixins';

import { Details, type DetailsItem } from '@/components/Details';
import { Dialog, DialogPlacement } from '@/components/Dialog';

type ElementProps = {
  slotIcon?: React.ReactNode;
  title: string | React.ReactNode;
  items: DetailsItem[];
  slotFooter?: React.ReactNode;
  setIsOpen: (open: boolean) => void;
};

export const DetailsDialog = ({ slotIcon, title, items, slotFooter, setIsOpen }: ElementProps) => {
  const { isTablet } = useBreakpoints();

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      slotIcon={slotIcon}
      title={title}
      placement={isTablet ? DialogPlacement.Default : DialogPlacement.Sidebar}
    >
      <$Content>
        <Details withSeparators justifyItems="end" items={items} tw="font-small-book" />

        <$Footer>{slotFooter}</$Footer>
      </$Content>
    </Dialog>
  );
};
const $Content = styled.div`
  ${layoutMixins.expandingColumnWithStickyFooter}
  --stickyFooterBackdrop-outsetX: var(--dialog-paddingX);
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
  gap: 1rem;
`;
const $Footer = styled.footer`
  ${layoutMixins.gridEqualColumns}
  gap: 0.66rem;
`;
