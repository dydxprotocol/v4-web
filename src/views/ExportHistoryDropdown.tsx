import { useCallback, useState } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { useMutation } from '@tanstack/react-query';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Icon, IconName } from '@/components/Icon';
import { OutputType, formatNumberOutput } from '@/components/Output';

import { getIsAccountConnected, getSubaccountId } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { track } from '@/lib/analytics/amplitude';
import { exportCSV } from '@/lib/csv';
import { MustBigNumber } from '@/lib/numbers';

interface ExportHistoryDropdownProps {
  className?: string;
}

export const ExportHistoryDropdown = (props: ExportHistoryDropdownProps) => {
  const selectedLocale = useAppSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const subaccountNumber = useAppSelector(getSubaccountId);
  const { dydxAddress } = useAccounts();
  const isAccountConnected = useAppSelector(getIsAccountConnected);
  const { requestAllAccountFills, requestAllAccountTransfers } = useDydxClient();
  const [checkedTrades, setCheckedTrades] = useState(true);
  const [checkedTransfers, setCheckedTransfers] = useState(true);
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();

  const exportTrades = useCallback(async () => {
    if (dydxAddress && subaccountNumber !== undefined) {
      const trades = await requestAllAccountFills(dydxAddress, subaccountNumber);

      const csvTrades = trades.map((fill) => {
        const fee = formatNumberOutput(fill.fee, OutputType.Fiat, {
          decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
          groupSeparator: LOCALE_GROUP_SEPARATOR,
          selectedLocale,
        });

        const price = formatNumberOutput(fill.price, OutputType.Fiat, {
          decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
          groupSeparator: LOCALE_GROUP_SEPARATOR,
          selectedLocale,
        });

        const total = formatNumberOutput(
          MustBigNumber(fill.price).times(fill.size),
          OutputType.Fiat,
          {
            decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
            groupSeparator: LOCALE_GROUP_SEPARATOR,
            selectedLocale,
          }
        );

        const sideKey = {
          [OrderSide.BUY]: STRING_KEYS.BUY,
          [OrderSide.SELL]: STRING_KEYS.SELL,
        }[fill.side];

        return {
          type: fill.type,
          liquidity: fill.liquidity,
          time: new Date(fill.createdAt).toLocaleString(selectedLocale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          amount: fill.size,
          price,
          fee,
          total,
          market: fill.market,
          side: sideKey
            ? stringGetter({
                key: sideKey,
              })
            : '',
        };
      });

      exportCSV(csvTrades, {
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
            key: 'price',
            displayLabel: stringGetter({ key: STRING_KEYS.PRICE }),
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
    }
  }, [
    dydxAddress,
    subaccountNumber,
    requestAllAccountFills,
    stringGetter,
    LOCALE_DECIMAL_SEPARATOR,
    LOCALE_GROUP_SEPARATOR,
    selectedLocale,
  ]);

  const exportTransfers = useCallback(async () => {
    if (dydxAddress && subaccountNumber !== undefined) {
      const transfers = await requestAllAccountTransfers(dydxAddress, subaccountNumber);

      const csvTransfers = transfers.map((transfer) => {
        const amount = formatNumberOutput(transfer.size, OutputType.Fiat, {
          decimalSeparator: LOCALE_DECIMAL_SEPARATOR,
          groupSeparator: LOCALE_GROUP_SEPARATOR,
          selectedLocale,
        });

        return {
          time: new Date(transfer.createdAt).toLocaleString(selectedLocale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          action: transfer.type,
          sender: transfer.sender.address,
          recipient: transfer.recipient.address,
          amount,
          transaction: transfer.transactionHash,
        };
      });

      exportCSV(csvTransfers, {
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
    }
  }, [
    dydxAddress,
    subaccountNumber,
    requestAllAccountTransfers,
    stringGetter,
    LOCALE_DECIMAL_SEPARATOR,
    LOCALE_GROUP_SEPARATOR,
    selectedLocale,
  ]);

  const { mutate: mutateExportTrades, isPending: isPendingExportTrades } = useMutation({
    mutationFn: exportTrades,
  });

  const { mutate: mutateExportTransfers, isPending: isPendingExportTransfers } = useMutation({
    mutationFn: exportTransfers,
  });

  const exportData = useCallback(
    (e: Event) => {
      e.preventDefault();

      if (checkedTrades) {
        mutateExportTrades();
      }

      if (checkedTransfers) {
        mutateExportTransfers();
      }

      track(
        AnalyticsEvents.ExportDownloadClick({
          trades: checkedTrades,
          transfers: checkedTransfers,
        })
      );
    },
    [checkedTrades, checkedTransfers, mutateExportTrades, mutateExportTransfers]
  );

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          track(AnalyticsEvents.ExportCsvClick());
        }
      }}
      items={[
        {
          label: (
            <Checkbox
              label={stringGetter({ key: STRING_KEYS.TRADES })}
              checked={checkedTrades}
              onCheckedChange={() => {
                setCheckedTrades(!checkedTrades);

                track(AnalyticsEvents.ExportTradesCheckboxClick({ value: !checkedTrades }));
              }}
            />
          ),
          value: 'trades',
          onSelect: (e) => e.preventDefault(),
        },
        {
          label: (
            <Checkbox
              label={stringGetter({ key: STRING_KEYS.TRANSFERS })}
              checked={checkedTransfers}
              onCheckedChange={() => {
                setCheckedTransfers(!checkedTransfers);

                track(AnalyticsEvents.ExportTransfersCheckboxClick({ value: !checkedTrades }));
              }}
            />
          ),
          value: 'transfers',
          onSelect: (e) => e.preventDefault(),
        },
        {
          label: (
            <Button
              state={{
                isDisabled: !checkedTrades && !checkedTransfers,
                isLoading: isPendingExportTrades || isPendingExportTransfers,
              }}
              action={ButtonAction.Primary}
              size={ButtonSize.XSmall}
              tw="w-full"
            >
              {stringGetter({ key: STRING_KEYS.DOWNLOAD })}
            </Button>
          ),
          value: 'download',
          onSelect: exportData,
        },
      ]}
      triggerOptions={{
        disabled: !isAccountConnected,
      }}
      {...props}
    >
      <Icon iconName={IconName.Download} />
      {stringGetter({ key: STRING_KEYS.EXPORT })}
    </DropdownMenu>
  );
};
