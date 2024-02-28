import { useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { utils } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from '@/constants/localization';
import { isMainnet } from '@/constants/networks';
import { NewMarketProposal } from '@/constants/potentialMarkets';
import { useGovernanceVariables, useStringGetter, useTokenConfigs } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagType } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { MustBigNumber } from '@/lib/numbers';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
  assetData: NewMarketProposal;
  clobPairId?: number;
  liquidityTier?: string;
};

export enum CodeToggleGroup {
  CREATE_ORACLE = 'CREATE_ORACLE',
  MSG_CREATE_PERPETUAL = 'MSG_CREATE_PERPETUAL',
  MSG_CREATE_CLOB_PAIR = 'MSG_CREATE_CLOB_PAIR',
  MSG_DELAY_MESSAGE = 'MSG_DELAY_MESSAGE',
  MSG_SUBMIT_PROPOSAL = 'MSG_SUBMIT_PROPOSAL',
}

export const NewMarketMessageDetailsDialog = ({
  assetData,
  clobPairId,
  liquidityTier,
  preventClose,
  setIsOpen,
}: ElementProps) => {
  const [codeToggleGroup, setCodeToggleGroup] = useState(CodeToggleGroup.CREATE_ORACLE);
  const { baseAsset, params, title } = assetData ?? {};
  const {
    ticker,
    exchangeConfigJson,
    minExchanges,
    minPriceChange,
    atomicResolution,
    quantumConversionExponent,
    stepBaseQuantums,
    subticksPerTick,
  } = params ?? {};
  const { newMarketProposal } = useGovernanceVariables();
  const stringGetter = useStringGetter();
  const { chainTokenDecimals, chainTokenLabel } = useTokenConfigs();
  const initialDepositAmountDecimals = isMainnet ? 0 : chainTokenDecimals;

  const exchangeConfig = useMemo(() => {
    return baseAsset ? exchangeConfigJson : undefined;
  }, [baseAsset]);

  const toggleGroupItems: Parameters<typeof ToggleGroup>[0]['items'] = useMemo(() => {
    return [
      {
        value: CodeToggleGroup.CREATE_ORACLE,
        label: 'Create oracle market',
      },
      {
        value: CodeToggleGroup.MSG_CREATE_PERPETUAL,
        label: 'Msg create perpetual',
      },
      {
        value: CodeToggleGroup.MSG_CREATE_CLOB_PAIR,
        label: 'Msg create clobPair',
      },
      {
        value: CodeToggleGroup.MSG_DELAY_MESSAGE,
        label: 'Msg delay message',
      },
      {
        value: CodeToggleGroup.MSG_SUBMIT_PROPOSAL,
        label: 'Msg submit proposal',
      },
    ];
  }, []);

  return (
    <Dialog
      isOpen
      preventClose={preventClose}
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.MESSAGE_DETAILS })}
    >
      <Styled.ProposedMessageDetails>
        <Styled.Tabs
          items={toggleGroupItems}
          value={codeToggleGroup}
          onValueChange={setCodeToggleGroup}
        />
        {
          {
            [CodeToggleGroup.CREATE_ORACLE]: (
              <Styled.Code>
                <Styled.Details
                  layout="column"
                  items={[
                    {
                      key: 'id',
                      label: 'market_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'pair',
                      label: 'pair',
                      value: ticker,
                    },
                    {
                      key: 'min-exchanges',
                      label: 'min_exchanges',
                      value: `${minExchanges}`,
                    },
                    {
                      key: 'min-price-change-ppm',
                      label: 'min_price_change_ppm',
                      value: `${minPriceChange}`,
                    },
                  ]}
                />
                <Styled.ExchangeConfigs>
                  <Styled.Text0>
                    exchange_config_json
                    {exchangeConfig && (
                      <Styled.Tag type={TagType.Number}>{exchangeConfig.length}</Styled.Tag>
                    )}
                  </Styled.Text0>
                  {'['}
                  {exchangeConfig?.map((exchange) => {
                    return (
                      <Styled.ExchangeObject
                        key={exchange.exchangeName}
                        style={{ padding: 0, margin: 0, paddingLeft: '0.5rem' }}
                      >
                        {'{'}
                        {Object.keys(exchange).map((key) => (
                          <Styled.Line key={key}>
                            {key}: <span>{exchange[key as keyof typeof exchange]}</span>
                          </Styled.Line>
                        ))}
                        {'},'}
                      </Styled.ExchangeObject>
                    );
                  })}
                  {']'}
                </Styled.ExchangeConfigs>
              </Styled.Code>
            ),
            [CodeToggleGroup.MSG_CREATE_PERPETUAL]: (
              <Styled.Code>
                <Styled.Details
                  layout="column"
                  items={[
                    {
                      key: 'perpetual_id',
                      label: 'perpetual_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'market_id',
                      label: 'market_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'ticker',
                      label: 'ticker',
                      value: ticker,
                    },
                    {
                      key: 'atomic_resolution',
                      label: 'atomic_resolution',
                      value: `${atomicResolution}`,
                    },
                    {
                      key: 'default_funding_ppm',
                      label: 'default_funding_ppm',
                      value: '0',
                    },
                    {
                      key: 'liquidity_tier',
                      label: 'liquidity_tier',
                      value: liquidityTier,
                    },
                  ]}
                />
              </Styled.Code>
            ),
            [CodeToggleGroup.MSG_CREATE_CLOB_PAIR]: (
              <Styled.Code>
                <Styled.Details
                  layout="column"
                  items={[
                    {
                      key: 'clob_id',
                      label: 'clob_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'perpetual_id',
                      label: 'perpetual_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'quantum_conversion_exponent',
                      label: 'quantum_conversion_exponent',
                      value: `${quantumConversionExponent}`,
                    },
                    {
                      key: 'step_base_quantums',
                      label: 'step_base_quantums',
                      value: `${stepBaseQuantums}`,
                    },
                    {
                      key: 'subticks_per_tick',
                      label: 'subticks_per_tick',
                      value: `${subticksPerTick}`,
                    },
                    {
                      key: 'status',
                      label: 'status',
                      value: 'INITIALIZING',
                    },
                  ]}
                />
              </Styled.Code>
            ),
            [CodeToggleGroup.MSG_DELAY_MESSAGE]: (
              <Styled.Code>
                <Styled.Details
                  layout="column"
                  items={[
                    {
                      key: 'delay_blocks',
                      label: 'delay_blocks',
                      value: (
                        <Output
                          type={OutputType.Asset}
                          value={newMarketProposal.delayBlocks}
                          fractionDigits={0}
                        />
                      ),
                    },
                  ]}
                />
                <div style={{ margin: '0.5rem 0' }}>MSG_UPDATE_CLOB_PAIR</div>
                <Styled.Details
                  layout="column"
                  items={[
                    {
                      key: 'clob_id',
                      label: 'clob_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'perpetual_id',
                      label: 'perpetual_id',
                      value: `${clobPairId}`,
                    },
                    {
                      key: 'quantum_conversion_exponent',
                      label: 'quantum_conversion_exponent',
                      value: `${quantumConversionExponent}`,
                    },
                    {
                      key: 'step_base_quantums',
                      label: 'step_base_quantums',
                      value: `${stepBaseQuantums}`,
                    },
                    {
                      key: 'subticks_per_tick',
                      label: 'subticks_per_tick',
                      value: `${subticksPerTick}`,
                    },
                    {
                      key: 'status',
                      label: 'status',
                      value: 'ACTIVE',
                    },
                  ]}
                />
              </Styled.Code>
            ),
            [CodeToggleGroup.MSG_SUBMIT_PROPOSAL]: (
              <Styled.Code>
                <Styled.Details
                  items={[
                    {
                      key: 'title',
                      label: 'title',
                      value: title,
                    },
                    {
                      key: 'initial_deposit_amount',
                      label: 'initial_deposit_amount',
                      value: (
                        <Output
                          type={OutputType.Asset}
                          value={MustBigNumber(newMarketProposal.initialDepositAmount).div(
                            Number(`1e${chainTokenDecimals}`)
                          )}
                          fractionDigits={initialDepositAmountDecimals}
                          tag={chainTokenLabel}
                        />
                      ),
                    },
                    {
                      key: 'summary',
                      label: 'summary',
                      value: (
                        <Styled.Summary>
                          {utils.getGovAddNewMarketSummary(ticker, newMarketProposal.delayBlocks)}
                        </Styled.Summary>
                      ),
                    },
                  ]}
                />
              </Styled.Code>
            ),
          }[codeToggleGroup]
        }
      </Styled.ProposedMessageDetails>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Content = styled.div`
  ${layoutMixins.column}
  gap: 0;
`;

Styled.ProposedMessageDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  background-color: var(--color-layer-3);
  margin-top: 1rem;
  border-radius: 10px;
`;

Styled.Tabs = styled(ToggleGroup)`
  overflow-x: auto;
`;

Styled.Details = styled(Details)`
  --details-item-height: 1.5rem;
`;

Styled.ExchangeConfigs = styled.div`
  margin-top: 0.5rem;
`;

Styled.Text0 = styled.span`
  color: var(--color-text-0);
`;

Styled.Tag = styled(Tag)`
  margin: 0 0.5ch;
`;

Styled.Code = styled.div`
  height: 16.25rem;
  overflow: auto;
  display: block;
  background-color: var(--color-layer-1);
  padding: 1rem;
  border-radius: 10px;
  font: var(--font-mini-book);
  font-family: var(--fontFamily-monospace);
  margin-top: 1rem;
  gap: 0rem;
`;

Styled.ExchangeObject = styled.div`
  padding: 1rem;
`;

Styled.Line = styled.pre`
  margin-left: 1rem;
`;

Styled.Description = styled.p`
  margin-bottom: 1rem;
`;

Styled.Summary = styled.p`
  text-align: justify;
  margin-left: 0.5rem;
`;
