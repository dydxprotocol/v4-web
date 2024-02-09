import type {
  IChartingLibraryWidget,
  IOrderLineAdapter,
  IPositionLineAdapter,
} from 'public/tradingview/charting_library';

export type TvWidget = IChartingLibraryWidget & { _id?: string; _ready?: boolean };

export type ChartLine = IOrderLineAdapter | IPositionLineAdapter;
