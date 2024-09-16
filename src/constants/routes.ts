import { DEFAULT_MARKETID } from './markets';

export enum AppRoute {
  Markets = '/markets',
  Vault = '/vault',
  Portfolio = '/portfolio',
  Trade = '/trade',
  Profile = '/profile',
  Alerts = '/alerts',
  Settings = '/settings',
  Terms = '/terms',
  Privacy = '/privacy',
  Affiliates = '/affiliates',
  LaunchMarket = '/launch-market',
}

export enum MarketsRoute {
  New = 'new',
}

export enum AffiliateRoute {
  Leaderboard = 'leaderboard',
  ProgramStats = 'program-stats',
}

export enum PortfolioRoute {
  EquityTiers = 'equity-tiers',
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

export enum MobileSettingsRoute {
  Language = 'language',
  Notifications = 'notifications',
  Network = 'network',
}

export const BASE_ROUTE = import.meta.env.VITE_ROUTER_TYPE === 'hash' ? '/#' : '';
export const TRADE_ROUTE = `${AppRoute.Trade}/:market`;
export const DEFAULT_TRADE_ROUTE = `${AppRoute.Trade}/${DEFAULT_MARKETID}`;
export const DEFAULT_DOCUMENT_TITLE = 'dYdX';
