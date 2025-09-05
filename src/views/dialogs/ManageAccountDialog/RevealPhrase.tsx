import { useEffect, useRef, useState } from 'react';

import { logBonsaiError, logTurnkey } from '@/bonsai/logs';
import { TurnkeyIframeClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';

import { AlertType } from '@/constants/alerts';
import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { AccentTag } from '@/components/Tag';

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

  const iframeContainerRef = useRef<HTMLDivElement | null>(null);
  const [iframeClient, setIframeClient] = useState<TurnkeyIframeClient | null>(null);
  const [injectResponse, setInjectResponse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { turnkey, indexedDbClient } = useTurnkey();
  const { primaryTurnkeyWallet, targetPublicKeys, turnkeyUser } = useTurnkeyWallet();
  const { hdKey } = useAccounts();

  const initIframe = async () => {
    logTurnkey('initIframe', 'initIframe');

    if (iframeContainerRef.current) {
      const iframeContainer = iframeContainerRef.current;
      const exportIframeClient = await turnkey?.iframeClient({
        iframeContainer,
        iframeUrl: 'https://export.turnkey.com',
      });

      logTurnkey('initIframe', 'exportIframeClient', exportIframeClient);

      if (exportIframeClient) {
        setIframeClient(exportIframeClient);
      }
    }
  };

  const getTurnkeySecretPhrase = async () => {
    try {
      setLoading(true);
      if (!indexedDbClient) {
        throw new Error('No indexed db client');
      }

      if (!primaryTurnkeyWallet?.walletId || !targetPublicKeys?.publicKey) {
        throw new Error('No primary turnkey wallet or target public key');
      }

      if (!iframeClient) {
        throw new Error('No iframe client');
      }

      if (!turnkeyUser) {
        throw new Error('No turnkey user');
      }

      const walletExportBundle = await indexedDbClient.exportWallet({
        walletId: primaryTurnkeyWallet.walletId,
        targetPublicKey: targetPublicKeys.publicKey,
      });

      logTurnkey('getTurnkeySecretPhrase', 'walletExportBundle', walletExportBundle);

      if (walletExportBundle.exportBundle) {
        const session = await turnkey?.getSession();

        const response = await iframeClient.injectWalletExportBundle(
          walletExportBundle.exportBundle,
          `${session?.organizationId}`
        );

        setInjectResponse(response);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      logBonsaiError('getTurnkeySecretPhrase', 'Error getting turnkey secret phrase', { error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logTurnkey('side-effect', 'turnkey', iframeContainerRef.current);
    if (turnkey) {
      if (iframeContainerRef.current) {
        initIframe();
      }

      // Create a MutationObserver to watch for changes in the DOM
      const observer = new MutationObserver(() => {
        // If the iframe container is found, initialize the iframe and stop observing
        logTurnkey(
          'observer',
          'iframeContainerRef is found, initialize iFrame',
          iframeContainerRef.current
        );
        if (iframeContainerRef.current) {
          initIframe();
          observer.disconnect();
        }
      });

      // If the iframe container is not yet available, start observing the DOM
      if (!iframeContainerRef.current) {
        logTurnkey('observer', 'iframeContainerRef.current is null');
        observer.observe(document.body, { childList: true, subtree: true });
      }

      // Cleanup function to disconnect the observer when the dialog is closed
      return () => observer.disconnect();
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnkey]);

  const phrase = exportWalletType === 'dydx' ? <span>{hdKey?.mnemonic}</span> : null;

  const copyButton = (
    <CopyButton
      buttonType="icon"
      buttonStyle={ButtonStyle.WithoutBackground}
      tw="ml-auto text-color-accent"
      value="hihihi"
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

        <div tw="row rounded-0.75 border border-solid border-color-layer-5 bg-color-layer-2 p-0.75 text-color-text-1">
          {loading && <LoadingSpace />}

          {phrase}
          <div ref={iframeContainerRef} />
          {exportWalletType === 'dydx' && copyButton}
        </div>
      </div>

      <AlertMessage withAccentText type={AlertType.Error} tw="rounded-0.375">
        {errorMessage ??
          'Your recovery key can grant anyone to access your funds. Save it in a secure, private location.'}
      </AlertMessage>

      <Button onClick={injectResponse ? closeDialog : getTurnkeySecretPhrase}>
        {injectResponse
          ? stringGetter({ key: STRING_KEYS.CLOSE })
          : stringGetter({ key: STRING_KEYS.EXPORT_PHRASE })}
      </Button>
    </div>
  );
};
