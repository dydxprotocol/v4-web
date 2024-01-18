import { useMemo, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { MOCK_ORACLE_DATA, MOCK_DATA } from '@/constants/potentialMarkets';

import { Dialog } from '@/components/Dialog';
import { Tag, TagType } from '@/components/Tag';
import { ToggleGroup } from '@/components/ToggleGroup';

import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps = {
  preventClose?: boolean;
  setIsOpen?: (open: boolean) => void;
  assetData?: (typeof MOCK_DATA)[number];
};

export enum CodeToggleGroup {
  CREATE_ORACLE = 'CREATE_ORACLE',
  MSG_CREATE_PERPETUAL = 'MSG_CREATE_PERPETUAL',
  MSG_CREATE_CLOB_PAIR = 'MSG_CREATE_CLOB_PAIR',
  MSG_DELAY_MESSAGE = 'MSG_DELAY_MESSAGE',
}

export const NewMarketMessageDetailsDialog = ({
  assetData,
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
                <h2>
                  Exchange Configs{' '}
                  {oracleDataForAsset && (
                    <Tag type={TagType.Number}>{oracleDataForAsset.length}</Tag>
                  )}
                </h2>
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
            [CodeToggleGroup.MSG_CREATE_PERPETUAL]: <div>MSG_CREATE_PERPETUAL</div>,
            [CodeToggleGroup.MSG_CREATE_CLOB_PAIR]: <div>MSG_CREATE_CLOB_PAIR</div>,
            [CodeToggleGroup.MSG_DELAY_MESSAGE]: <div>MSG_DELAY_MESSAGE</div>,
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
