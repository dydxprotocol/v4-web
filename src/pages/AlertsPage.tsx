import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { DialogPlacement } from '@/components/Dialog';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { AlertsList } from '@/views/Lists/Alerts/AlertsList';
import { NotificationsMenu } from '@/views/menus/NotificationsMenu';

import { testFlags } from '@/lib/testFlags';

const AlertsPage = () => {
  const { isTablet } = useBreakpoints();
  const isSimpleUi = testFlags.simpleUi && isTablet;
  const navigate = useNavigate();
  const stringGetter = useStringGetter();

  const handleBack = () => {
    navigate(AppRoute.Markets);
  };

  if (isSimpleUi) {
    return (
      <div tw="flexColumn h-full w-full">
        <div tw="row relative mb-[1rem] mt-[1.375rem] justify-center">
          <h1 tw="text-color-text-2 font-large-bold">
            {stringGetter({ key: STRING_KEYS.ALERTS })}
          </h1>
          <$BackButton
            onClick={handleBack}
            iconName={IconName.Caret}
            buttonStyle={ButtonStyle.WithoutBackground}
          />
        </div>
        <AlertsList />
      </div>
    );
  }

  return <NotificationsMenu placement={DialogPlacement.Inline} />;
};

const $BackButton = styled(IconButton)`
  position: absolute;
  left: 1.25rem;
  top: 0;
  bottom: 0;
  transform: rotate(0.25turn);

  svg {
    height: 1rem;
    width: 1rem;
  }
`;

export default AlertsPage;
