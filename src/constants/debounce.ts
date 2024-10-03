/**
 * Quick debounce time for very frequent actions, such as keypress or input events.
 * Prevents excessive dispatching without adding noticeable delay.
 * Example: Search input field debounce.
 */
export const QUICK_DEBOUNCE_MS = 50;

/**
 * Normal debounce time for standard UI interactions, like button clicks or toggles.
 * Helps to prevent unintentional double clicks or spamming, while maintaining a responsive feel.
 * Example: Checkbox toggles, button click actions.
 */
export const NORMAL_DEBOUNCE_MS = 200;

/**
 * Moderate debounce time for actions involving moderate processing or network requests.
 * Reduces excessive calls or renders while still responding fairly quickly.
 * Example: API requests, form validation.
 */
export const MODERATE_DEBOUNCE_MS = 500;

/**
 * Heavy debounce time for expensive operations or network-heavy actions.
 * Used sparingly for cases where performance is a concern due to complex or resource-intensive tasks.
 * Example: Bulk data processing, heavy API calls.
 */
export const HEAVY_DEBOUNCE_MS = 1000;
