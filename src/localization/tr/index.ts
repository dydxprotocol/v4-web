import appCopy from './app.json';
import errorCopy from './errors.json';
import tooltipCopy from './tooltips.json';
import warningCopy from './warnings.json';

export default {
  ...appCopy,
  ERRORS: errorCopy,
  TOOLTIPS: tooltipCopy,
  WARNINGS: warningCopy,
};
