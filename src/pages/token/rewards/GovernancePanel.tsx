import { useDispatch } from 'react-redux';
import styled, { AnyStyledComponent } from 'styled-components';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter, useURLConfigs } from '@/hooks';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';
import { Panel } from '@/components/Panel';

import { openDialog } from '@/state/dialogs';

export const GovernancePanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { governanceLearnMore } = useURLConfigs();

  return (
    <Panel
      className={className}
      slotHeaderContent={<$Title>{stringGetter({ key: STRING_KEYS.GOVERNANCE })}</$Title>}
      slotRight={
        <$Arrow>
          <$IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.Small}
          />
        </$Arrow>
      }
      onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
    >
      <$Description>
        {stringGetter({ key: STRING_KEYS.GOVERNANCE_DESCRIPTION })}
        <Link href={governanceLearnMore} onClick={(e) => e.stopPropagation()}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
        </Link>
      </$Description>
    </Panel>
  );
};
const $Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
`;

const $IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

const $Arrow = styled.div`
  padding-right: 1.5rem;
`;

const $Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  margin-bottom: -1rem;
`;
