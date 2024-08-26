import { useMemo } from 'react';

import { shallowEqual } from 'react-redux';
import tw from 'twin.macro';

import { TransferInputTokenResource, TransferType } from '@/constants/abacus';
import { cctpTokensByDenom, getMapOfLowestFeeTokensByDenom } from '@/constants/cctp';
import { NEUTRON_USDC_IBC_DENOM, OSMO_USDC_IBC_DENOM } from '@/constants/denoms';
import { getNeutronChainId, getNobleChainId, getOsmosisChainId } from '@/constants/graz';
import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { StatSigFlags } from '@/constants/statsig';
import { WalletType } from '@/constants/wallets';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { DiffArrow } from '@/components/DiffArrow';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { Tag } from '@/components/Tag';

import { useAppSelector } from '@/state/appTypes';
import { getTransferInputs } from '@/state/inputsSelectors';

import { orEmptyObj } from '@/lib/typeUtils';

import { LowestFeesDecoratorText } from './LowestFeesText';

type ElementProps = {
  selectedToken?: TransferInputTokenResource;
  onSelectToken: (token: TransferInputTokenResource) => void;
  isExchange?: boolean;
};

export const TokenSelectMenu = ({ selectedToken, onSelectToken, isExchange }: ElementProps) => {
  const stringGetter = useStringGetter();
  const {
    type,
    depositOptions,
    withdrawalOptions,
    resources,
    chain: chainIdStr,
  } = orEmptyObj(useAppSelector(getTransferInputs, shallowEqual));
  const { walletType } = useAccounts();
  const { CCTPWithdrawalOnly, CCTPDepositOnly } = useEnvFeatures();
  const skipEnabled = useStatsigGateValue(StatSigFlags.ffSkipMigration);

  const lowestFeeTokensByDenom = useMemo(
    () => getMapOfLowestFeeTokensByDenom(type, skipEnabled),
    [type, skipEnabled]
  );
  const isKeplrWallet = walletType === WalletType.Keplr;

  const tokens =
    (type === TransferType.deposit ? depositOptions : withdrawalOptions)?.assets?.toArray() ??
    EMPTY_ARR;

  const tokenItems = Object.values(tokens)
    .map((token) => ({
      value: token.type,
      label: token.stringKey,
      onSelect: () => {
        const newSelectedToken = resources?.tokenResources?.get(token.type);
        if (newSelectedToken) {
          onSelectToken(newSelectedToken);
        }
      },
      slotBefore: (
        // the curve dao token svg causes the web app to lag when rendered
        <$Img src={token.iconUrl ?? undefined} alt="" />
      ),
      slotAfter: !!lowestFeeTokensByDenom[token.type] && <LowestFeesDecoratorText />,
      tag: resources?.tokenResources?.get(token.type)?.symbol,
    }))
    .filter((token) => {
      if (isKeplrWallet) {
        if (chainIdStr === getNobleChainId()) {
          return true;
        }
        if (chainIdStr === getOsmosisChainId()) {
          return token.value === OSMO_USDC_IBC_DENOM;
        }
        if (chainIdStr === getNeutronChainId()) {
          return token.value === NEUTRON_USDC_IBC_DENOM;
        }
      }
      // if deposit and CCTPDepositOnly enabled, only return cctp tokens
      if (type === TransferType.deposit && CCTPDepositOnly) {
        return !!cctpTokensByDenom[token.value];
      }
      // if withdrawal and CCTPWithdrawalOnly enabled, only return cctp tokens
      if (type === TransferType.withdrawal && CCTPWithdrawalOnly) {
        return !!cctpTokensByDenom[token.value];
      }
      return true;
    })
    // we want lowest fee tokens first followed by non-lowest fee cctp tokens
    .sort((token) => (cctpTokensByDenom[token.value] ? -1 : 1))
    .sort((token) => (lowestFeeTokensByDenom[token.value] ? -1 : 1));

  return (
    <SearchSelectMenu
      items={[
        {
          group: 'assets',
          groupLabel: stringGetter({ key: STRING_KEYS.ASSET }),
          items: tokenItems,
        },
      ]}
      label={stringGetter({ key: STRING_KEYS.ASSET })}
      withSearch={!isExchange}
      withReceiptItems={
        !isExchange
          ? [
              {
                key: 'swap',
                label: stringGetter({ key: STRING_KEYS.SWAP }),
                value: selectedToken && (
                  <>
                    <Tag>{type === TransferType.deposit ? selectedToken?.symbol : 'USDC'}</Tag>
                    <DiffArrow />
                    <Tag>{type === TransferType.deposit ? 'USDC' : selectedToken?.symbol}</Tag>
                  </>
                ),
              },
            ]
          : undefined
      }
    >
      <div tw="row gap-0.5 text-color-text-2 font-base-book">
        {selectedToken ? (
          <>
            <$Img src={selectedToken?.iconUrl ?? undefined} alt="" /> {selectedToken?.name}{' '}
            <Tag>{selectedToken?.symbol}</Tag>
          </>
        ) : (
          stringGetter({ key: STRING_KEYS.SELECT_ASSET })
        )}
      </div>
    </SearchSelectMenu>
  );
};
const $Img = tw.img`h-1.25 w-1.25 rounded-[50%]`;
