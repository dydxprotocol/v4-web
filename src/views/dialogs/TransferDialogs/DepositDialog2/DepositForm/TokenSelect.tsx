import { Dispatch, SetStateAction } from 'react';

import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';

import { CHAIN_INFO } from '@/constants/chains';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';
import { TokenBalance, TokenForTransfer } from '@/constants/tokens';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';

import { truncateAddress } from '@/lib/wallet';

import { getTokenSymbol } from '../../utils';
import { useDepositTokenBalances } from '../queries';

export const TokenSelect = ({
  disabled,
  onBack,
  token,
  setToken,
  onWalletAddressDeposit,
}: {
  // disable buttons to prevent tab events while TokenSelect has 0 height
  disabled?: boolean;
  onBack: () => void;
  token: TokenForTransfer;
  setToken: Dispatch<SetStateAction<TokenForTransfer>>;
  onWalletAddressDeposit?: () => void;
}) => {
  const stringGetter = useStringGetter();
  const { sourceAccount } = useAccounts();
  const { isLoading, withBalances, noBalances } = useDepositTokenBalances();

  const onTokenClick = (newToken: TokenForTransfer) => () => {
    setToken(newToken);
    onBack();
  };

  if (isLoading)
    return (
      <div tw="flex h-full flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  return (
    <div tw="flex flex-col gap-0.5 py-1">
      {withBalances.length > 0 && (
        <div tw="px-1.25 pt-0.125 font-medium text-color-text-0">
          {stringGetter({ key: STRING_KEYS.YOUR_TOKENS })}
        </div>
      )}
      <div tw="flex flex-col">
        {withBalances.map((balance) => (
          <TokenRow
            disabled={disabled}
            onClick={onTokenClick({
              chainId: balance.chainId,
              denom: balance.denom,
              decimals: balance.decimals!,
            })}
            balance={balance}
            token={token}
            withBalance
            key={balance.denom}
          />
        ))}
        {onWalletAddressDeposit && (
          <$TokenRowButton disabled={disabled} onClick={onWalletAddressDeposit}>
            <div tw="flex items-center gap-0.75">
              <div tw="flex size-[2rem] place-content-center">
                <Icon tw="[--icon-size:1.5rem]" iconName={IconName.Wallet} />
              </div>
              <div tw="flex flex-col items-start gap-0.125">
                <div tw="text-color-text-2 font-base-medium">
                  {stringGetter({ key: STRING_KEYS.SEND_TO_WALLET })}
                </div>
                <div tw="text-color-text-0 font-small-book">
                  {truncateAddress(sourceAccount.address, '0x')}
                </div>
              </div>
            </div>
            <$CaretIcon iconName={IconName.Caret} />
          </$TokenRowButton>
        )}
      </div>

      {noBalances.length > 0 && (
        <div tw="px-1.25 pt-0.125 font-medium text-color-text-0">
          {withBalances.length > 0
            ? stringGetter({ key: STRING_KEYS.OTHER_TOKENS })
            : stringGetter({ key: STRING_KEYS.SUPPORTED_TOKENS })}
        </div>
      )}

      <div tw="flex flex-col">
        {noBalances.map((balance) => (
          <TokenRow
            disabled={disabled}
            onClick={onTokenClick({
              chainId: balance.chainId,
              denom: balance.denom,
              decimals: balance.decimals!,
            })}
            key={balance.denom}
            balance={balance}
            token={token}
            withBalance={false}
          />
        ))}
      </div>
    </div>
  );
};

const TokenRow = ({
  balance,
  token,
  withBalance,
  disabled,
  onClick,
}: {
  balance: TokenBalance;
  withBalance: boolean;
  token: TokenForTransfer;
  disabled?: boolean;
  onClick: () => void;
}) => {
  return (
    <$TokenRowButton
      disabled={disabled}
      onClick={onClick}
      isSelected={token.denom === balance.denom}
    >
      <div tw="flex items-center gap-0.75">
        <AssetIcon
          tw="[--asset-icon-size:2rem]"
          symbol={getTokenSymbol(balance.denom)}
          chainId={balance.chainId}
        />
        <div tw="flex flex-col items-start gap-0.125">
          <div tw="text-color-text-2 font-base-medium">{getTokenSymbol(balance.denom)}</div>
          <div tw="text-color-text-0 font-small-book">{CHAIN_INFO[balance.chainId]?.name}</div>
        </div>
      </div>

      {withBalance && (
        <div tw="flex flex-col items-end gap-0.125">
          <Output
            tw="text-color-text-1 font-base-medium"
            fractionDigits={TOKEN_DECIMALS}
            type={OutputType.Number}
            value={BigNumber(balance.formattedAmount)}
          />
          <Output
            tw="text-color-text-0 font-small-book"
            fractionDigits={USD_DECIMALS}
            type={OutputType.SmallFiat}
            value={balance.valueUSD}
          />
        </div>
      )}
    </$TokenRowButton>
  );
};

const $TokenRowButton = styled.button.attrs({ type: 'button' })<{ isSelected?: boolean }>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 1rem 1.25rem;

  &:hover {
    background-color: var(--token-row-active-bgColor, var(--color-layer-4));
    --asset-icon-chain-icon-borderColor: var(--token-row-active-bgColor, var(--color-layer-4));
  }

  ${({ isSelected }) =>
    isSelected &&
    css`
      background-color: var(--token-row-active-bgColor, var(--color-layer-4));
      --asset-icon-chain-icon-borderColor: var(--token-row-active-bgColor, var(--color-layer-4));
    `}
`;

const $CaretIcon = styled(Icon)`
  width: 1rem;
  height: 1rem;
  min-width: 1rem;
  align-self: center;
  color: var(--color-text-0);
  transform: rotate(-0.25turn);
`;
