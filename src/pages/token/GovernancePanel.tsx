import { useCallback } from 'react';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { RewardsNavPanel } from './RewardsNavPanel';

export const GovernancePanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { governanceLearnMore } = useURLConfigs();

  const openKeplrDialog = useCallback(
    () => dispatch(openDialog(DialogTypes.ExternalNavKeplr())),
    [dispatch]
  );

  return (
    <RewardsNavPanel
      title={stringGetter({ key: STRING_KEYS.GOVERNANCE })}
      description={stringGetter({
        key: STRING_KEYS.GOVERNANCE_DETAILS,
      })}
      learnMore={governanceLearnMore}
      onNav={openKeplrDialog}
      className={className}
    />
  );
};
