import styled from 'styled-components';

// import { useStringGetter } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
// import { STRING_KEYS } from '@/constants/localization';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export const RestrictedGeoDialog = ({ preventClose, setIsOpen }: ElementProps) => {
  // const stringGetter = useStringGetter();

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title="dYdX Unavailable"
      // title={stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_TITLE })}
      // subtitle={stringGetter({ key: STRING_KEYS.REGION_NOT_PERMITTED_SUBTITLE })}
    >
      <StyledContent>
        Because you appear to be a resident of, or trading from, a jurisdiction that violates our
        terms of use, or have engaged in activity that violates our terms of use, you have been
        blocked. You may withdraw your funds from the protocol at any time.
        {/* {stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE })} */}
      </StyledContent>
    </Dialog>
  );
};

const StyledContent = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
