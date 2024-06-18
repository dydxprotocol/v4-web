import { useMemo } from 'react';

import { useToBlob } from '@hugocxl/react-to-image';
import styled from 'styled-components';

import { AbacusPositionSides, Nullable } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { PositionSide } from '@/constants/trade';

import { useStringGetter } from '@/hooks/useStringGetter';

import { LogoIcon } from '@/icons/logo';
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

const copyBlobToClipboard = async (blob: Blob | null) => {
  if (!blob) {
    return;
  }

  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
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

  const [{ isLoading: isCopying }, convert, ref] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: copyBlobToClipboard,
  });

  const [{ isLoading: isSharing }, convertShare, refShare] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: async (blob) => {
      await copyBlobToClipboard(blob);

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

  const [assetLeft, assetRight] = marketId.split('-');

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={stringGetter({ key: STRING_KEYS.SHARE_ACTIVITY })}>
      <$ShareableCard
        ref={(domNode) => {
          if (domNode) {
            ref(domNode);
            refShare(domNode);
          }
        }}
      >
        <$ShareableCardSide>
          <$ShareableCardTitle>
            <$AssetIcon symbol={assetId} />

            <span>
              <$ShareableCardTitleAsset>{assetLeft}</$ShareableCardTitleAsset>/{assetRight}
            </span>

            <Tag sign={sideSign}>{sideLabel}</Tag>
          </$ShareableCardTitle>

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

          <$Logo />
        </$ShareableCardSide>

        <div>
          <$ShareableCardStats>
            <$ShareableCardStatLabel>
              {stringGetter({ key: STRING_KEYS.ENTRY })}
            </$ShareableCardStatLabel>
            <$ShareableCardStatOutput type={OutputType.Fiat} value={entryPrice} withSubscript />

            <$ShareableCardStatLabel>
              {stringGetter({ key: STRING_KEYS.INDEX })}
            </$ShareableCardStatLabel>
            <$ShareableCardStatOutput type={OutputType.Fiat} value={oraclePrice} withSubscript />

            <$ShareableCardStatLabel>
              {stringGetter({ key: STRING_KEYS.LEVERAGE })}
            </$ShareableCardStatLabel>

            <$ShareableCardStatOutput
              type={OutputType.Multiple}
              value={leverage}
              showSign={ShowSign.None}
            />
          </$ShareableCardStats>

          <$QrCode
            size={68}
            options={{
              margin: 0,
              backgroundOptions: {
                color: 'var(--color-layer-3)',
              },
              imageOptions: {
                margin: 0,
              },
            }}
            value={import.meta.env.VITE_SHARE_PNL_ANALYTICS_URL}
          />
        </div>
      </$ShareableCard>

      <$Actions>
        <$Action
          action={ButtonAction.Secondary}
          slotLeft={<Icon iconName={IconName.Copy} />}
          onClick={() => {
            convert();
          }}
          state={{
            isLoading: isCopying,
          }}
        >
          {stringGetter({ key: STRING_KEYS.COPY })}
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

const $ShareableCard = styled.div`
  ${layoutMixins.row}
  gap: 0.5rem;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  background-color: var(--color-layer-4);
  padding: 1.75rem 1.25rem 1.25rem 1.25rem;
  border-radius: 0.5rem;
`;

const $ShareableCardSide = styled.div`
  ${layoutMixins.flexColumn}
  height: 100%;
`;

const $ShareableCardTitle = styled.div`
  ${layoutMixins.row};
  gap: 0.5rem;
  font-weight: var(--fontWeight-medium);
  margin-bottom: 0.75rem;
`;

const $ShareableCardTitleAsset = styled.span`
  color: var(--color-white);
`;

const $ShareableCardStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.125rem;
  row-gap: 0.5rem;
`;

const $ShareableCardStatLabel = styled.div`
  font: var(--font-base-medium);
  text-align: right;
`;

const $ShareableCardStatOutput = styled(Output)`
  font: var(--font-base-medium);
  color: var(--color-text-2);

  * {
    color: var(--color-text-2);
  }
`;

const $AssetIcon = styled(AssetIcon)`
  height: 1.625rem;
`;

const $QrCode = styled(QrCode)`
  width: 5.25rem;
  height: 5.25rem;
  margin-top: 1rem;
  margin-left: auto;

  svg {
    border: none;
  }
`;

const $HighlightOutput = styled(Output)<{ isNegative?: boolean }>`
  font-size: 2.25rem;
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
  font-size: 1.5rem;
  margin-right: 0.5rem;
  transform: rotateZ(-90deg);
`;

const $ArrowDownIcon = styled(Icon)<{ negative?: boolean }>`
  font-size: 1.5rem;
  margin-right: 0.5rem;
  transform: rotateZ(90deg);
`;

const $Logo = styled(LogoIcon)`
  width: 5.125rem;
  margin-top: auto;
  height: auto;
`;
