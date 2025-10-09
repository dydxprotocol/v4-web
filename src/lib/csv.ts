import { ConfigOptions, download, generateCsv, mkConfig } from 'export-to-csv';

export const exportCSV = <T extends object>(data: T[], options: ConfigOptions = {}) => {
  const { filename = 'generated', showColumnHeaders = true, ...rest } = options;
  const config = mkConfig({ showColumnHeaders, filename, ...rest });

  const csv = generateCsv(config)(data as Record<string, any>[]);

  download(config)(csv);
};
