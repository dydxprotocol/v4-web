import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const tradeTooltips: TooltipStrings = {
  'account-leverage': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.ACCOUNT_LEVERAGE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.ACCOUNT_LEVERAGE_BODY }),
  }),
  'base-position-notional': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.BASE_POSITION_NOTIONAL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.BASE_POSITION_NOTIONAL_BODY }),
  }),
  'bracket-sl': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.BRACKET_ORDER_SL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.BRACKET_ORDER_SL_BODY }),
  }),
  'bracket-tp': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.BRACKET_ORDER_TP_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.BRACKET_ORDER_TP_BODY }),
  }),
  'buying-power': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.BUYING_POWER_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.BUYING_POWER_BODY, params: stringParams }),
  }),
  'default-execution': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.DEFAULT_EXECUTION_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.DEFAULT_EXECUTION_BODY }),
  }),
  equity: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.EQUITY_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.EQUITY_BODY }),
  }),
  'expected-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.EXPECTED_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.EXPECTED_PRICE_BODY }),
  }),
  fee: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.FEE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.FEE_BODY }),
  }),
  'fill-or-kill': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.FILL_OR_KILL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.FILL_OR_KILL_BODY }),
  }),
  'free-collateral': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.FREE_COLLATERAL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.FREE_COLLATERAL_BODY }),
  }),
  'good-til': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.GOOD_TIL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.GOOD_TIL_BODY }),
  }),
  'immediate-or-cancel': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.IMMEDIATE_OR_CANCEL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.IMMEDIATE_OR_CANCEL_BODY }),
  }),
  'index-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.INDEX_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.INDEX_PRICE_BODY }),
  }),
  'initial-margin-fraction': ({ stringGetter, urlConfigs }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.INITIAL_MARGIN_FRACTION_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.INITIAL_MARGIN_FRACTION_BODY }),
    learnMoreLink: urlConfigs?.initialMarginFractionLearnMore,
  }),
  'initial-stop': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.INITIAL_STOP_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.INITIAL_STOP_BODY }),
  }),
  leverage: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LEVERAGE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LEVERAGE_BODY }),
  }),
  'limit-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LIMIT_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LIMIT_PRICE_BODY }),
  }),
  'limit-price-slippage': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LIMIT_PRICE_SLIPPAGE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LIMIT_PRICE_SLIPPAGE_BODY }),
  }),
  'liquidation-price': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LIQUIDATION_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LIQUIDATION_PRICE_BODY, params: stringParams }),
  }),
  'liquidation-price-general': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LIQUIDATION_PRICE_GENERAL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LIQUIDATION_PRICE_GENERAL_BODY }),
  }),
  'liquidation-warning-long': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.STOP_LOSS_BELOW_LIQUIDATION_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.STOP_LOSS_BELOW_LIQUIDATION_PRICE_BODY }),
  }),
  'liquidation-warning-short': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.STOP_LOSS_ABOVE_LIQUIDATION_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.STOP_LOSS_ABOVE_LIQUIDATION_PRICE_BODY }),
  }),
  liquidity: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LIQUIDITY_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LIQUIDITY_BODY }),
  }),
  'maintenance-margin-fraction': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MAINTENANCE_MARGIN_FRACTION_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MAINTENANCE_MARGIN_FRACTION_BODY }),
  }),
  'max-reward': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MAXIMUM_REWARDS_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MAXIMUM_REWARDS_BODY }),
  }),
  'max-withdraw': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MAX_WITHDRAW_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MAX_WITHDRAW_BODY }),
  }),
  'maker-fee': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MAKER_FEE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MAKER_FEE_BODY }),
  }),
  'margin-usage': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MARGIN_USAGE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MARGIN_USAGE_BODY }),
  }),
  'maximum-leverage': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MAXIMUM_LEVERAGE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MAXIMUM_LEVERAGE_BODY }),
  }),
  'net-funding': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.NET_FUNDING_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.NET_FUNDING_BODY }),
  }),
  'open-interest': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.OPEN_INTEREST_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.OPEN_INTEREST_BODY }),
  }),
  'oracle-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.ORACLE_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.ORACLE_PRICE_BODY }),
  }),
  'order-amount': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.ORDER_AMOUNT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.ORDER_AMOUNT_BODY, params: stringParams }),
  }),
  'order-amount-usd': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.ORDER_AMOUNT_USD_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.ORDER_AMOUNT_USD_BODY, params: stringParams }),
  }),
  'partial-close-stop-loss': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.PARTIAL_CLOSE_STOP_LOSS_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.PARTIAL_CLOSE_STOP_LOSS_BODY }),
  }),
  'partial-close-take-profit': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.PARTIAL_CLOSE_TAKE_PROFIT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.PARTIAL_CLOSE_TAKE_PROFIT_BODY }),
  }),
  'post-only': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.POST_ONLY_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.POST_ONLY_BODY }),
  }),
  'post-only-timeinforce-gtt': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.POST_ONLY_TIMEINFORCE_GTT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.POST_ONLY_TIMEINFORCE_GTT_BODY }),
  }),
  'price-impact': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.PRICE_IMPACT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.PRICE_IMPACT_BODY }),
  }),
  'realized-pnl': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REALIZED_PNL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REALIZED_PNL_BODY }),
  }),
  'reduce-only': ({ stringGetter, urlConfigs }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REDUCE_ONLY_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REDUCE_ONLY_BODY }),
    learnMoreLink: urlConfigs?.reduceOnlyLearnMore,
  }),
  'reduce-only-execution-ioc-fok': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REDUCE_ONLY_EXECUTION_IOC_FOK_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REDUCE_ONLY_EXECUTION_IOC_FOK_BODY }),
  }),
  'reduce-only-timeinforce-ioc-fok': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REDUCE_ONLY_TIMEINFORCE_IOC_FOK_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REDUCE_ONLY_TIMEINFORCE_IOC_FOK_BODY }),
  }),
  'reference-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REFERENCE_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REFERENCE_PRICE_BODY }),
  }),
  spread: () => ({
    title: 'Spread',
    body: 'The difference in price between the highest bid (the price a buyer is willing to buy for) and lowest ask (the price a seller is willing to sell for) an asset.',
  }),
  'step-size': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.STEP_SIZE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.STEP_SIZE_BODY }),
  }),
  'taker-fee': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.TAKER_FEE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.TAKER_FEE_BODY }),
  }),
  'tick-size': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.TICK_SIZE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.TICK_SIZE_BODY }),
  }),
  'time-in-force': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.TIME_IN_FORCE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.TIME_IN_FORCE_BODY }),
  }),
  'trailing-percent': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.TRAILING_PERCENT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.TRAILING_PERCENT_BODY }),
  }),
  'trigger-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.TRIGGER_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.TRIGGER_PRICE_BODY }),
  }),
  'unrealized-pnl': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.UNREALIZED_PNL_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.UNREALIZED_PNL_BODY }),
  }),
  'reward-history': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REWARD_HISTORY_BODY }),
  }),
} as const;
