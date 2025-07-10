import { OrderSide } from '@dydxprotocol/v4-client-js';
import type {
  IChartingLibraryWidget,
  IOrderLineAdapter,
  IPositionLineAdapter,
} from 'public/tradingview/charting_library';

export type TvWidget = IChartingLibraryWidget & { _id?: string; _ready?: boolean };

export type PositionLineType = 'entry' | 'liquidation';
export type ChartLineType = OrderSide | PositionLineType;

export type ChartLine = {
  line: IOrderLineAdapter | IPositionLineAdapter;
  chartLineType: ChartLineType;
};
