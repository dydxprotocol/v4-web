import { useCallback, useMemo, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import type { TurnkeyIframeClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';

import { AlertType } from '@/constants/alerts';
import { ButtonSize, ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { AccentTag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';

import { useAppSelector } from '@/state/appTypes';
import { getSourceAccount } from '@/state/walletSelectors';

type ExportWalletType = 'turnkey' | 'dydx';

// TODO(turnkey): Localization
export const RevealPhrase = ({
  closeDialog,
  exportWalletType,
}: {
  closeDialog: () => void;
  exportWalletType: ExportWalletType;
}) => {
  const stringGetter = useStringGetter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPhrase, setShowPhrase] = useState(false);
  const { turnkey, indexedDbClient } = useTurnkey();
  const { primaryTurnkeyWallet } = useTurnkeyWallet();
  const { hdKey } = useAccounts();
  const sourceAccount = useAppSelector(getSourceAccount);

  const [exportIframeClient, setExportIframeClient] = useState<TurnkeyIframeClient | null>(null);
  const [isIframeVisible, setIsIframeVisible] = useState(false);
  const TurnkeyExportIframeContainerId = 'turnkey-export-iframe-container-id';
  const TurnkeyIframeElementId = 'turnkey-default-iframe-element-id';

  const initIframe = useCallback(async () => {
    // Wait for the modal and its content to render
    requestAnimationFrame(async () => {
      const iframeContainer = document.getElementById(TurnkeyExportIframeContainerId);
      if (!iframeContainer) {
        throw new Error('Iframe container not found.');
      }

      const existingIframe = document.getElementById(TurnkeyIframeElementId);

      if (!existingIframe) {
        try {
          const newExportIframeClient = await turnkey?.iframeClient({
            iframeContainer: document.getElementById(TurnkeyExportIframeContainerId),
            iframeUrl: 'https://export.turnkey.com',
          });
          setExportIframeClient(newExportIframeClient!);
        } catch (error) {
          logBonsaiError('initIframe', 'error initializing turnkey export iframe', { error });
        }
      }
    });
  }, [turnkey, setExportIframeClient]);

  const exportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (!primaryTurnkeyWallet) {
        throw new Error('No primary turnkey wallet');
      }

      const whoami = await indexedDbClient!.getWhoami();

      const exportResponse = await indexedDbClient?.exportWallet({
        organizationId: whoami.organizationId,
        walletId: primaryTurnkeyWallet.walletId,
        targetPublicKey: exportIframeClient!.iframePublicKey!,
      });

      if (!exportResponse?.exportBundle) {
        throw new Error('Failed to retrieve export bundle');
      }

      await exportIframeClient?.injectWalletExportBundle(
        exportResponse.exportBundle,
        whoami.organizationId
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [primaryTurnkeyWallet, indexedDbClient, exportIframeClient]);

  const handleExport = useCallback(async () => {
    try {
      await initIframe();
      await exportWallet();
      setIsIframeVisible(true);
    } catch (error) {
      logBonsaiError('handleExport', 'error', { error });
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [initIframe, exportWallet, setIsIframeVisible]);

  const ctaButton = useMemo(() => {
    const walletInfo = sourceAccount.walletInfo;
    if (exportWalletType === 'turnkey' && walletInfo?.connectorType === ConnectorType.Turnkey) {
      return (
        <Button onClick={handleExport}>{stringGetter({ key: STRING_KEYS.EXPORT_PHRASE })}</Button>
      );
    }

    return <Button onClick={closeDialog}>{stringGetter({ key: STRING_KEYS.CLOSE })}</Button>;
  }, [sourceAccount.walletInfo, exportWalletType, closeDialog, stringGetter, handleExport]);

  const phrase = exportWalletType === 'dydx' ? hdKey?.mnemonic : undefined;

  const copyButton = phrase && (
    <CopyButton
      buttonType="icon"
      buttonStyle={ButtonStyle.WithoutBackground}
      tw="ml-auto text-color-accent"
      value={phrase}
    />
  );

  return (
    <div tw="flexColumn gap-1">
      <div tw="flexColumn gap-0.5">
        <span tw="row gap-0.25">
          <AccentTag tw="rounded-[360px] px-0.5 py-0.25 font-tiny-bold">
            {exportWalletType === 'turnkey' ? 'Turnkey' : 'dYdX'}
          </AccentTag>
          Secret Recovery Phrase
        </span>

        <div tw="row justify-center rounded-0.75 border border-solid border-color-layer-5 bg-color-layer-2 p-0.75 text-color-text-1">
          {loading && <LoadingSpace />}
          {exportWalletType === 'turnkey' && (
            <div
              id={TurnkeyExportIframeContainerId}
              style={{
                display: isIframeVisible ? 'block' : 'none',
                backgroundColor: 'var(--bg-color-layer-2)',
                color: 'var(--text-color-text-1)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          )}

          {exportWalletType === 'dydx' && (
            <span tw="font-small-book">
              {phrase
                ?.split(' ')
                // eslint-disable-next-line react/no-array-index-key
                .map((word, idx) => <span key={idx}>{showPhrase ? `${word} ` : '***** '}</span>)}
            </span>
          )}
          {copyButton}
        </div>
      </div>

      <AlertMessage withAccentText type={AlertType.Error} tw="rounded-0.375">
        {errorMessage ??
          'Your recovery key can grant anyone to access your funds. Save it in a secure, private location.'}
      </AlertMessage>

      {exportWalletType === 'dydx' && (
        <ToggleButton
          size={ButtonSize.Small}
          isPressed={showPhrase}
          onPressedChange={setShowPhrase}
          slotLeft={<Icon iconName={!showPhrase ? IconName.Show : IconName.Hide} />}
        >
          {stringGetter({
            key: !showPhrase ? STRING_KEYS.SHOW_PHRASE : STRING_KEYS.HIDE_PHRASE,
          })}
        </ToggleButton>
      )}

      {ctaButton}
    </div>
  );
};
