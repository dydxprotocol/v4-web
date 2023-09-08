import { ButtonAction, ButtonSize } from '@/constants/buttons';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

type ElementProps = {
  onClick?: () => void;
};

export const BackButton = ({
  onClick = () => {
    // @ts-ignore
    const navigation = globalThis.navigation;

    if (!navigation) {
      globalThis.history?.back();
      // @ts-ignore
    } else if (navigation.canGoBack) {
      navigation.back();
    } else {
      navigation.navigate('/', { replace: true });
    }
  },
}: ElementProps) => (
  <IconButton
    onClick={onClick}
    iconName={IconName.ChevronLeft}
    size={ButtonSize.Small}
    action={ButtonAction.Navigation}
  />
);
