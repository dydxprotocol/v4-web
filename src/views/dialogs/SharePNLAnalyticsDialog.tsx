import { useMemo } from 'react';

import styled from 'styled-components';

import { AbacusPositionSides, Nullable } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { PositionSide } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LogoShortIcon } from '@/icons';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { QrCode } from '@/components/QrCode';
import { Tag, TagSign } from '@/components/Tag';

import { useAppDispatch } from '@/state/appTypes';
import { closeDialog } from '@/state/dialogs';

import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  marketId: string;
  assetId: string;
  leverage: Nullable<number>;
  oraclePrice: Nullable<number>;
  entryPrice: Nullable<number>;
  unrealizedPnlPercent: Nullable<number>;
  side: Nullable<AbacusPositionSides>;
  sideLabel: Nullable<string>;
  setIsOpen: (open: boolean) => void;
};

export const SharePNLAnalyticsDialog = ({
  marketId,
  assetId,
  side,
  sideLabel,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnlPercent,
  setIsOpen,
}: ElementProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const sideSign = useMemo(() => {
    switch (side?.name) {
      case PositionSide.Long:
        return TagSign.Positive;
      case PositionSide.Short:
        return TagSign.Negative;
      default:
        return TagSign.Neutral;
    }
  }, [side]);

  const unrealizedPnlIsNegative = MustBigNumber(unrealizedPnlPercent).isNegative();

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.SHARE_ACTIVITY })}>
      <$SharableCard>
        <$SharableCardSide>
          <$SharableCardTitle>
            <$AssetIcon symbol={assetId} />

            {marketId}

            <Tag sign={sideSign}>{sideLabel}</Tag>
          </$SharableCardTitle>

          <$HighlightOutput
            isNegative={unrealizedPnlIsNegative}
            type={OutputType.Percent}
            value={unrealizedPnlPercent}
            showSign={ShowSign.None}
            slotLeft={<$ArrowIcon isNegative={unrealizedPnlIsNegative} iconName={IconName.Arrow} />}
          />
          <LogoShortIcon />
        </$SharableCardSide>

        <$SharableCardStats>
          <$SharableCardStat>
            {stringGetter({ key: STRING_KEYS.ENTRY })}:{' '}
            <Output type={OutputType.Fiat} value={entryPrice} withSubscript />
          </$SharableCardStat>
          <$SharableCardStat>
            {stringGetter({ key: STRING_KEYS.INDEX })}:{' '}
            <Output type={OutputType.Fiat} value={oraclePrice} withSubscript />
          </$SharableCardStat>
          <$SharableCardStat>
            {stringGetter({ key: STRING_KEYS.LEVERAGE })}:{' '}
            <Output type={OutputType.Multiple} value={leverage} showSign={ShowSign.None} />
          </$SharableCardStat>

          <$QrCode
            size={128}
            options={{
              margin: 0,
              backgroundOptions: {
                color: 'transparent',
              },
            }}
            value="https://dydx.trade"
          />
        </$SharableCardStats>
      </$SharableCard>

      <$Actions>
        <$Action
          action={ButtonAction.Secondary}
          slotLeft={<Icon iconName={IconName.Download} />}
          onClick={() => {
            dispatch(closeDialog());
          }}
        >
          {stringGetter({ key: STRING_KEYS.DOWNLOAD })}
        </$Action>
        <$Action
          action={ButtonAction.Primary}
          slotLeft={<Icon iconName={IconName.SocialX} />}
          onClick={() => {
            dispatch(closeDialog());
          }}
        >
          {stringGetter({ key: STRING_KEYS.SHARE })}
        </$Action>
      </$Actions>
    </Dialog>
  );
};

const $Actions = styled.div`
  display: flex;
  gap: 1rem;
`;

const $Action = styled(Button)`
  flex: 1;
`;

const $SharableCard = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
`;

const $SharableCardSide = styled.div`
  ${layoutMixins.column}
  gap: 1rem;
`;

const $SharableCardTitle = styled.div`
  ${layoutMixins.row};
  gap: 0.5rem;
`;

const $SharableCardStats = styled.div`
  ${layoutMixins.column};
  gap: 0.5rem;
`;

const $SharableCardStat = styled.div`
  ${layoutMixins.row};
  gap: 0.5rem;
`;

const $AssetIcon = styled(AssetIcon)`
  height: 2rem;
`;

const $QrCode = styled(QrCode)`
  margin-top: 2rem;

  svg {
    border: none;
  }
`;

const $HighlightOutput = styled(Output)<{ isNegative?: boolean }>`
  color: var(--output-sign-color);
  --secondary-item-color: currentColor;
  --output-sign-color: ${({ isNegative }) =>
    isNegative !== undefined
      ? isNegative
        ? `var(--color-negative)`
        : `var(--color-positive)`
      : `var(--color-text-1)`};
`;

const $ArrowIcon = styled(Icon)<{ isNegative?: boolean }>`
  transform: ${({ isNegative }) => (isNegative ? 'rotateZ(90deg)' : 'rotateZ(-90deg)')};
`;
