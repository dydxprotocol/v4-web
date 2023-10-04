import styled from 'styled-components';

import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { STRING_KEYS } from '@/constants/localization';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const RateLimitDialog = ({ preventClose, setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_TITLE })}
    >
      <StyledContent>
        {stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE })}
      </StyledContent>
    </Dialog>
  );
};

const StyledContent = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
