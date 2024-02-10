import { ButtonAction, ButtonSize } from '@/constants/buttons';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

type ElementProps = {
  onClick?: () => void;
};

type StyleProps = {
  className?: string;
};

export const BackButton = ({
  className,
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
}: ElementProps & StyleProps) => (
  <IconButton
    className={className}
    onClick={onClick}
    iconName={IconName.ChevronLeft}
    size={ButtonSize.Small}
    action={ButtonAction.Navigation}
  />
);
