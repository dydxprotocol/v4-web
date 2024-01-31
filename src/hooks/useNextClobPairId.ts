import { useMemo } from 'react';
import { useQuery } from 'react-query';

import {
  MsgCreateClobPair,
  MsgCreateOracleMarket,
  MsgCreatePerpetual,
  MsgDelayMessage,
  MsgUpdateClobPair,
  TYPE_URL_MSG_CREATE_CLOB_PAIR,
  TYPE_URL_MSG_CREATE_ORACLE_MARKET,
  TYPE_URL_MSG_CREATE_PERPETUAL,
  TYPE_URL_MSG_DELAY_MESSAGE,
  TYPE_URL_MSG_UPDATE_CLOB_PAIR,
} from '@dydxprotocol/v4-client-js';

import type { PerpetualMarketResponse } from '@/constants/indexer';
import { useDydxClient } from '@/hooks/useDydxClient';

export const useNextClobPairId = () => {
  const { isConnected, requestAllPerpetualMarkets, requestAllGovernanceProposals } =
    useDydxClient();

  const { data: perpetualMarkets, status: perpetualMarketsStatus } = useQuery({
    enabled: isConnected,
    queryKey: 'requestAllPerpetualMarkets',
    queryFn: requestAllPerpetualMarkets,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: allGovProposals, status: allGovProposalsStatus } = useQuery({
    enabled: isConnected,
    queryKey: 'requestAllActiveGovernanceProposals',
    queryFn: () => requestAllGovernanceProposals(),
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  /**
   *
   * @param message from proposal. Each message is wrapped in a type any (on purpose).
   * @param callback method used to compile all clobPairIds, perpetualIds, marketIds, etc.
   */
  const decodeMsgForClobPairId = (message: any, callback: (id?: number) => void): any => {
    const { typeUrl, value } = message;

    switch (typeUrl) {
      case TYPE_URL_MSG_CREATE_ORACLE_MARKET: {
        const decodedValue = MsgCreateOracleMarket.decode(value);
        callback(decodedValue.params?.id);
        break;
      }
      case TYPE_URL_MSG_CREATE_PERPETUAL: {
        const decodedValue = MsgCreatePerpetual.decode(value);
        callback(decodedValue.params?.id);
        callback(decodedValue.params?.marketId);
        break;
      }
      case TYPE_URL_MSG_CREATE_CLOB_PAIR: {
        const decodedValue = MsgCreateClobPair.decode(value);
        callback(decodedValue.clobPair?.id);
        callback(decodedValue.clobPair?.perpetualClobMetadata?.perpetualId);
        break;
      }
      case TYPE_URL_MSG_UPDATE_CLOB_PAIR: {
        const decodedValue = MsgUpdateClobPair.decode(value);
        callback(decodedValue.clobPair?.id);
        callback(decodedValue.clobPair?.perpetualClobMetadata?.perpetualId);
        break;
      }
      case TYPE_URL_MSG_DELAY_MESSAGE: {
        const decodedValue = MsgDelayMessage.decode(value);
        decodeMsgForClobPairId(decodedValue.msg, callback);
        break;
      }
      default: {
        break;
      }
    }
  };

  const nextAvailableClobPairId = useMemo(() => {
    const idsFromProposals: number[] = [];

    if (allGovProposals && Object.values(allGovProposals.proposals).length > 0) {
      const proposals = allGovProposals.proposals;
      proposals.forEach((proposal) => {
        if (proposal.messages) {
          proposal.messages.map((message) => {
            decodeMsgForClobPairId(message, (id?: number) => {
              if (id) {
                idsFromProposals.push(id);
              }
            });
          });
        }
      });
    }

    if (perpetualMarkets && Object.values(perpetualMarkets).length > 0) {
      const clobPairIds = Object.values(perpetualMarkets)?.map((perpetualMarket) =>
        Number((perpetualMarket as PerpetualMarketResponse).clobPairId)
      );

      const nextAvailableClobPairId = Math.max(...[...clobPairIds, ...idsFromProposals]) + 1;
      return nextAvailableClobPairId;
    }

    return undefined;
  }, [perpetualMarkets, allGovProposals]);

  return {
    allGovProposalsStatus,
    perpetualMarketsStatus,
    nextAvailableClobPairId,
  };
};
