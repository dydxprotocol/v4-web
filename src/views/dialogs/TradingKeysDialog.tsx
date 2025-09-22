/* eslint-disable react/prop-types,react/no-unstable-nested-components */
// above lint rules are being incorrectly applied to unionize match() usages
import { useState } from 'react';

import { parseTransactionError } from '@/bonsai/lib/extractErrors';
import { tradingKeyUtils } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';
import tw from 'twin.macro';
import unionize, { ofType, UnionOf } from 'unionize';

import { AlertType } from '@/constants/alerts';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonShape, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { DialogProps, TradingKeysDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useSubaccount } from '@/hooks/useSubaccount';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { CopyButton } from '@/components/CopyButton';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

import { track } from '@/lib/analytics/analytics';
import { stringifyTransactionError } from '@/lib/errors';
import { truncateAddress } from '@/lib/wallet';

import { AuthorizedAccountInfo, TradingKeysTable } from '../tables/TradingKeysTable';

type WalletMetadata = Awaited<ReturnType<(typeof tradingKeyUtils)['createNewRandomDydxWallet']>>;

const TradingKeyStates = unionize(
  {
    Main: ofType<{}>(),
    Delete: ofType<{ info: AuthorizedAccountInfo; loading?: boolean; errorStringKey?: string }>(),
    Create: ofType<{
      wallet: WalletMetadata;
      acknowledged?: boolean;
      loading?: boolean;
      errorStringKey?: string;
    }>(),
  },
  { tag: 'type' as const, value: 'payload' as const }
);
type TradingKeyState = UnionOf<typeof TradingKeyStates>;

