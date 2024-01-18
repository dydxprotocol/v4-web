import { useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { MOCK_ORACLE_DATA, MOCK_DATA, INITIAL_DEPOSIT_AMOUNT } from '@/constants/potentialMarkets';

import { Details } from '@/components/Details';
import { Dialog } from '@/components/Dialog';
import { Tag, TagType } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
  assetData?: (typeof MOCK_DATA)[number];
  liquidityTier?: string;
};

export enum CodeToggleGroup {
  CREATE_ORACLE = 'CREATE_ORACLE',
  MSG_CREATE_PERPETUAL = 'MSG_CREATE_PERPETUAL',
  MSG_CREATE_CLOB_PAIR = 'MSG_CREATE_CLOB_PAIR',
  MSG_UPDATE_CLOB_PAIR = 'MSG_UPDATE_CLOB_PAIR',
  MSG_DELAY_MESSAGE = 'MSG_DELAY_MESSAGE',
  MSG_SUBMIT_PROPOSAL = 'MSG_SUBMIT_PROPOSAL',
}

export const NewMarketMessageDetailsDialog = ({
  assetData,
  liquidityTier,
  preventClose,
  setIsOpen,
}: ElementProps) => {
  const [codeToggleGroup, setCodeToggleGroup] = useState(CodeToggleGroup.CREATE_ORACLE);
  const { symbol } = assetData ?? {};

  const oracleData = useMemo(() => {
    const oracleData: Record<string, (typeof MOCK_ORACLE_DATA)[number][]> = {};
    Object.values(MOCK_ORACLE_DATA).forEach((exchangeConfig) => {
      const baseAsset = exchangeConfig.base_asset;
      if (oracleData[baseAsset]) {
        oracleData[baseAsset].push(exchangeConfig);
      } else {
        oracleData[baseAsset] = [exchangeConfig];
      }
    });
    return oracleData;
  }, []);

  const oracleDataForAsset = useMemo(() => {
    return symbol ? oracleData[symbol] : undefined;
  }, [symbol]);

  const ticker = useMemo(() => `${symbol}-USD`, [symbol]);

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
        value: CodeToggleGroup.MSG_UPDATE_CLOB_PAIR,
        label: 'Msg update clobPair',
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
      title="Message Details - Advanced"
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
              <div>
                <Details
                  layout="column"
                  items={[
                    {
                      key: 'id',
                      label: 'market_id',
                      value: '34',
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
                      value: `${assetData?.minPriceChange}`,
                    },
                  ]}
                />
                <Styled.Text0>
                  exchange_config_json{' '}
                  {oracleDataForAsset && (
                    <Tag type={TagType.Number}>{oracleDataForAsset.length}</Tag>
                  )}
                </Styled.Text0>
                {oracleDataForAsset?.map((exchangeConfig) => {
                  return (
                    <Styled.Code key={exchangeConfig.exchange}>
                      {'{'}
                      {Object.keys(exchangeConfig).map((key) => (
                        <Styled.Line key={key}>
                          {key}: <span>{exchangeConfig[key as keyof typeof exchangeConfig]}</span>
                        </Styled.Line>
                      ))}
                      {'}'}
                    </Styled.Code>
                  );
                })}
              </div>
            ),
            [CodeToggleGroup.MSG_CREATE_PERPETUAL]: (
              <div>
                <Details
                  layout="column"
                  items={[
                    {
                      key: 'perpetual_id',
                      label: 'perpetual_id',
                      value: '34',
                    },
                    {
                      key: 'market_id',
                      label: 'market_id',
                      value: '34',
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
              </div>
            ),
            [CodeToggleGroup.MSG_CREATE_CLOB_PAIR]: (
              <div>
                <Details
                  layout="column"
                  items={[
                    {
                      key: 'clob_id',
                      label: 'clob_id',
                      value: '34',
                    },
                    {
                      key: 'perpetual_id',
                      label: 'perpetual_id',
                      value: '34',
                    },
                    {
                      key: 'quantum_conversion_exponent',
                      label: 'quantum_conversion_exponent',
                      value: `${assetData?.quantumConversionExponent}`,
                    },
                    {
                      key: 'step_base_quantums',
                      label: 'step_base_quantums',
                      value: `${assetData?.stepBaseQuantums}`,
                    },
                    {
                      key: 'subticks_per_tick',
                      label: 'subticks_per_tick',
                      value: `${assetData?.subticksPerTick}`,
                    },
                  ]}
                />
              </div>
            ),
            [CodeToggleGroup.MSG_UPDATE_CLOB_PAIR]: (
              <div>
                <Details
                  layout="column"
                  items={[
                    {
                      key: 'clob_id',
                      label: 'clob_id',
                      value: '34',
                    },
                    {
                      key: 'perpetual_id',
                      label: 'perpetual_id',
                      value: '34',
                    },
                    {
                      key: 'quantum_conversion_exponent',
                      label: 'quantum_conversion_exponent',
                      value: `${assetData?.quantumConversionExponent}`,
                    },
                    {
                      key: 'step_base_quantums',
                      label: 'step_base_quantums',
                      value: `${assetData?.stepBaseQuantums}`,
                    },
                    {
                      key: 'subticks_per_tick',
                      label: 'subticks_per_tick',
                      value: `${assetData?.subticksPerTick}`,
                    },
                  ]}
                />
              </div>
            ),
            [CodeToggleGroup.MSG_DELAY_MESSAGE]: (
              <div>
                <Details
                  layout="column"
                  items={[
                    {
                      key: 'delay_blocks',
                      label: 'delay_blocks',
                      value: '10',
                    },
                  ]}
                />
              </div>
            ),
            [CodeToggleGroup.MSG_SUBMIT_PROPOSAL]: (
              <div>
                <Styled.Text0>title: </Styled.Text0>
                <p>Add {ticker} perpetual market</p>

                <Details
                  layout="column"
                  items={[
                    {
                      key: 'initial_deposit_amount',
                      label: 'initial_deposit_amount',
                      value: `${INITIAL_DEPOSIT_AMOUNT}`,
                    },
                  ]}
                />

                <Styled.Text0>summary: </Styled.Text0>
                <p>
                  {`Add the x/prices, x/perpetuals and x/clob parameters needed for a ${1} perpetual market. Create the market in INITIALIZING status and transition it to ACTIVE status after ${2} blocks.`}
                </p>
              </div>
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
`;

Styled.Line = styled.pre`
  margin-left: 0.5rem;
`;
