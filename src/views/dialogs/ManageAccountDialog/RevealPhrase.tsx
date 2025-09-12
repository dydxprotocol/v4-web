import { useCallback, useEffect, useMemo, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { useQuery } from '@tanstack/react-query';
import type { TurnkeyIframeClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';

import { AlertType } from '@/constants/alerts';
import { ButtonStyle } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useAppThemeAndColorModeContext } from '@/hooks/useAppThemeAndColorMode';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { AccentTag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { getSourceAccount } from '@/state/walletSelectors';

type ExportWalletType = 'turnkey' | 'dydx';

// TODO(turnkey): Localization
export const RevealPhrase = ({
  closeDialog,
  exportWalletType,
  onBack,
}: {
  closeDialog: () => void;
  exportWalletType: ExportWalletType;
  onBack: () => void;
}) => {
  const dispatch = useAppDispatch();
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

  const sessionQuery = useQuery({
    queryKey: ['turnkeySession'],
    queryFn: async () => {
      const session = await turnkey!.getSession();

      if (session == null) {
        return {
          session: null,
          error: 'No session',
        };
      }

      if (session.expiry > Math.floor(Date.now() / 1000)) {
        return {
          session,
        };
      }

      setErrorMessage('Session expired. Please disconnect and login again to reveal your phrase.');

      return {
        session: null,
        error: 'Session expired',
      };
    },
    enabled: !!turnkey,
  });

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

  useEffect(() => {
    if (!exportIframeClient) {
      initIframe();
    }
  }, [initIframe, exportIframeClient]);

  const exportWallet = useCallback(async () => {
    try {
      setLoading(true);

      if (!indexedDbClient) {
        throw new Error('No indexed db client');
      }

      if (!exportIframeClient) {
        throw new Error('No export iframe client');
      }

      if (!primaryTurnkeyWallet) {
        throw new Error('No primary turnkey wallet');
      }

      if (!primaryTurnkeyWallet.accounts[0]?.organizationId) {
        throw new Error('No organization id');
      }

      const whoami = await indexedDbClient.getWhoami({
        organizationId: primaryTurnkeyWallet.accounts[0].organizationId,
      });

      const exportResponse = await indexedDbClient.exportWallet({
        organizationId: whoami.organizationId,
        walletId: primaryTurnkeyWallet.walletId,
        targetPublicKey: exportIframeClient!.iframePublicKey!,
      });

      setIsIframeVisible(true);

      await exportIframeClient.injectWalletExportBundle(
        exportResponse.exportBundle,
        whoami.organizationId
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG })
      );
      logBonsaiError('exportWallet', 'error', { error });
    } finally {
      setLoading(false);
    }
  }, [primaryTurnkeyWallet, indexedDbClient, exportIframeClient, stringGetter]);

  const ctaButton = useMemo(() => {
    const walletInfo = sourceAccount.walletInfo;
    if (
      exportWalletType === 'turnkey' &&
      walletInfo?.connectorType === ConnectorType.Turnkey &&
      !isIframeVisible
    ) {
      if (sessionQuery.data && sessionQuery.data.session) {
        return (
          <Button
            state={{ isLoading: !exportIframeClient || sessionQuery.isLoading }}
            onClick={exportWallet}
          >
            {stringGetter({ key: STRING_KEYS.EXPORT_PHRASE })}
          </Button>
        );
      }

      return (
        <Button
          onClick={() => {
            closeDialog();
            dispatch(openDialog(DialogTypes.DisconnectWallet({})));
          }}
        >
          {stringGetter({ key: STRING_KEYS.DISCONNECT })}
        </Button>
      );
    }

    if (exportWalletType === 'dydx') {
      return (
        <ToggleButton
          tw="[& svg]:w-auto"
          isPressed={showPhrase}
          onPressedChange={setShowPhrase}
          slotLeft={<Icon iconName={!showPhrase ? IconName.Show : IconName.Hide} />}
        >
          {stringGetter({
            key: !showPhrase ? STRING_KEYS.SHOW_PHRASE : STRING_KEYS.HIDE_PHRASE,
          })}
        </ToggleButton>
      );
    }

    return <Button onClick={onBack}>{stringGetter({ key: STRING_KEYS.CLOSE })}</Button>;
  }, [
    sourceAccount.walletInfo,
    exportWalletType,
    isIframeVisible,
    closeDialog,
    stringGetter,
    sessionQuery.data,
    sessionQuery.isLoading,
    exportIframeClient,
    exportWallet,
    dispatch,
    showPhrase,
    onBack,
  ]);

  const phrase = exportWalletType === 'dydx' ? hdKey?.mnemonic : undefined;
  const theme = useAppThemeAndColorModeContext();

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

        <div tw="row relative justify-center overflow-hidden rounded-0.75 border border-solid border-color-layer-5 bg-color-layer-2 p-0.75 text-color-text-1">
          {loading && <LoadingSpace tw="absolute inset-0" />}
          {exportWalletType === 'turnkey' && (
            <>
              <div
                id={TurnkeyExportIframeContainerId}
                style={{
                  display: isIframeVisible ? 'block' : 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  position: 'absolute',
                  inset: 0,
                  color: theme.textSecondary,
                  backgroundColor: theme.layer2,
                }}
              />

              <span
                tw="font-small-book"
                css={{
                  opacity: !isIframeVisible && !loading ? 1 : 0,
                }}
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={idx}>{'***** '}</span>
                ))}
              </span>
            </>
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

      {ctaButton}
    </div>
  );
};
