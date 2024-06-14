import { useCallback, useState } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import { useSelector } from 'react-redux';
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

import { getSubaccountId } from '@/state/accountSelectors';
import { getSelectedLocale } from '@/state/localizationSelectors';

import { useAccounts } from '@/hooks/useAccounts';
import { useDydxClient } from '@/hooks/useDydxClient';
import { useLocaleSeparators } from '@/hooks/useLocaleSeparators';
import { track } from '@/lib/analytics';
import { exportCSV } from '@/lib/csv';
import { MustBigNumber } from '@/lib/numbers';
import { useAppSelector } from '@/state/appTypes';

interface ExportHistoryDropdownProps {
  className?: string;
}

export const ExportHistoryDropdown = (props: ExportHistoryDropdownProps) => {
  const selectedLocale = useSelector(getSelectedLocale);
  const stringGetter = useStringGetter();
  const subaccountNumber = useAppSelector(getSubaccountId);
  const { dydxAddress } = useAccounts();
  const { requestAllAccountFills, requestAllAccountTransfers } = useDydxClient();
  const [checkedTrades, setCheckedTrades] = useState(true);
  const [checkedTransfers, setCheckedTransfers] = useState(true);
  const { decimal: LOCALE_DECIMAL_SEPARATOR, group: LOCALE_GROUP_SEPARATOR } =
    useLocaleSeparators();

  const exportTrades = useCallback(async () => {
    if (dydxAddress && subaccountNumber !== undefined) {
      const trades = await requestAllAccountFills(dydxAddress, subaccountNumber);

      const csvTrades = trades.map((fill) => {
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
        }[fill.side];

        return {
          type: fill.type,
          liquidity: fill.liquidity,
          time: new Date(fill.createdAt).toLocaleString(selectedLocale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          amount: fill.size,
          fee: feeSign ? `${feeSign}${feeString}` : feeString,
          total: totalSign ? `${totalSign}${totalString}` : totalString,
          market: fill.market,
          side: sideKey
            ? stringGetter({
                key: sideKey,
              })
            : '',
        };
      })

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
  }, [dydxAddress, subaccountNumber, selectedLocale, stringGetter]);

  const exportTransfers = useCallback(async () => {
    if (dydxAddress && subaccountNumber !== undefined) {
      const transfers = await requestAllAccountTransfers(dydxAddress, subaccountNumber);

      const csvTransfers = transfers.map((transfer) => {
        const { sign, formattedString } = formatNumber({
          type: OutputType.Fiat,
          value: transfer.size,
          decimal: LOCALE_DECIMAL_SEPARATOR,
          group: LOCALE_GROUP_SEPARATOR,
        });

        return {
          time: new Date(transfer.createdAt).toLocaleString(selectedLocale, {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
          action: transfer.type,
          sender: transfer.sender.address,
          recipient: transfer.recipient.address,
          amount: sign ? `${sign}${formattedString}` : formattedString,
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
  }, [dydxAddress, subaccountNumber, selectedLocale, stringGetter]);

  const exportData = useCallback(() => {
    if (checkedTrades) {
      exportTrades();
    }

    if (checkedTransfers) {
      exportTransfers();
    }

    track(AnalyticsEvent.ExportDownloadClick, {
      trades: checkedTrades,
      transfers: checkedTransfers,
    });
  }, [checkedTrades, checkedTransfers, exportTrades, exportTransfers]);

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
                  (!checkedTrades && !checkedTransfers),
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
