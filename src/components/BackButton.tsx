import { ButtonAction, ButtonSize } from '@/constants/buttons';

import { IconName } from '@/components/Icon';
import { IconButton, IconButtonProps } from '@/components/IconButton';

type ElementProps = IconButtonProps;

type StyleProps = {
  className?: string;
};

export const BackButton = ({
  className,
  onClick = () => {
    // @ts-ignore
    const navigation = globalThis.navigation;

    if (!navigation) {
      globalThis.history.back();
    } else if (navigation.canGoBack) {
      navigation.back();
    } else {
      navigation.navigate('/', { replace: true });
    }
  },
  ...props
}: ElementProps & StyleProps) => (
  <IconButton
    className={className}
    onClick={onClick}
    iconName={IconName.ChevronLeft}
    size={ButtonSize.Small}
    action={ButtonAction.Navigation}
    {...props}
  />
);
