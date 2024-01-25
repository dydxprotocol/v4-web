import { useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { utils } from '@dydxprotocol/v4-client-js';

import { STRING_KEYS } from '@/constants/localization';
import { PotentialMarketItem } from '@/constants/potentialMarkets';
import { useGovernanceVariables, useStringGetter } from '@/hooks';
import { usePotentialMarkets } from '@/hooks/usePotentialMarkets';
import { layoutMixins } from '@/styles/layoutMixins';

import { Details } from '@/components/Details';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagType } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
  assetData?: PotentialMarketItem;
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
  const { exchangeConfigs } = usePotentialMarkets();
  const { baseAsset } = assetData ?? {};
  const { newMarketProposal } = useGovernanceVariables();
  const stringGetter = useStringGetter();

  const exchangeConfig = useMemo(() => {
    return baseAsset ? exchangeConfigs?.[baseAsset] : undefined;
  }, [baseAsset]);

  const ticker = useMemo(() => `${baseAsset}-USD`, [baseAsset]);

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
                <Details
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
                      value: `${assetData?.minExchanges}`,
                    },
                    {
                      key: 'min-price-change-ppm',
                      label: 'min_price_change_ppm',
                      value: `${assetData?.minPriceChangePpm}`,
                    },
                  ]}
                />
                <Styled.Text0>
                  exchange_config_json{' '}
                  {exchangeConfig && <Tag type={TagType.Number}>{exchangeConfig.length}</Tag>}
                </Styled.Text0>
                {'['}
                {exchangeConfig?.map((exchange) => {
                  return (
                    <Styled.Code
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
                    </Styled.Code>
                  );
                })}
                {']'}
              </Styled.Code>
            ),
            [CodeToggleGroup.MSG_CREATE_PERPETUAL]: (
              <Styled.Code>
                <Details
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
                      value: `${assetData?.atomicResolution}`,
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
                <Details
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
                      value: `${assetData?.quantumConversionExponent}`,
                    },
                    {
                      key: 'step_base_quantums',
                      label: 'step_base_quantums',
                      value: `${assetData?.stepBaseQuantum}`,
                    },
                    {
                      key: 'subticks_per_tick',
                      label: 'subticks_per_tick',
                      value: `${assetData?.subticksPerTick}`,
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
                <Details
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
                <div style={{ marginTop: '1rem' }}>MSG_UPDATE_CLOB_PAIR</div>
                <Details
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
                      value: `${assetData?.quantumConversionExponent}`,
                    },
                    {
                      key: 'step_base_quantums',
                      label: 'step_base_quantums',
                      value: `${assetData?.stepBaseQuantum}`,
                    },
                    {
                      key: 'subticks_per_tick',
                      label: 'subticks_per_tick',
                      value: `${assetData?.subticksPerTick}`,
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
                <Styled.Text0>title: </Styled.Text0>
                <Styled.Description>{utils.getGovAddNewMarketTitle(ticker)}</Styled.Description>

                <Styled.Text0>initial_deposit_amount:</Styled.Text0>
                <Styled.Description>
                  {
                    <Output
                      type={OutputType.Asset}
                      value={newMarketProposal.delayBlocks}
                      fractionDigits={0}
                    />
                  }
                </Styled.Description>

                <Styled.Text0>summary: </Styled.Text0>
                <Styled.Description>
                  {utils.getGovAddNewMarketSummary(ticker, newMarketProposal.delayBlocks)}
                </Styled.Description>
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
  gap: 1rem;
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

Styled.Text0 = styled.span`
  color: var(--color-text-0);
`;

Styled.Code = styled.div`
  background-color: var(--color-layer-1);
  padding: 1rem;
  border-radius: 10px;
  font-family: 'Fira Code', monospace;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

Styled.Line = styled.pre`
  margin-left: 1rem;
`;

Styled.Description = styled.p`
  margin-bottom: 1rem;
`;
