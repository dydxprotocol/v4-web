import type { IChartingLibraryWidget } from 'public/tradingview/charting_library';

export type TvWidget = IChartingLibraryWidget & { _id?: string; _ready?: boolean };
