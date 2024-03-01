import styled, { AnyStyledComponent } from 'styled-components';

import { useBreakpoints } from '@/hooks';

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
      <Styled.Content>
        <Styled.Details withSeparators justifyItems="end" items={items} />

        <Styled.Footer>{slotFooter}</Styled.Footer>
      </Styled.Content>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.expandingColumnWithStickyFooter}
  --stickyFooterBackdrop-outsetX: var(--dialog-paddingX);
  --stickyFooterBackdrop-outsetY: var(--dialog-content-paddingBottom);
  gap: 1rem;
`;

Styled.Details = styled(Details)`
  font: var(--font-small-book);
`;

Styled.Footer = styled.footer`
  ${layoutMixins.gridEqualColumns}
  gap: 0.66rem;
`;
