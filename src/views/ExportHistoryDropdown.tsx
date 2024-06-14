import { useCallback, useMemo, useState } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { AnalyticsEvent } from '@/constants/analytics';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Icon, IconName } from '@/components/Icon';
import { OutputType, formatNumber } from '@/components/Output';

import { getSubaccountFills, getSubaccountTransfers } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { track } from '@/lib/analytics';
import { exportCSV } from '@/lib/csv';
import { MustBigNumber } from '@/lib/numbers';

interface ExportHistoryDropdownProps {
  className?: string;
}

export const ExportHistoryDropdown = (props: ExportHistoryDropdownProps) => {
  const selectedLocale = useSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const allTransfers = useSelector(getSubaccountTransfers, shallowEqual) ?? [];
  const allFills = useSelector(getSubaccountFills, shallowEqual) ?? [];
  const [checkedTrades, setCheckedTrades] = useState(true);
  const [checkedTransfers, setCheckedTransfers] = useState(true);
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();

  const trades = useMemo(
    () =>
      allFills.map((fill) => {
        const { sign: feeSign, formattedString: feeString } = formatNumber({
          type: OutputType.Fiat,
          value: fill.fee,
          decimal: LOCALE_DECIMAL_SEPARATOR,
          group: LOCALE_GROUP_SEPARATOR,
        });

        const { sign: totalSign, formattedString: totalString } = formatNumber({
          type: OutputType.Fiat,
          value: MustBigNumber(fill.price).times(fill.size),
          decimal: LOCALE_DECIMAL_SEPARATOR,
          group: LOCALE_GROUP_SEPARATOR,
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
          time: new Date(fill.createdAtMilliseconds).toLocaleString(selectedLocale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
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
    [allFills, selectedLocale, stringGetter]
  );

  const transfers = useMemo(
    () =>
      allTransfers.map((transfer) => {
        const { sign, formattedString } = formatNumber({
          type: OutputType.Fiat,
          value: transfer.amount,
          decimal: LOCALE_DECIMAL_SEPARATOR,
          group: LOCALE_GROUP_SEPARATOR,
        });

        return {
          time: new Date(transfer.updatedAtMilliseconds).toLocaleString(selectedLocale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          action:
            transfer.resources.typeStringKey &&
            stringGetter({ key: transfer.resources.typeStringKey }),
          sender: transfer.fromAddress,
          recipient: transfer.toAddress,
          amount: sign ? `${sign}${formattedString}` : formattedString,
          transaction: transfer.transactionHash,
        };
      }),
    [allTransfers, selectedLocale, stringGetter]
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
    if (checkedTrades && trades.length > 0) {
      exportTrades();
    }

    if (checkedTransfers && transfers.length > 0) {
      exportTransfers();
    }

    track(AnalyticsEvent.ExportDownloadClick, {
      trades: checkedTrades && trades.length > 0,
      transfers: checkedTransfers && transfers.length > 0,
    });
  }, [checkedTrades, checkedTransfers, trades, transfers, exportTrades, exportTransfers]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          track(AnalyticsEvent.ExportButtonClick);
        }
      }}
      items={[
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
            <$Button
              state={{
                isDisabled:
                  (!checkedTrades && !checkedTransfers) ||
                  (transfers.length === 0 && trades.length === 0),
              }}
              action={ButtonAction.Primary}
              size={ButtonSize.XSmall}
            >
              {stringGetter({ key: STRING_KEYS.DOWNLOAD })}
            </$Button>
          ),
          value: 'download',
          onSelect: exportData,
        },
      ]}
      {...props}
    >
      <Icon iconName={IconName.Download} />
      {stringGetter({ key: STRING_KEYS.EXPORT })}
    </DropdownMenu>
  );
};

const $Button = styled(Button)`
  width: 100%;
`;
