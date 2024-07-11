import { useCallback } from 'react';

import {
  GasPrice,
  MsgTransferEncodeObject,
  SigningStargateClient,
  calculateFee,
} from '@cosmjs/stargate';
import { GAS_MULTIPLIER } from '@dydxprotocol/v4-client-js';
import { MsgsDirectRequestJSON, type RouteRequestGivenInJSON } from '@skip-router/core';
import { useAccount as useAccountGraz, useOfflineSigners } from 'graz';

import { DEFAULT_TRANSACTION_MEMO } from '@/constants/analytics';
import { isMainnet } from '@/constants/networks';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { SUPPORTED_COSMOS_CHAINS } from '@/lib/graz';
import {
  getNobleChainId,
  getOsmosisChainId,
  isMultiChainMsg,
  requestSkipMsgsDirect,
} from '@/lib/squid';

import { useAccounts } from './useAccounts';
import { useEndpointsConfig } from './useEndpointsConfig';

export const useIbcTransfer = () => {
  const { dydxAddress } = useAccounts();
  const { skip, nobleValidator, osmosisValidator } = useEndpointsConfig();
  const { data: accounts } = useAccountGraz({
    chainId: SUPPORTED_COSMOS_CHAINS,
    multiChain: true,
  });
  const { data: offlineSigners } = useOfflineSigners({
    chainId: SUPPORTED_COSMOS_CHAINS,
    multiChain: true,
  });
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const nobleChainId = getNobleChainId();
  const osmosisChainId = getOsmosisChainId();

  const getTransferMsg = useCallback(
    async (msgsDirectRequest: Omit<MsgsDirectRequestJSON, 'amount_out'>) => {
      if (isMainnet) {
        const msgsDirect = await requestSkipMsgsDirect({
          baseUrl: skip,
          msgsDirectRequest,
        });

        const multiChainMsg = msgsDirect?.msgs.find(isMultiChainMsg);

        if (!multiChainMsg) {
          throw new Error('Failed to get tx data');
        }

        const parsedMsg = JSON.parse(multiChainMsg?.multi_chain_msg.msg);
        const timeoutTimestamp = parsedMsg.timeout_timestamp
          ? BigInt(parsedMsg.timeout_timestamp)
          : BigInt(0);

        return {
          typeUrl: multiChainMsg.multi_chain_msg.msg_type_url,
          value: {
            sender: parsedMsg.sender,
            receiver: parsedMsg.receiver,
            token: parsedMsg.token,
            sourceChannel: parsedMsg.source_channel,
            sourcePort: parsedMsg.source_port,
            memo: parsedMsg.memo,
            timeoutTimestamp,
          },
        } as MsgTransferEncodeObject;
      }

      // Testnet

      const TESTNET_NOBLE_TRANSFER_CHANNEL = 'channel-21';
      const chainData = (() => {
        if (msgsDirectRequest.source_asset_chain_id === nobleChainId) {
          return {
            channel: TESTNET_NOBLE_TRANSFER_CHANNEL,
            noblePacketForwardMemo: '',
          };
        }
        if (msgsDirectRequest.source_asset_chain_id === osmosisChainId) {
          return {
            channel: 'channel-4280',
            // eslint-disable-next-line no-useless-escape
            noblePacketForwardMemo: `{\"forward\":{\"receiver\":\"${dydxAddress}\",\"port\":\"transfer\",\"channel\":\"${TESTNET_NOBLE_TRANSFER_CHANNEL}\"}}`,
          };
        }

        return undefined;
      })();

      if (!chainData) {
        throw new Error('No transfer route found');
      }

      const account = accounts?.[msgsDirectRequest.source_asset_chain_id];
      const signerAddress = account?.bech32Address;
      const receiver = accounts?.[msgsDirectRequest.dest_asset_chain_id]?.bech32Address;

      if (!signerAddress || !receiver) {
        throw new Error('Failed to get account');
      }

      const transferMsg: MsgTransferEncodeObject = {
        typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
        value: {
          sourcePort: 'transfer',
          sourceChannel: chainData.channel,
          sender: signerAddress,
          receiver,
          token: {
            denom: msgsDirectRequest.source_asset_denom,
            amount: msgsDirectRequest.amount_in,
          },
          memo: chainData.noblePacketForwardMemo,
          timeoutTimestamp: BigInt(Math.floor(Date.now() / 1000) * 1e9 + 10 * 60 * 1e9),
        },
      };
      return transferMsg;
    },
    [accounts, dydxAddress, nobleChainId, osmosisChainId, skip]
  );

  const sendIbcToken = useCallback(
    async ({
      amount_in,
      source_asset_chain_id,
      source_asset_denom,
      dest_asset_chain_id,
      dest_asset_denom,
    }: RouteRequestGivenInJSON) => {
      const offlineSigner = offlineSigners?.[source_asset_chain_id];
      const account = accounts?.[source_asset_chain_id];
      const signerAddress = account?.bech32Address;
      const receiver = accounts?.[dest_asset_chain_id]?.bech32Address;

      const nobleAddress = accounts?.[nobleChainId]?.bech32Address;
      const osmosisAddress = accounts?.[osmosisChainId]?.bech32Address;

      const chainData = (() => {
        if (source_asset_chain_id === nobleChainId) {
          return { restEndpoint: nobleValidator, gasPrice: GasPrice.fromString('0.1uusdc') };
        }
        if (source_asset_chain_id === osmosisChainId) {
          return { restEndpoint: osmosisValidator, gasPrice: GasPrice.fromString('0.025uosmo') };
        }
        return undefined;
      })();
      if (
        !offlineSigner ||
        !signerAddress ||
        !receiver ||
        !chainData ||
        !dydxAddress ||
        !nobleAddress ||
        !osmosisAddress
      ) {
        throw new Error('Failed to get account');
      }

      const chainIdsToAddresses = {
        [selectedDydxChainId]: dydxAddress,
        [nobleChainId]: nobleAddress,
        [osmosisChainId]: osmosisAddress,
      };

      const transferMsg = await getTransferMsg({
        amount_in,
        source_asset_chain_id,
        source_asset_denom,
        dest_asset_chain_id,
        dest_asset_denom,
        chain_ids_to_addresses: chainIdsToAddresses,
      });

      console.log(transferMsg);
      const stargateClient = await SigningStargateClient.connectWithSigner(
        chainData.restEndpoint,
        offlineSigner.offlineSigner
      );

      const accountData = await stargateClient.getAccount(signerAddress);

      if (!accountData) {
        throw new Error('Failed to get account data');
      }

      const memo = `${DEFAULT_TRANSACTION_MEMO} | ${signerAddress}`;

      const gasEstimate = await stargateClient.simulate(signerAddress, [transferMsg], memo);
      const fee = calculateFee(Math.floor(gasEstimate * GAS_MULTIPLIER), chainData.gasPrice);

      const tx = await stargateClient.signAndBroadcast(signerAddress, [transferMsg], fee, memo);

      return tx;
    },
    [
      accounts,
      dydxAddress,
      getTransferMsg,
      nobleChainId,
      nobleValidator,
      offlineSigners,
      osmosisChainId,
      osmosisValidator,
      selectedDydxChainId,
    ]
  );

  return {
    sendIbcToken,
  };
};
