import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { DialogPlacement } from '@/components/Dialog';
import { SimpleUiHeader } from '@/components/SimpleUiHeader';
import { AlertsList } from '@/views/Lists/Alerts/AlertsList';
import { NotificationsMenu } from '@/views/menus/NotificationsMenu';

import { testFlags } from '@/lib/testFlags';

const AlertsPage = () => {
  const { isTablet } = useBreakpoints();
  const isSimpleUi = testFlags.simpleUi && isTablet;
  const stringGetter = useStringGetter();

  if (isSimpleUi) {
    return (
      <div tw="flexColumn h-full w-full">
        <SimpleUiHeader pageTitle={stringGetter({ key: STRING_KEYS.ALERTS })} />
        <AlertsList />
      </div>
    );
  }

  return <NotificationsMenu placement={DialogPlacement.Inline} />;
};

export default AlertsPage;
