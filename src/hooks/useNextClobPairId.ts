import { useMemo } from 'react';

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
import { useQuery } from '@tanstack/react-query';

import type { PerpetualMarketResponse } from '@/constants/indexer';

import { useDydxClient } from '@/hooks/useDydxClient';

/**
 *
 * @param message from proposal. Each message is wrapped in a type any (on purpose).
 * @param callback method used to compile all clobPairIds, perpetualIds, marketIds, etc.
 */
const decodeMsgForClobPairId = (
  message: any,
  addIdFromProposal: (id?: number) => void,
  addTickerFromProposal: (ticker?: string) => void
): any => {
  const { typeUrl, value } = message;

  switch (typeUrl) {
    case TYPE_URL_MSG_CREATE_ORACLE_MARKET: {
      const decodedValue = MsgCreateOracleMarket.decode(value);
      addIdFromProposal(decodedValue.params?.id);
      addTickerFromProposal(decodedValue.params?.pair);
      break;
    }
    case TYPE_URL_MSG_CREATE_PERPETUAL: {
      const decodedValue = MsgCreatePerpetual.decode(value);
      addIdFromProposal(decodedValue.params?.id);
      addIdFromProposal(decodedValue.params?.marketId);
      break;
    }
    case TYPE_URL_MSG_CREATE_CLOB_PAIR: {
      const decodedValue = MsgCreateClobPair.decode(value);
      addIdFromProposal(decodedValue.clobPair?.id);
      addIdFromProposal(decodedValue.clobPair?.perpetualClobMetadata?.perpetualId);
      break;
    }
    case TYPE_URL_MSG_UPDATE_CLOB_PAIR: {
      const decodedValue = MsgUpdateClobPair.decode(value);
      addIdFromProposal(decodedValue.clobPair?.id);
      addIdFromProposal(decodedValue.clobPair?.perpetualClobMetadata?.perpetualId);
      break;
    }
    case TYPE_URL_MSG_DELAY_MESSAGE: {
      const decodedValue = MsgDelayMessage.decode(value);
      decodeMsgForClobPairId(decodedValue.msg, addIdFromProposal, addTickerFromProposal);
      break;
    }
    default: {
      break;
    }
  }
};

export const useNextClobPairId = () => {
  const { isCompositeClientConnected, requestAllPerpetualMarkets, requestAllGovernanceProposals } =
    useDydxClient();

  const { data: perpetualMarkets, status: perpetualMarketsStatus } = useQuery({
    queryKey: ['requestAllPerpetualMarkets'],
    queryFn: () => requestAllPerpetualMarkets(),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: allGovProposals, status: allGovProposalsStatus } = useQuery({
    enabled: isCompositeClientConnected,
    queryKey: ['requestAllActiveGovernanceProposals'],
    queryFn: () => requestAllGovernanceProposals(),
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const { nextAvailableClobPairId, tickersFromProposals } = useMemo(() => {
    const idsFromProposals: number[] = [];
    const newTickersFromProposals: Set<string> = new Set();

    const addIdFromProposal = (id?: number) => {
      if (id) {
        idsFromProposals.push(id);
      }
    };

    const addTickerFromProposal = (ticker?: string) => {
      if (ticker) {
        newTickersFromProposals.add(ticker);
      }
    };

    if (allGovProposals && Object.values(allGovProposals.proposals).length > 0) {
      const proposals = allGovProposals.proposals;
      proposals.forEach((proposal) => {
        if (proposal.messages) {
          proposal.messages.forEach((message) => {
            decodeMsgForClobPairId(message, addIdFromProposal, addTickerFromProposal);
          });
        }
      });
    }

    if (perpetualMarkets && Object.values(perpetualMarkets).length > 0) {
      const clobPairIds = Object.values(perpetualMarkets)?.map((perpetualMarket) =>
        Number((perpetualMarket as PerpetualMarketResponse).clobPairId)
      );

      const newNextAvailableClobPairId = Math.max(...[...clobPairIds, ...idsFromProposals]) + 1;
      return {
        nextAvailableClobPairId: newNextAvailableClobPairId,
        tickersFromProposals: newTickersFromProposals,
      };
    }

    return {
      nextAvailableClobPairId: undefined,
      tickersFromProposals: newTickersFromProposals,
    };
  }, [perpetualMarkets, allGovProposals]);

  return {
    allGovProposalsStatus,
    perpetualMarketsStatus,
    nextAvailableClobPairId,
    tickersFromProposals,
  };
};
