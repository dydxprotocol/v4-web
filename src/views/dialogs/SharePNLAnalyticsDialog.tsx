import { useEffect, useMemo, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { useToBlob } from '@hugocxl/react-to-image';
import styled from 'styled-components';
import tw from 'twin.macro';

import { AnalyticsEvents } from '@/constants/analytics';
import { ASSET_ICON_MAP } from '@/constants/assets';
import { ButtonAction } from '@/constants/buttons';
import { DialogProps, SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useCustomNotification } from '@/hooks/useCustomNotification';
import { useAppSelectorWithArgs } from '@/hooks/useParameterizedSelector';
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

import { track } from '@/lib/analytics/analytics';
import { getDisplayableAssetFromBaseAsset, isAssetIconMapKey } from '@/lib/assetUtils';
import { MustBigNumber } from '@/lib/numbers';
import { triggerTwitterIntent } from '@/lib/twitter';

const copyBlobToClipboard = async (blob: Blob | null) => {
  if (!blob) {
    return;
  }

  try {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy blob. ', error);
    throw error;
  }
};

export const SharePNLAnalyticsDialog = ({
  marketId,
  assetId,
  side,
  sideLabel,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  setIsOpen,
}: DialogProps<SharePNLAnalyticsDialogProps>) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const logoUrl = useAppSelectorWithArgs(BonsaiHelpers.assets.selectAssetLogo, assetId);

  const symbol = getDisplayableAssetFromBaseAsset(assetId);

  const notify = useCustomNotification();
  const [isCopied, setIsCopied] = useState(false);

  const [{ isLoading: isCopying }, convert, ref] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: async (blob) => {
      await copyBlobToClipboard(blob);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    },
    onError: (error) => {
      logBonsaiError('SharePNLAnalyticsDialog', 'Failed to copy blob. ', { error });
      notify({
        title: stringGetter({ key: STRING_KEYS.ERROR }),
        body: stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG }),
        slotTitleLeft: <Icon iconName={IconName.Warning} tw="text-color-warning" />,
        toastDuration: 5000,
      });
    },
  });

  const [{ isLoading: isSharing }, convertShare, refShare] = useToBlob<HTMLDivElement>({
    quality: 1.0,
    onSuccess: async (blob) => {
      await copyBlobToClipboard(blob);

      triggerTwitterIntent({
        text: `${stringGetter({
          key: STRING_KEYS.TWEET_MARKET_POSITION,
          params: {
            MARKET: symbol,
          },
        })}\n\n#dYdX #${symbol}\n[${stringGetter({ key: STRING_KEYS.TWEET_PASTE_IMAGE_AND_DELETE_THIS })}]`,
        related: 'dYdX',
      });

      dispatch(closeDialog());
    },
  });

  const sideSign = useMemo(() => {
    switch (side) {
      case IndexerPositionSide.LONG:
        return TagSign.Positive;
      case IndexerPositionSide.SHORT:
        return TagSign.Negative;
      default:
        return TagSign.Neutral;
    }
  }, [side]);

  const unrealizedPnlIsNegative = MustBigNumber(unrealizedPnl).isNegative();

  const [assetLeft, assetRight] = marketId.split('-');

  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const localLogoUrl = useMemo(() => {
    if (assetId && isAssetIconMapKey(assetId)) return ASSET_ICON_MAP[assetId];
    return logoUrl;
  }, [logoUrl, assetId]);

  useEffect(() => {
    if (!logoUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 26;
      canvas.height = img.height || 26;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      setLogoBase64(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      logBonsaiError('SharePNLAnalyticsDialog', 'Failed to load asset image. ', logoUrl);
      setLogoBase64(null);
    };
  }, [logoUrl]);

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
        <div tw="flexColumn h-full">
          <div tw="row mb-0.75 gap-0.5">
            <AssetIcon
              logoUrl={logoBase64 ?? localLogoUrl}
              symbol={assetId}
              tw="[--asset-icon-size:1.625rem]"
            />

            <span>
              <span tw="text-color-text-2 font-base-bold">{assetLeft}</span>/{assetRight}
            </span>

            <Tag sign={sideSign}>{sideLabel}</Tag>
          </div>

          <$HighlightOutput
            isNegative={unrealizedPnlIsNegative}
            type={OutputType.CompactFiat}
            value={unrealizedPnl}
            showSign={ShowSign.Both}
          />

          <LogoIcon tw="mt-auto h-auto w-[5.125rem]" />
        </div>

        <div tw="grid">
          <div tw="grid grid-cols-[repeat(2,1fr)] gap-[1.125rem] gap-y-0.5">
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
          </div>

          <div tw="w-full text-right">
            {import.meta.env.VITE_SHARE_PNL_ANALYTICS_URL ? (
              <$QrCode
                tw="rounded-0.25 bg-color-layer-3"
                size={68}
                value={import.meta.env.VITE_SHARE_PNL_ANALYTICS_URL}
                options={{
                  cells: {
                    fill: 'var(--color-text-2)',
                  },
                  finder: {
                    fill: 'var(--color-text-2)',
                  },
                }}
              />
            ) : (
              <div tw="mt-1 size-[68px]" />
            )}
          </div>
        </div>
      </$ShareableCard>

      <div tw="flex gap-1">
        <$Action
          action={ButtonAction.Secondary}
          slotLeft={<Icon iconName={isCopied ? IconName.Check : IconName.Copy} />}
          onClick={() => {
            track(AnalyticsEvents.SharePnlCopied({ asset: assetId }));
            convert();
          }}
          state={{
            isLoading: isCopying,
          }}
        >
          {stringGetter({ key: isCopied ? STRING_KEYS.COPIED : STRING_KEYS.COPY })}
        </$Action>
        <$Action
          action={ButtonAction.Primary}
          slotLeft={<Icon iconName={IconName.SocialX} />}
          onClick={() => {
            track(AnalyticsEvents.SharePnlShared({ asset: assetId }));
            convertShare();
          }}
          state={{
            isLoading: isSharing,
          }}
        >
          {stringGetter({ key: STRING_KEYS.SHARE })}
        </$Action>
      </div>
    </Dialog>
  );
};
const $Action = tw(Button)`flex-1`;

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
const $ShareableCardStatLabel = tw.div`text-right text-color-text-0 font-base-bold`;

const $ShareableCardStatOutput = tw(Output)`font-base-bold text-color-text-2`;
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
  font-weight: var(--fontWeight-bold);

  color: var(--output-sign-color);
  --secondary-item-color: currentColor;
  --output-sign-color: ${({ isNegative }) =>
    isNegative !== undefined
      ? isNegative
        ? `var(--color-negative)`
        : `var(--color-positive)`
      : `var(--color-text-1)`};
`;
