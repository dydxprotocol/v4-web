import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

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
      slotIcon={<$Icon iconName={IconName.Warning} />}
    >
      <$Content>{stringGetter({ key: STRING_KEYS.RATE_LIMIT_REACHED_ERROR_MESSAGE })}</$Content>
    </Dialog>
  );
};
const $Icon = styled(Icon)`
  color: var(--color-warning);
`;

const $Content = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;
