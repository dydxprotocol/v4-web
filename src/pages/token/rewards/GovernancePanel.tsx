import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { openDialog } from '@/state/dialogs';

import { testFlags } from '@/lib/testFlags';

import { RewardsNavPanel } from './RewardsNavPanel';

export const GovernancePanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const { governanceLearnMore } = useURLConfigs();

  const tradingRewardsRehaulEnabled = testFlags.tradingRewardsRehaul;

  const openKeplrDialog = useCallback(
    () => dispatch(openDialog({ type: DialogTypes.ExternalNavKeplr })),
    [dispatch]
  );

  return (
    <RewardsNavPanel
      title={stringGetter({ key: STRING_KEYS.GOVERNANCE })}
      description={stringGetter({
        key: tradingRewardsRehaulEnabled
          ? STRING_KEYS.GOVERNANCE_DETAILS
          : STRING_KEYS.GOVERNANCE_DESCRIPTION,
      })}
      learnMore={governanceLearnMore}
      onNav={openKeplrDialog}
      className={className}
    />
  );
};