export const TradingKeysDialog = ({ setIsOpen }: DialogProps<TradingKeysDialogProps>) => {
  const stringGetter = useStringGetter();
  const { isMobile } = useBreakpoints();

  const { dydxAddress } = useAccounts();
  const { createRandomTradingKeyWallet, removeAuthorizedKey, authorizeTradingKeyWallet } =
    useSubaccount();

  const [pageState, setPageState] = useState<TradingKeyState>(TradingKeyStates.Main());

  const goToCreatePage = async () => {
    const wallet = await createRandomTradingKeyWallet();
    setPageState(TradingKeyStates.Create({ wallet }));
  };
  const goToRemovePage = (info: AuthorizedAccountInfo) => {
    setPageState(TradingKeyStates.Delete({ info }));
  };
  const goToMainPage = () => setPageState(TradingKeyStates.Main());

  const executeRemoveKey = async () => {
    if (pageState.type !== 'Delete') {
      return;
    }
    const id = pageState.payload.info.id;
    setPageState(
      TradingKeyStates.Delete({ ...pageState.payload, errorStringKey: undefined, loading: true })
    );
    try {
      await removeAuthorizedKey(id);
      goToMainPage();
    } catch (error) {
      const errorString = stringifyTransactionError(error);
      const parsed = parseTransactionError('removeAuthorizedKey', errorString);
      const key = parsed?.stringKey ?? STRING_KEYS.UNKNOWN_ERROR;
      setPageState(
        TradingKeyStates.Delete({ ...pageState.payload, errorStringKey: key, loading: false })
      );
    }
  };

  const authorizeKey = async () => {
    if (pageState.type !== 'Create') {
      return;
    }
    const wallet = pageState.payload.wallet;
    if (wallet == null) {
      return;
    }
    setPageState(
      TradingKeyStates.Create({ ...pageState.payload, errorStringKey: undefined, loading: true })
    );
    track(AnalyticsEvents.TradingApiKeyGenerated({}));
    try {
      await authorizeTradingKeyWallet(wallet);
      goToMainPage();
    } catch (error) {
      const errorString = stringifyTransactionError(error);
      const parsed = parseTransactionError('addAuthorizedKey', errorString);
      const key = parsed?.stringKey ?? STRING_KEYS.UNKNOWN_ERROR;
      setPageState(
        TradingKeyStates.Create({ ...pageState.payload, errorStringKey: key, loading: false })
      );
    }
  };

  const setCreateAcknowledged = (checked: boolean) => {
    if (pageState.type !== 'Create') {
      return;
    }
    setPageState(TradingKeyStates.Create({ ...pageState.payload, acknowledged: checked }));
  };

  const dialogContent = TradingKeyStates.match(pageState, {
    Main: () => (
      <div>
        <div tw="mb-1 text-color-text-0 font-base-book">
          {stringGetter({ key: STRING_KEYS.API_WALLETS_DESCRIPTION })}
        </div>
        <div tw="row mb-1 w-full gap-0.75">
          <div tw="row w-full rounded-0.75 bg-color-layer-1 px-1 py-0.75">
            <div tw="flex-1 text-color-text-0 font-small-book">
              {stringGetter({ key: STRING_KEYS.YOUR_DYDX_ADDRESS })}
            </div>
            <div tw="row gap-0.5">
              <$Address>{truncateAddress(dydxAddress)}</$Address>
              <$CopyButton
                buttonType="icon"
                value={dydxAddress}
                shape={ButtonShape.Square}
                size={ButtonSize.XXSmall}
                buttonStyle={ButtonStyle.WithoutBackground}
                action={ButtonAction.Primary}
              />
            </div>
          </div>
          <Button
            size={ButtonSize.Small}
            action={ButtonAction.Primary}
            shape={ButtonShape.Pill}
            onClick={goToCreatePage}
          >
            {stringGetter({ key: STRING_KEYS.GENERATE_NEW_API_KEY })}
          </Button>
        </div>
        <TradingKeysTable onRemoveKey={goToRemovePage} />
      </div>
    ),
    Create: ({ wallet, errorStringKey, loading, acknowledged }) => {
      if (wallet == null) {
        return <div>{stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR })}</div>;
      }
      return (
        <div tw="column gap-1">
          <div tw="text-color-text-0 font-base-book">
            {stringGetter({ key: STRING_KEYS.AUTHORIZE_API_WALLET_DESCRIPTION })}{' '}
            <span tw="text-color-text-2">
              {stringGetter({ key: STRING_KEYS.PRIVATE_KEY_NO_LONGER_ACCESSIBLE })}
            </span>
          </div>
          <div tw="row w-full rounded-0.75 bg-color-layer-1 px-1 py-0.75">
            <div tw="flex-1 text-color-text-0 font-small-book">
              {stringGetter({ key: STRING_KEYS.API_WALLET_ADDRESS })}
            </div>
            <div tw="row gap-0.5">
              <$Address tw="font-small-book">{wallet.address}</$Address>
              <$CopyButton
                buttonType="icon"
                value={wallet.address}
                shape={ButtonShape.Square}
                size={ButtonSize.XXSmall}
                buttonStyle={ButtonStyle.WithoutBackground}
                action={ButtonAction.Primary}
              />
            </div>
          </div>
          <div tw="row w-full rounded-0.75 border-solid border-color-layer-5 p-0.625">
            <div tw="flex-1 text-color-text-0 font-small-book">
              {stringGetter({ key: STRING_KEYS.PRIVATE_KEY })}
            </div>
            <div tw="row gap-0.5">
              <$Address tw="max-w-20 overflow-hidden text-ellipsis font-small-book">
                {wallet.privateKeyHex}
              </$Address>
              <$CopyButton
                buttonType="icon"
                value={wallet.privateKeyHex}
                shape={ButtonShape.Square}
                size={ButtonSize.XXSmall}
                buttonStyle={ButtonStyle.WithoutBackground}
                action={ButtonAction.Primary}
              />
            </div>
          </div>
          <AlertMessage type={AlertType.Error}>
            <Checkbox
              checked={!!acknowledged}
              onCheckedChange={(checked) => setCreateAcknowledged(checked)}
              id="ack-private-key"
              label={
                <span tw="select-none">
                  {stringGetter({ key: STRING_KEYS.API_KEY_AUTHORIZATION_ACKNOWLEDGMENT })}
                </span>
              }
            />
          </AlertMessage>
          {errorStringKey != null && (
            <AlertMessage type={AlertType.Error}>
              {stringGetter({ key: errorStringKey })}
            </AlertMessage>
          )}
          <Button
            tw="flex-1"
            action={ButtonAction.Primary}
            onClick={authorizeKey}
            state={{ isLoading: loading, isDisabled: !!loading || !acknowledged }}
          >
            {stringGetter({ key: STRING_KEYS.AUTHORIZE_API_KEY })}
          </Button>
        </div>
      );
    },
    Delete: ({ info, loading, errorStringKey }) => (
      <div tw="column gap-1">
        <p>
          {stringGetter({
            key: STRING_KEYS.CONFIRM_DELETE_TRADING_KEY,
            params: {
              ADDRESS: <span tw="text-color-text-2">{info.address}</span>,
            },
          })}
        </p>
        {errorStringKey != null && (
          <AlertMessage type={AlertType.Error}>
            {stringGetter({ key: errorStringKey })}
          </AlertMessage>
        )}
        <div tw="row gap-0.5 [justify-content:end]">
          <Button
            action={ButtonAction.Destroy}
            onClick={executeRemoveKey}
            state={{ isLoading: loading, isDisabled: loading }}
          >
            {stringGetter({ key: STRING_KEYS.REMOVE })}
          </Button>
          <Button onClick={goToMainPage} state={{ isLoading: false, isDisabled: loading }}>
            {stringGetter({ key: STRING_KEYS.CANCEL })}
          </Button>
        </div>
      </div>
    ),
  });

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      preventCloseOnOverlayClick
      title={TradingKeyStates.match(pageState, {
        Main: () => <div>{stringGetter({ key: STRING_KEYS.API_TRADING_KEYS })}</div>,
        Create: ({ loading }) => (
          <div>
            <IconButton
              iconName={IconName.ChevronLeft}
              buttonStyle={ButtonStyle.WithoutBackground}
              tw="mr-0.5"
              onClick={goToMainPage}
              disabled={loading}
            />
            {stringGetter({ key: STRING_KEYS.NEW_API_TRADING_KEY })}
          </div>
        ),
        Delete: ({ loading }) => (
          <div>
            <IconButton
              iconName={IconName.ChevronLeft}
              buttonStyle={ButtonStyle.WithoutBackground}
              tw="mr-0.5"
              onClick={goToMainPage}
              disabled={loading}
            />
            {stringGetter({ key: STRING_KEYS.REMOVE_API_TRADING_KEY })}
          </div>
        ),
      })}
      tw="min-w-[34rem] [--dialog-content-paddingTop:--default-border-width]"
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      {dialogContent}
    </Dialog>
  );
};

const $Address = tw.span`font-base-book [font-feature-settings:--fontFeature-monoNumbers]`;

const $CopyButton = styled(CopyButton)``;
