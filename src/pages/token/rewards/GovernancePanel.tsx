import styled, { AnyStyledComponent } from 'styled-components';
import { useDispatch } from 'react-redux';

import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { DialogTypes } from '@/constants/dialogs';

import { useStringGetter, useURLConfigs } from '@/hooks';

import { Panel } from '@/components/Panel';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Link } from '@/components/Link';

import { openDialog } from '@/state/dialogs';

export const GovernancePanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { governanceLearnMore } = useURLConfigs();

  return (
    <Panel
      className={className}
      slotHeaderContent={
        <Styled.Title>{stringGetter({ key: STRING_KEYS.GOVERNANCE })}</Styled.Title>
      }
      slotRight={
        <Styled.Arrow>
          <Styled.IconButton
            action={ButtonAction.Base}
            iconName={IconName.Arrow}
            size={ButtonSize.Small}
          />
        </Styled.Arrow>
      }
      onClick={() => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr }))}
    >
      <Styled.Description>
        {stringGetter({ key: STRING_KEYS.GOVERNANCE_DESCRIPTION })}
        <Link href={governanceLearnMore} onClick={(e) => e.stopPropagation()}>
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })} →
        </Link>
      </Styled.Description>
    </Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Description = styled.div`
  color: var(--color-text-0);
  --link-color: var(--color-text-1);

  a {
    display: inline;
    ::before {
      content: ' ';
    }
  }
`;

Styled.IconButton = styled(IconButton)`
  color: var(--color-text-0);
  --color-border: var(--color-layer-6);
`;

Styled.Arrow = styled.div`
  padding-right: 1.5rem;
`;

Styled.Title = styled.h3`
  font: var(--font-medium-book);
  color: var(--color-text-2);
  margin-bottom: -1rem;
`;
