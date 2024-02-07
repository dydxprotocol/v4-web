import { DEFAULT_MARKETID } from './markets';

export enum AppRoute {
  Markets = '/markets',
  Portfolio = '/portfolio',
  Trade = '/trade',
  Profile = '/profile',
  Alerts = '/alerts',
  Settings = '/settings',
  Terms = '/terms',
  Privacy = '/privacy',
}

export enum MarketsRoute {
  New = 'new',
}

export enum PortfolioRoute {
  Fees = 'fees',
  History = 'history',
  Orders = 'orders',
  Overview = 'overview',
  Positions = 'positions',
}

export enum HistoryRoute {
  Trades = 'trades',
  Transfers = 'transfers',
  Payments = 'payments',
}

export enum TokenRoute {
  TradingRewards = 'trading-rewards',
  StakingRewards = 'staking-rewards',
  Governance = 'governance',
}

export enum MobileSettingsRoute {
  Language = 'language',
  Notifications = 'notifications',
  Network = 'network',
}

export const TRADE_ROUTE = `${AppRoute.Trade}/:market`;
export const PORTFOLIO_ROUTE = `${AppRoute.Portfolio}/:subroute`;
export const HISTORY_ROUTE = `${AppRoute.Portfolio}/${PortfolioRoute.History}/:subroute`;
export const DEFAULT_TRADE_ROUTE = `${AppRoute.Trade}/${DEFAULT_MARKETID}`;
export const SETTINGS_ROUTE = `${AppRoute.Settings}/*`;
export const DEFAULT_DOCUMENT_TITLE = 'dYdX';
