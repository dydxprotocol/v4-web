import { useMemo } from 'react';

import { useToBlob, useToPng } from '@hugocxl/react-to-image';
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
import { triggerTwitterIntent } from '@/lib/twitter';

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

  const [{ isLoading: isDownloading }, convert, ref] = useToPng<HTMLDivElement>({
    quality: 1.0,
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.download = `${marketId}-share.png`;
      link.href = data;
      link.click();

      dispatch(closeDialog());
    },
  });

  const [{ isLoading: isSharing }, convertShare, refShare] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: async (blob) => {
      if (!blob) {
        return;
      }

      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);

      triggerTwitterIntent({
        text: `Check out my ${assetId} position on @dYdX\n\n#dYdX #${assetId}\n[paste image and delete this!]`,
        related: 'dYdX',
      });

      dispatch(closeDialog());
    },
  });

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
      <$SharableCard
        ref={(domNode) => {
          if (domNode) {
            ref(domNode);
            refShare(domNode);
          }
        }}
      >
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
            slotLeft={
              !unrealizedPnlIsNegative ? (
                <$ArrowUpIcon iconName={IconName.Arrow} />
              ) : (
                <$ArrowDownIcon iconName={IconName.Arrow} />
              )
            }
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
            value={import.meta.env.VITE_SHARE_PNL_ANALYTICS_URL}
          />
        </$SharableCardStats>
      </$SharableCard>

      <$Actions>
        <$Action
          action={ButtonAction.Secondary}
          slotLeft={<Icon iconName={IconName.Download} />}
          onClick={() => {
            convert();
          }}
          state={{
            isLoading: isDownloading,
          }}
        >
          {stringGetter({ key: STRING_KEYS.DOWNLOAD })}
        </$Action>
        <$Action
          action={ButtonAction.Primary}
          slotLeft={<Icon iconName={IconName.SocialX} />}
          onClick={() => {
            convertShare();
          }}
          state={{
            isLoading: isSharing,
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

const $ArrowUpIcon = styled(Icon)<{ negative?: boolean }>`
  transform: rotateZ(-90deg);
`;

const $ArrowDownIcon = styled(Icon)<{ negative?: boolean }>`
  transform: rotateZ(90deg);
`;
