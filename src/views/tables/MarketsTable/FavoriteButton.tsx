import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonStyle } from '@/constants/buttons';

import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { favoriteMarket, unfavoriteMarket } from '@/state/appUiConfigs';
import { getIsMarketFavorited } from '@/state/appUiConfigsSelectors';

import { track } from '@/lib/analytics/analytics';

export const FavoriteButton = ({
  className,
  marketId,
}: {
  className?: string;
  marketId: string;
}) => {
  const dispatch = useDispatch();
  const isMarketFavorited = useParameterizedSelector(getIsMarketFavorited, marketId);

  const onToggle = (newIsFavorited: boolean) => {
    if (newIsFavorited) {
      dispatch(favoriteMarket(marketId));
      track(AnalyticsEvents.FavoriteMarket({ marketId }));
    } else {
      dispatch(unfavoriteMarket(marketId));
      track(AnalyticsEvents.UnfavoriteMarket({ marketId }));
    }
  };

  return (
    <$IconToggleButton
      className={className}
      iconName={IconName.Star}
      buttonStyle={ButtonStyle.WithoutBackground}
      isPressed={isMarketFavorited}
      onPressedChange={onToggle}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      isToggle
    />
  );
};

const $IconToggleButton = styled(IconButton)`
  --button-icon-size: 1.25em;
  --button-toggle-on-backgroundColor: transparent;
  --button-toggle-on-textColor: ${({ theme }) => theme.profileYellow};
  --button-toggle-on-border: none;

  &[data-state='on'] svg {
    fill: currentColor;
  }
`;
