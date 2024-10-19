import { Chain } from '@skip-go/client';
import tw from 'twin.macro';

import { cctpTokensByChainId, isHighFeeChainId, isLowFeeChainId } from '@/constants/cctp';
import { SUPPORTED_COSMOS_CHAINS } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { TransferType } from '@/constants/transfers';
import { ConnectorType, WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';

import { SearchSelectMenu } from '@/components/SearchSelectMenu';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { isTruthy } from '@/lib/isTruthy';

import exchanges from '../../../../../public/configs/exchanges.json';
import { FeeLevel, FeeLevelTag } from '../FeeLevelTag';

type ElementProps = {
  selectedExchange?: string;
  selectedChain?: string;
  onSelectNetwork: (chainID: string) => void;
  onSelectExchange: (exchangeName: string) => void;
  chains: Chain[];
};

// TODO: fix this
// our menu item types are wrong (has label typed as a react node even though we use string)
// so we have to make our own type.
type SelectableItem = {
  value: string;
  label: string;
  onSelect: () => void;
  slotBefore: JSX.Element;
  slotAfter?: JSX.Element;
};

const solanaChainIdPrefix = 'solana';
const DEFAULT_NETWORKS_LABEL = 'Networks';

export const NetworkSelectMenu = ({
  selectedExchange,
  selectedChain,
  onSelectNetwork,
  onSelectExchange,
  chains,
}: ElementProps) => {
  const { sourceAccount } = useAccounts();
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const { CCTPWithdrawalOnly } = useEnvFeatures();

  const stringGetter = useStringGetter();

  const isKeplrWallet = sourceAccount.walletInfo?.name === WalletType.Keplr;

  const getFeeDecoratorComponentForChainId = (chainId: string) => {
    if (isLowFeeChainId(chainId, TransferType.Withdraw))
      return <FeeLevelTag feeLevel={FeeLevel.Low} />;
    if (isHighFeeChainId(chainId, TransferType.Withdraw))
      return <FeeLevelTag feeLevel={FeeLevel.High} />;
    return undefined;
  };

  const chainItems = chains
    .map((chain) => ({
      value: chain.chainID,
      label: chain.chainName,
      onSelect: () => {
        onSelectNetwork(chain.chainID);
      },
      slotBefore: <$Img src={chain.logoURI ?? undefined} alt="" />,
      slotAfter: getFeeDecoratorComponentForChainId(chain.chainID),
    }))
    .filter((chain) => {
      // only cosmos chains are supported on kepler
      if (isKeplrWallet) {
        return selectedDydxChainId !== chain.value && SUPPORTED_COSMOS_CHAINS.includes(chain.value);
      }
      // only solana chains are supported on phantom
      if (sourceAccount.walletInfo?.connectorType === ConnectorType.PhantomSolana) {
        return selectedDydxChainId !== chain.value && chain.value.startsWith(solanaChainIdPrefix);
      }
      // other wallets do not support solana
      if (chain.value.startsWith(solanaChainIdPrefix)) return false;

      if (CCTPWithdrawalOnly) {
        return !!cctpTokensByChainId[chain.value];
      }

      return true;
    });

  const { lowFeeChains, nonLowFeeChains } = chainItems.reduce(
    (allChains, nextChain) => {
      if (isLowFeeChainId(nextChain.value, TransferType.Withdraw))
        allChains.lowFeeChains.push(nextChain);
      else allChains.nonLowFeeChains.push(nextChain);
      return allChains;
    },
    { lowFeeChains: [], nonLowFeeChains: [] } as {
      lowFeeChains: SelectableItem[];
      nonLowFeeChains: SelectableItem[];
    }
  );

  const exchangeItems = Object.values(exchanges).map((exchange) => ({
    value: exchange.name,
    label: exchange.label,
    onSelect: () => {
      onSelectExchange(exchange.name);
    },
    slotBefore: <$Img src={exchange.icon} alt="" />,
    slotAfter: <FeeLevelTag feeLevel={FeeLevel.Low} />,
  }));
  const selectedChainOption = chains.find((item) => item.chainID === selectedChain);
  const selectedExchangeOption = exchanges.find((item) => item.name === selectedExchange);

  const items = [
    {
      group: 'low-fees',
      groupLabel: 'Low Fees',
      items: [...exchangeItems, ...lowFeeChains],
    },
    {
      group: 'other-networks',
      groupLabel: 'Other networks',
      items: nonLowFeeChains,
    },
  ];

  return (
    <SearchSelectMenu items={items.filter(isTruthy)} label="Destination">
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        {selectedChainOption ? (
          <>
            <$Img src={selectedChainOption.logoURI ?? undefined} alt="" />{' '}
            {selectedChainOption.prettyName}
          </>
        ) : selectedExchangeOption ? (
          <>
            <$Img src={selectedExchangeOption.icon} alt="" /> {selectedExchangeOption.label}
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_CHAIN })
        )}
      </div>
    </SearchSelectMenu>
  );
};

const $Img = tw.img`h-1.25 w-1.25 rounded-[50%]`;
