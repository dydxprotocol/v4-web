import { useCallback } from 'react';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { RewardsNavPanel } from './RewardsNavPanel';

export const GovernancePanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const { isStakingEnabled } = useEnvFeatures();
  const { governanceLearnMore } = useURLConfigs();

  const openKeplrDialog = useCallback(
    () => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr })),
    [dispatch]
  );

  return (
    <RewardsNavPanel
      title={stringGetter({ key: STRING_KEYS.GOVERNANCE })}
      description={stringGetter({
        key: isStakingEnabled ? STRING_KEYS.GOVERNANCE_DETAILS : STRING_KEYS.GOVERNANCE_DESCRIPTION,
      })}
      learnMore={governanceLearnMore}
      onNav={openKeplrDialog}
      className={className}
    />
  );
};
