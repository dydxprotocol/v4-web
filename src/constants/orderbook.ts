/**
 * @description Orderbook display constants
 */
export const ORDERBOOK_MAX_ROWS_PER_SIDE = 30;
export const ORDERBOOK_ANIMATION_DURATION = 100;

/**
 * @description Orderbook pixel constants
 * @note ORDERBOOK_ROW_HEIGHT should be a divisor of ORDERBOOK_HEIGHT so that we do not have a partial row at the bottom
 * @note To change the Orderbook width, --orderbook-trades-width and ORDERBOOK_WIDTH must be changed to the same value
 */
export const ORDERBOOK_HEIGHT = 756;
export const ORDERBOOK_WIDTH = 300;
export const ORDERBOOK_ROW_HEIGHT = 21;
export const ORDERBOOK_ROW_PADDING_RIGHT = 8;
