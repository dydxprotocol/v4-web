/**
 * Chart Configuration
 * 
 * This file controls which chart implementation to use throughout the app.
 * Set USE_WIDGET_CHARTS to true to use the new TradingView widget-based charts,
 * or false to use the original charting library charts.
 */

export const USE_WIDGET_CHARTS = true;

/**
 * Symbol mapping from your market IDs to TradingView symbols
 * Add your market mappings here
 */
export const MARKET_SYMBOL_MAP: Record<string, string> = {
    // Example mappings - replace with your actual market symbols
    'MIRGOR': 'BCBA:MIRG',
    'BTC-USD': 'CRYPTOCAP:BTC',
    'ETH-USD': 'CRYPTOCAP:ETH',
    'AAPL': 'NASDAQ:AAPL',
    'MSFT': 'NASDAQ:MSFT',
    'GOOGL': 'NASDAQ:GOOGL',
    // Add more mappings as needed
};

/**
 * Resolution mapping from TradingView charting library to widget intervals
 * Based on TradingView widget documentation:
 * - Ticks: xT (1T — one tick)
 * - Seconds: xS (1S — one second) 
 * - Minutes: x (1 — one minute)
 * - Hours: x minutes (60 — one hour)
 * - Days: xD (1D — one day)
 * - Weeks: xW (1W — one week)
 * - Months: xM (1M — one month)
 * - Years: xM months (12M — one year)
 */
export const RESOLUTION_TO_WIDGET_INTERVAL: Record<string, string> = {
    '1': '1',      // 1 minute
    '5': '5',      // 5 minutes
    '15': '15',    // 15 minutes
    '30': '30',    // 30 minutes
    '60': '60',    // 1 hour
    '240': '240',  // 4 hours
    '1D': '1D',    // 1 day
    '1W': '1W',    // 1 week
    '1M': '1M',    // 1 month
    '12M': '12M',  // 1 year
};

/**
 * Default TradingView widget settings
 */
export const DEFAULT_WIDGET_SETTINGS = {
    timezone: 'Etc/UTC',
    style: '1' as const,
    locale: 'en',
    enable_publishing: false,
    allow_symbol_change: false,
    hide_top_toolbar: true,
    hide_legend: false,
    save_image: true,
    studies: ['Volume@tv-basicstudies'],
    disabled_features: ['use_localstorage_for_settings'],
    enabled_features: ['study_templates'],
    autosize: true,
    // Additional settings to reduce gaps and improve styling
    loading_screen: {
        backgroundColor: 'transparent',
        foregroundColor: 'transparent',
    },
    // Use standard TradingView dark theme colors that work reliably
    backgroundColor: '#000000',
    gridColor: '#363c4e',
    toolbar_bg: '#2a2e39',
};
