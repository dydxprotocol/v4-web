import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonStyle } from '@/constants/buttons';

import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import {
  favoriteMarket,
  favoriteSpotToken,
  unfavoriteMarket,
  unfavoriteSpotToken,
} from '@/state/appUiConfigs';
import { getIsMarketFavorited, getIsSpotTokenFavorited } from '@/state/appUiConfigsSelectors';

import { track } from '@/lib/analytics/analytics';

export const FavoriteButton = ({
  className,
  marketId,
  variant = 'perp',
}: {
  className?: string;
  marketId: string;
  variant?: 'perp' | 'spot';
}) => {
  const dispatch = useDispatch();
  const isSpotFavorited = useAppSelectorWithArgs(getIsSpotTokenFavorited, marketId);
  const isPerpFavorited = useAppSelectorWithArgs(getIsMarketFavorited, marketId);
  const isMarketFavorited = variant === 'spot' ? isSpotFavorited : isPerpFavorited;

  const onToggle = (newIsFavorited: boolean) => {
    if (newIsFavorited) {
      if (variant === 'spot') {
        dispatch(favoriteSpotToken(marketId));
      } else {
        dispatch(favoriteMarket(marketId));
        track(AnalyticsEvents.FavoriteMarket({ marketId }));
      }
    } else {
      if (variant === 'spot') {
        dispatch(unfavoriteSpotToken(marketId));
      } else {
        dispatch(unfavoriteMarket(marketId));
        track(AnalyticsEvents.UnfavoriteMarket({ marketId }));
      }
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
