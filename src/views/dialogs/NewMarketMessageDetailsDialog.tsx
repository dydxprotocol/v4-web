import { useMemo, useState } from 'react';

import { utils } from '@dydxprotocol/v4-client-js';
import styled from 'styled-components';

import { DialogProps, NewMarketMessageDetailsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { MenuItem } from '@/constants/menus';
import { isMainnet } from '@/constants/networks';

import { useGovernanceVariables } from '@/hooks/useGovernanceVariables';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { Details } from '@/components/Details';
import { Dialog } from '@/components/Dialog';
import { Output, OutputType } from '@/components/Output';
import { Tag, TagType } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { MustBigNumber } from '@/lib/numbers';

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
}: DialogProps<NewMarketMessageDetailsDialogProps>) => {
  const [codeToggleGroup, setCodeToggleGroup] = useState(CodeToggleGroup.CREATE_ORACLE);
  const { baseAsset, params, title } = assetData ?? {};
  const {
    ticker,
    marketType,
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

  const toggleGroupItems: MenuItem<CodeToggleGroup>[] = useMemo(() => {
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
      <div tw="mt-1 flex w-full flex-col gap-1 rounded-[10px] bg-color-layer-3">
        <$Tabs
          items={toggleGroupItems}
          value={codeToggleGroup}
          onValueChange={setCodeToggleGroup}
        />
        {
          {
            [CodeToggleGroup.CREATE_ORACLE]: (
              <$Code>
                <$Details
                  withOverflow
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
                <div tw="mt-0.5">
                  <span tw="text-color-text-0">
                    exchange_config_json
                    {exchangeConfig && (
                      <Tag type={TagType.Number} tw="mx-[0.5ch] my-0">
                        {exchangeConfig.length}
                      </Tag>
                    )}
                  </span>
                  [
                  {exchangeConfig?.map((exchange) => {
                    return (
                      <div
                        key={exchange.exchangeName}
                        style={{ padding: 0, margin: 0, paddingLeft: '0.5rem' }}
                        tw="p-1"
                      >
                        {'{'}
                        {Object.keys(exchange).map((key) => (
                          <pre key={key} tw="ml-1">
                            {key}: <span>{exchange[key as keyof typeof exchange]}</span>
                          </pre>
                        ))}
                        {'},'}
                      </div>
                    );
                  })}
                  ]
                </div>
              </$Code>
            ),
            [CodeToggleGroup.MSG_CREATE_PERPETUAL]: (
              <$Code>
                <$Details
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
                      value: `${liquidityTier}`,
                    },
                    {
                      key: 'market_type',
                      label: 'market_type',
                      value: marketType ?? 'PERPETUAL_MARKET_TYPE_CROSS',
                    },
                  ]}
                />
              </$Code>
            ),
            [CodeToggleGroup.MSG_CREATE_CLOB_PAIR]: (
              <$Code>
                <$Details
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
              </$Code>
            ),
            [CodeToggleGroup.MSG_DELAY_MESSAGE]: (
              <$Code>
                <$Details
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
                <$Details
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
              </$Code>
            ),
            [CodeToggleGroup.MSG_SUBMIT_PROPOSAL]: (
              <$Code>
                <$Details
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
                        <p tw="ml-0.5 text-justify">
                          {utils.getGovAddNewMarketSummary(ticker, newMarketProposal.delayBlocks)}
                        </p>
                      ),
                    },
                  ]}
                />
              </$Code>
            ),
          }[codeToggleGroup]
        }
      </div>
    </Dialog>
  );
};
const $Tabs = styled(ToggleGroup)`
  overflow-x: auto;
` as typeof ToggleGroup;

const $Details = styled(Details)`
  --details-item-height: 1.5rem;

  dt {
    width: max-content;
  }

  dd {
    overflow-x: auto;
    text-overflow: ellipsis;
  }
`;

const $Code = styled.div`
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
