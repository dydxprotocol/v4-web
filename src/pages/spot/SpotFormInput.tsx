import { forwardRef, useCallback, useId, useImperativeHandle, useRef } from 'react';

import { SpotBuyInputType, SpotSellInputType, SpotSide } from '@/bonsai/forms/spot';
import styled from 'styled-components';

import { AlertType } from '@/constants/alerts';
import { ButtonAction, ButtonSize, ButtonStyle } from '@/constants/buttons';
import { PERCENT_DECIMALS, TOKEN_DECIMALS, USD_DECIMALS } from '@/constants/numbers';

import { AlertMessage } from '@/components/AlertMessage';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputProps, InputType } from '@/components/Input';
import { Output, OutputType } from '@/components/Output';
import { TabGroup, TabOption } from '@/components/TabGroup';

const INPUT_CONFIG_MAP = {
  [SpotSide.BUY]: {
    [SpotBuyInputType.SOL]: {
      decimals: TOKEN_DECIMALS,
      type: InputType.Number,
    },
    [SpotBuyInputType.USD]: {
      decimals: USD_DECIMALS,
      type: InputType.Currency,
    },
  },
  [SpotSide.SELL]: {
    [SpotSellInputType.PERCENT]: {
      decimals: PERCENT_DECIMALS,
      type: InputType.Percent,
    },
    [SpotSellInputType.SOL]: {
      decimals: TOKEN_DECIMALS,
      type: InputType.Number,
    },
  },
} as const;

const TAB_OPTIONS_MAP: Record<SpotSide, TabOption<SpotSellInputType | SpotBuyInputType>[]> = {
  [SpotSide.SELL]: [
    {
      label: <Icon iconName={IconName.PercentSign} />,
      value: SpotSellInputType.PERCENT,
    },
    {
      label: <Icon iconName={IconName.SolanaSimple} />,
      value: SpotSellInputType.SOL,
    },
  ],
  [SpotSide.BUY]: [
    {
      label: <Icon iconName={IconName.DollarSign} />,
      value: SpotBuyInputType.USD,
    },
    {
      label: <Icon iconName={IconName.SolanaSimple} />,
      value: SpotBuyInputType.SOL,
    },
  ],
};

export type SpotFormInputProps = {
  className?: string;
  tokenSymbol: string;
  tokenAmount: number;
  balances: {
    sol: number;
    token: number;
  };
  side: SpotSide;
  inputType: SpotBuyInputType | SpotSellInputType;
  onInputTypeChange: (side: SpotSide, inputType: SpotBuyInputType | SpotSellInputType) => void;
  validationConfig?: {
    type: AlertType;
    message: string;
  };
} & InputProps;

export const SpotFormInput = forwardRef<HTMLInputElement, SpotFormInputProps>(
  (
    {
      className,
      validationConfig,
      inputType,
      side,
      balances,
      tokenSymbol,
      tokenAmount,
      onInputTypeChange,
      ...inputProps
    },
    ref
  ) => {
    const id = useId();
    const internalRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => internalRef.current!, []);

    const handleContainerClick = useCallback(() => {
      if (!internalRef.current) return;
      internalRef.current.focus();
    }, []);

    const handleInputTypeChange = useCallback(
      (value: SpotBuyInputType | SpotSellInputType) => {
        onInputTypeChange(side, value);
      },
      [onInputTypeChange, side]
    );

    const inputConfig =
      side === SpotSide.BUY
        ? INPUT_CONFIG_MAP[SpotSide.BUY][inputType as SpotBuyInputType]
        : INPUT_CONFIG_MAP[SpotSide.SELL][inputType as SpotSellInputType];

    const tabGroupOptions = TAB_OPTIONS_MAP[side];

    const mergedProps = {
      ...inputProps,
      ...inputConfig,
    } as InputProps;

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div tw="flex flex-col gap-[0.75rem] text-color-text-0" onClick={handleContainerClick}>
        <div
          className={className}
          tw="flex cursor-text flex-col gap-[0.5rem] rounded-[0.5rem] border border-solid border-color-layer-4 bg-color-layer-3 p-[0.75rem]"
        >
          <div tw="row justify-between gap-1 font-small-medium">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label htmlFor={id}>Amount</label>
            <div tw="row gap-[0.25rem]">
              <Icon iconName={IconName.Wallet3} />
              <Output
                tw="text-color-text-1"
                value={side === SpotSide.BUY ? balances.sol : balances.token}
                type={OutputType.Asset}
                slotRight={side === SpotSide.BUY ? ' SOL' : ` ${tokenSymbol}`}
              />
              <IconButton
                iconName={IconName.PlusCircle}
                buttonStyle={ButtonStyle.WithoutBackground}
                size={ButtonSize.XXSmall}
                action={ButtonAction.Primary}
              />
            </div>
          </div>
          <div tw="row gap-[0.5rem]">
            <div tw="flex min-w-0 flex-1 flex-col gap-[0.25rem]">
              <$Input ref={internalRef} {...mergedProps} id={id} />
              <Output
                tw="font-mini-medium"
                value={tokenAmount}
                type={OutputType.Asset}
                slotLeft="≈ "
                slotRight={` ${tokenSymbol}`}
              />
            </div>
            <div>
              <$TabGroup
                onTabChange={handleInputTypeChange}
                options={tabGroupOptions}
                value={inputType}
              />
            </div>
          </div>
        </div>
        {validationConfig && (
          <AlertMessage type={validationConfig.type}>{validationConfig.message}</AlertMessage>
        )}
      </div>
    );
  }
);

const $Input = styled(Input)`
  --input-font: var(--font-medium-medium);
` as typeof Input;

const $TabGroup = styled(TabGroup)`
  --tab-group-height: 2rem;
` as typeof TabGroup;
