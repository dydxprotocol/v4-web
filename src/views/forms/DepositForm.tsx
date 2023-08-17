import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';
import type { ChainData, CosmosChain, RouteData, TokenData } from '@0xsquid/sdk';
import { type NumberFormatValues } from 'react-number-format';
import debounce from 'lodash/debounce';
import { parseUnits } from 'ethers';

import { TransferInputField } from '@/constants/abacus';
import { AlertType } from '@/constants/alerts';
import { ButtonSize } from '@/constants/buttons';
import { StringGetterFunction, STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';
import { CLIENT_NETWORK_CONFIGS, type DydxV4Network } from '@/constants/networks';

import { useAccounts, useDydxClient, useStringGetter } from '@/hooks';
import { useAccountBalance } from '@/hooks/useAccountBalance';
import { layoutMixins } from '@/styles/layoutMixins';

import { AlertMessage } from '@/components/AlertMessage';
import { Button } from '@/components/Button';
import { DiffOutput } from '@/components/DiffOutput';
import { FormInput } from '@/components/FormInput';
import { InputType } from '@/components/Input';
import { Link } from '@/components/Link';
import { OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { WithLabel } from '@/components/WithLabel';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';

import abacusStateManager from '@/lib/abacus';
import { convertBech32Address } from '@/lib/addressUtils';
import { MustBigNumber } from '@/lib/numbers';
import squidRouter from '@/lib/squidRouter';

import { useSquidData } from './DepositForm/useSquidData';
import { ChainSelectMenu } from './DepositForm/ChainSelectMenu';
import { DepositButtonAndReceipt } from './DepositForm/DepositButtonAndReceipt';
import { TokenSelectMenu } from './DepositForm/TokenSelectMenu';
import { log } from '@/lib/telemetry';

import { getSelectedNetwork } from '@/state/appSelectors';

type DepositFormProps = {
  onDeposit?: () => void;
  onError?: () => void;
};

// debounced function should be outside our functional component
const debouncedGetRoute = debounce(
  async ({
    amount,
    currentChain,
    cosmosAddress,
    fromAmount,
    setAbacusTransferInput,
    setError,
    setIsLoading,
    setSquidRoute,
    slippage,
    sourceToken,
  }) => {
    if (!currentChain || !sourceToken || !fromAmount || !cosmosAddress) return;
    setIsLoading(true);
    setSquidRoute(undefined);
    setError(undefined);

    const params = {
      fromChain: currentChain.chainId,
      fromToken: sourceToken.address,
      fromAmount: parseUnits(amount, sourceToken.decimals).toString(),
      toAddress: convertBech32Address({ address: cosmosAddress, bech32Prefix: 'osmo' }), // the recipient of the trade
      slippage: slippage * 100,
      ...squidRouter.SQUID_ROUTE_DEFAULTS,
    };

    try {
      const { route } = await squidRouter.getRoute(params);
      setSquidRoute(route);
      setAbacusTransferInput(route.estimate.toAmountUSD);
    } catch (error) {
      log('DepositForm/getRoute', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  },
  1000,
  { trailing: true }
);

const getDepositFormErrorMessage = ({
  error,
  balance,
  currentChain,
  fromAmount,
  sourceToken,
  stringGetter,
}: {
  error?: any;
  balance?: string;
  currentChain?: ChainData;
  fromAmount: string;
  sourceToken?: TokenData;
  stringGetter: StringGetterFunction;
}): string | undefined => {
  if (error) {
    return error?.message
      ? stringGetter({
          key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
          params: { ERROR_MESSAGE: error.message },
        })
      : stringGetter({ key: STRING_KEYS.SOMETHING_WENT_WRONG });
  }

  if (fromAmount) {
    if (!currentChain) {
      return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_CHAIN });
    } else if (!sourceToken) {
      return stringGetter({ key: STRING_KEYS.MUST_SPECIFY_ASSET });
    }
  }

  if (MustBigNumber(fromAmount).gt(MustBigNumber(balance))) {
    return stringGetter({ key: STRING_KEYS.DEPOSIT_MORE_THAN_BALANCE });
  }

  return undefined;
};

export const DepositForm = ({ onDeposit, onError }: DepositFormProps) => {
  const stringGetter = useStringGetter();

  const { dydxAddress: cosmosAddress, signerWagmi, signerGraz } = useAccounts();

  // const { networkConfig } = useDydxClient();
  const selectedNetwork = useSelector(getSelectedNetwork);
  const evmChainId = Number(CLIENT_NETWORK_CONFIGS[selectedNetwork as DydxV4Network].ethereumChainId);

  const { chains, tokens } = useSquidData(signerGraz ? 'cosmos' : 'evm');

  // User inputs
  const defaultChain: ChainData | undefined = useMemo(
    () => chains?.find(({ chainId }) => chainId === evmChainId) ?? undefined,
    [chains]
  );
  const [currentChain, setCurrentChain] = useState<ChainData | undefined>(defaultChain);

  const defaultToken: TokenData | undefined = useMemo(
    () => tokens?.filter(({ chainId }) => chainId === currentChain?.chainId)?.[0] ?? undefined,
    [currentChain]
  );
  const [sourceToken, setSourceToken] = useState<TokenData | undefined>(defaultToken);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.001); // 0.1% slippage

  // Async Data
  const [squidRoute, setSquidRoute] = useState<RouteData>();
  const [transactionHash, setTransactionHash] = useState<string | undefined>();

  // Form states
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentChain(defaultChain);

    return () => {
      abacusStateManager.clearTransferInputValues();
    };
  }, [defaultChain]);

  useEffect(() => {
    setSourceToken(defaultToken);
    setSquidRoute(undefined);
    setFromAmount('');
  }, [currentChain]);

  // @ts-ignore ibcDenom exists but is not typed properly on 0xSquid SDK
  const addressOrDenom = sourceToken?.ibcDenom || sourceToken?.address;
  const bech32AddrPrefix = (currentChain as CosmosChain)?.bech32Config?.bech32PrefixAccAddr;

  const { balance, isBalanceError, isBalanceLoading } = useAccountBalance({
    addressOrDenom,
    assetSymbol: sourceToken?.symbol,
    bech32AddrPrefix,
    chainId: currentChain?.chainId,
    decimals: sourceToken?.decimals,
    rpc: currentChain?.rpc,
    isCosmosChain: currentChain?.chainType === 'cosmos',
  });

  // BN
  const fromAmountBN = MustBigNumber(fromAmount);
  const balanceBN = MustBigNumber(balance);

  const requestDeposit = async () => {
    if (!squidRoute) {
      log('DepositForm/requestDeposit', new Error('No squid route'));
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);
      setTransactionHash(undefined);

      const txReceipt = await squidRouter.executeRoute({
        route: squidRoute,
        signer: signerGraz || signerWagmi,
      });
      console.log('DepositForm/executeRoute', { txReceipt });
      setFromAmount('');
      setTransactionHash(txReceipt?.transactionHash);
    } catch (error) {
      log('DepositForm/executeRoute', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAbacusTransferInput = (value: string | number) => {
    abacusStateManager.setTransferValue({ value, field: TransferInputField.usdcSize });
  };

  const getRoute = useCallback(
    ({ newAmount, newSlippage }: { newAmount: string; newSlippage?: number }) => {
      debouncedGetRoute.cancel();

      if (MustBigNumber(newAmount).gt(0) && MustBigNumber(newAmount).lte(balanceBN)) {
        debouncedGetRoute({
          amount: newAmount,
          currentChain,
          cosmosAddress,
          fromAmount,
          setAbacusTransferInput,
          setError,
          setIsLoading,
          setSquidRoute,
          slippage: newSlippage || slippage,
          sourceToken,
        });
      } else {
        setSquidRoute(undefined);
        setAbacusTransferInput(0);
      }
    },
    [currentChain, sourceToken, fromAmount, slippage]
  );

  const onChangeAmount = ({ value }: NumberFormatValues) => {
    setFromAmount(value);
    getRoute({ newAmount: value });
  };

  const onSetSlippage = (newSlippage: number) => {
    setSlippage(newSlippage);

    if (MustBigNumber(newSlippage).gt(0) && fromAmountBN.gt(0)) {
      getRoute({ newAmount: fromAmount, newSlippage });
    }
  };

  const onClickMax = () => {
    if (balance) {
      setFromAmount(balanceBN.toString());
    }
  };

  const amountInputReceipt = [
    {
      key: 'amount',
      label: (
        <span>
          {stringGetter({ key: STRING_KEYS.AVAILABLE })}{' '}
          {sourceToken && <Tag>{sourceToken.symbol}</Tag>}
        </span>
      ),
      value: (
        <DiffOutput
          type={OutputType.Asset}
          value={balance}
          newValue={balanceBN.minus(fromAmountBN).toString()}
          sign={NumberSign.Negative}
          hasInvalidNewValue={balanceBN.minus(fromAmountBN).isNegative()}
          withDiff={Boolean(fromAmount && balance) && !fromAmountBN.isNaN()}
        />
      ),
    },
  ];

  const errorMessage = getDepositFormErrorMessage({
    error,
    balance,
    currentChain,
    fromAmount,
    sourceToken,
    stringGetter,
  });

  const isDisabled =
    Boolean(errorMessage) ||
    !sourceToken ||
    !currentChain ||
    fromAmountBN.isNaN() ||
    fromAmountBN.isZero() ||
    !squidRoute;

  const alertMessage = {
    type: errorMessage ? AlertType.Error : AlertType.Info,
    message:
      errorMessage ||
      (transactionHash && (
        <span>
          {stringGetter({ key: STRING_KEYS.VIEW_DETAILS })}
          {' on '}
          <Styled.Link href={`https://testnet.axelarscan.io/transfer/${transactionHash}`}>
            Axelar
          </Styled.Link>
          .
        </span>
      )),
  };

  return (
    <Styled.Form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        requestDeposit();
      }}
    >
      <ChainSelectMenu
        chains={chains}
        currentChain={currentChain}
        setCurrentChain={setCurrentChain}
      />
      <TokenSelectMenu
        tokens={tokens}
        chain={currentChain}
        sourceToken={sourceToken}
        setSourceToken={(token: TokenData) => {
          setSourceToken(token);

          if (fromAmount) {
            debouncedGetRoute({
              amount: fromAmount,
              currentChain,
              cosmosAddress,
              fromAmount,
              setError,
              setIsLoading,
              setSquidRoute,
              slippage,
              sourceToken: token,
            });
          } else {
            setSquidRoute(undefined);
          }
        }}
      />
      <WithLabel label={stringGetter({ key: STRING_KEYS.AMOUNT })}>
        <Styled.WithDetailsReceipt side="bottom" detailItems={amountInputReceipt}>
          <Styled.FormInput
            type={InputType.Number}
            onChange={onChangeAmount}
            value={fromAmount}
            slotRight={
              <Button size={ButtonSize.XSmall} onClick={onClickMax}>
                {stringGetter({ key: STRING_KEYS.MAX })}
              </Button>
            }
          />
        </Styled.WithDetailsReceipt>
      </WithLabel>
      {alertMessage.message && (
        <Styled.AlertMessage type={alertMessage.type}>{alertMessage.message}</Styled.AlertMessage>
      )}
      <Styled.Footer>
        <DepositButtonAndReceipt
          isDisabled={isDisabled}
          isLoading={isLoading || isBalanceLoading}
          chainId={currentChain?.chainId}
          setError={setError}
          setSlippage={onSetSlippage}
          slippage={slippage}
          sourceToken={sourceToken}
          squidRoute={squidRoute}
        />
      </Styled.Footer>
    </Styled.Form>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;

  ${layoutMixins.stickyArea1}
  min-height: calc(100% - var(--stickyArea0-bottomHeight));
`;

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;

Styled.FormInput = styled(FormInput)`
  --formInput-backgroundColor: var(--color-layer-4);
  --formInput-input-height: 3.375rem;
  border: 1px solid var(--color-layer-6);
`;

Styled.Link = styled(Link)`
  color: var(--color-accent);
`;

Styled.AlertMessage = styled(AlertMessage)`
  cursor: normal;
  user-select: none;
  margin: 0;
`;

Styled.Footer = styled.footer`
  ${layoutMixins.stickyFooter}
  margin-top: auto;
`;
