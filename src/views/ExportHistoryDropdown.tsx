import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { STRING_KEYS } from '@/constants/localization';

import { shallowEqual, useSelector } from 'react-redux';
import { getSubaccountFills, getSubaccountTransfers } from '@/state/accountSelectors';
import { useCallback, useMemo, useState } from 'react';
import { OutputType, formatNumber, formatTimestamp } from '@/components/Output';
import { MustBigNumber } from '@/lib/numbers';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import { getSelectedLocale } from '@/state/localizationSelectors';
import { exportCSV } from '@/lib/csv';
import { useLocaleSeparators, useStringGetter } from '@/hooks';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DropdownMenu, DropdownMenuProps } from '@/components/DropdownMenu';
import { Checkbox } from '@/components/Checkbox';
import styled, { AnyStyledComponent } from 'styled-components';
import { track } from '@/lib/analytics';
import { AnalyticsEvent } from '@/constants/analytics';

export const ExportHistoryDropdown = (props: DropdownMenuProps<string>) => {
  const { items = [], ...rest } = props;
  const selectedLocale = useSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const allTransfers = useSelector(getSubaccountTransfers, shallowEqual) ?? [];
  const allFills = useSelector(getSubaccountFills, shallowEqual) ?? [];
  const { decimal: localeDecimalSeparator, group: localeGroupSeparator } = useLocaleSeparators();
  const [checkedTrades, setCheckedTrades] = useState(true);
  const [checkedTransfers, setCheckedTransfers] = useState(true);

  const trades = useMemo(
    () =>
      allFills.map((fill) => {
        const { sign: feeSign, formattedString: feeString } = formatNumber({
          type: OutputType.Fiat,
          value: fill.fee,
          localeDecimalSeparator,
          localeGroupSeparator,
        });

        const { sign: totalSign, formattedString: totalString } = formatNumber({
          type: OutputType.Fiat,
          value: MustBigNumber(fill.price).times(fill.size),
          localeDecimalSeparator,
          localeGroupSeparator,
        });

        const { displayString } = formatTimestamp({
          type: OutputType.DateTime,
          value: fill.createdAtMilliseconds,
          locale: selectedLocale,
        });

        const sideKey = {
          [OrderSide.BUY]: STRING_KEYS.BUY,
          [OrderSide.SELL]: STRING_KEYS.SELL,
        }[fill.side.rawValue];

        return {
          type: fill.resources.typeStringKey && stringGetter({ key: fill.resources.typeStringKey }),
          liquidity:
            fill.resources.liquidityStringKey &&
            stringGetter({ key: fill.resources.liquidityStringKey }),
          time: displayString,
          amount: fill.size,
          fee: feeSign ? `${feeSign}${feeString}` : feeString,
          total: totalSign ? `${totalSign}${totalString}` : totalString,
          market: fill.marketId,
          side: sideKey
            ? stringGetter({
                key: sideKey,
              })
            : '',
        };
      }),
    [allFills, stringGetter, localeDecimalSeparator, localeGroupSeparator]
  );

  const transfers = useMemo(
    () =>
      allTransfers.map((transfer) => {
        const { sign, formattedString } = formatNumber({
          type: OutputType.Fiat,
          value: transfer.amount,
          localeDecimalSeparator,
          localeGroupSeparator,
        });

        const { displayString } = formatTimestamp({
          type: OutputType.DateTime,
          value: transfer.updatedAtMilliseconds,
          locale: selectedLocale,
        });

        return {
          time: displayString,
          action:
            transfer.resources.typeStringKey &&
            stringGetter({ key: transfer.resources.typeStringKey }),
          sender: transfer.fromAddress,
          recipient: transfer.toAddress,
          amount: sign ? `${sign}${formattedString}` : formattedString,
          transaction: transfer.transactionHash,
        };
      }),
    [allTransfers, stringGetter, localeDecimalSeparator, localeGroupSeparator]
  );

  const exportTrades = useCallback(() => {
    exportCSV(trades, {
      filename: 'trades',
      columnHeaders: [
        {
          key: 'time',
          displayLabel: stringGetter({ key: STRING_KEYS.TIME }),
        },
        {
          key: 'market',
          displayLabel: stringGetter({ key: STRING_KEYS.MARKET }),
        },
        {
          key: 'side',
          displayLabel: stringGetter({ key: STRING_KEYS.SIDE }),
        },
        {
          key: 'amount',
          displayLabel: stringGetter({ key: STRING_KEYS.AMOUNT }),
        },
        {
          key: 'total',
          displayLabel: stringGetter({ key: STRING_KEYS.TOTAL }),
        },
        {
          key: 'fee',
          displayLabel: stringGetter({ key: STRING_KEYS.FEE }),
        },
        {
          key: 'type',
          displayLabel: stringGetter({ key: STRING_KEYS.TYPE }),
        },
        {
          key: 'liquidity',
          displayLabel: stringGetter({ key: STRING_KEYS.LIQUIDITY }),
        },
      ],
    });
  }, [trades, stringGetter]);

  const exportTransfers = useCallback(() => {
    exportCSV(transfers, {
      filename: 'transfers',
      columnHeaders: [
        {
          key: 'time',
          displayLabel: stringGetter({ key: STRING_KEYS.TIME }),
        },
        {
          key: 'action',
          displayLabel: stringGetter({ key: STRING_KEYS.ACTION }),
        },
        {
          key: 'sender',
          displayLabel: stringGetter({ key: STRING_KEYS.TRANSFER_SENDER }),
        },
        {
          key: 'recipient',
          displayLabel: stringGetter({ key: STRING_KEYS.TRANSFER_RECIPIENT }),
        },
        {
          key: 'amount',
          displayLabel: stringGetter({ key: STRING_KEYS.AMOUNT }),
        },
        {
          key: 'transaction',
          displayLabel: stringGetter({ key: STRING_KEYS.TRANSACTION }),
        },
      ],
    });
  }, [transfers, stringGetter]);

  const exportData = useCallback(() => {
    if (checkedTrades) {
      exportTrades();
    }

    if (checkedTransfers) {
      exportTransfers();
    }

    track(AnalyticsEvent.ExportDownloadClick, { trades: checkedTrades, transfers: checkedTransfers })
  }, [checkedTrades, checkedTransfers, exportTrades, exportTransfers]);

  return (
    <DropdownMenu
      {...rest}
      onOpenChange={(open) => {
        if (open) {
          track(AnalyticsEvent.ExportButtonClick);
        }
      }}
      items={[
        ...items,
        {
          label: (
            <Checkbox
              disabled={trades.length === 0}
              label={stringGetter({ key: STRING_KEYS.TRADES })}
              checked={checkedTrades}
              onCheckedChange={() => {
                setCheckedTrades(!checkedTrades);

                track(AnalyticsEvent.ExportTradesCheckboxClick, { value: !checkedTrades });
              }}
            />
          ),
          value: 'trades',
          onSelect: (e) => e.preventDefault(),
        },
        {
          label: (
            <Checkbox
              disabled={transfers.length === 0}
              label={stringGetter({ key: STRING_KEYS.TRANSFERS })}
              checked={checkedTransfers}
              onCheckedChange={() => {
                setCheckedTransfers(!checkedTransfers);

                track(AnalyticsEvent.ExportTransfersCheckboxClick, { value: !checkedTrades });
              }}
            />
          ),
          value: 'transfers',
          onSelect: (e) => e.preventDefault(),
        },
        {
          label: (
            <Styled.Button
              state={{
                isDisabled:
                  (!checkedTrades && !checkedTransfers) ||
                  (transfers.length === 0 && trades.length === 0),
              }}
              action={ButtonAction.Primary}
              size={ButtonSize.XSmall}
            >
              {stringGetter({ key: STRING_KEYS.DOWNLOAD })}
            </Styled.Button>
          ),
          value: 'download',
          onSelect: exportData,
        },
      ]}
    >
      <Icon iconName={IconName.Download} />
      {stringGetter({ key: STRING_KEYS.EXPORT })}
    </DropdownMenu>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Button = styled(Button)`
  width: 100%;
`;
