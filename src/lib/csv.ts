import { ConfigOptions, download, generateCsv, mkConfig } from 'export-to-csv';

export const exportCSV = <T extends object>(data: T[], options: ConfigOptions = {}) => {
  const { filename = 'generated', showColumnHeaders = true, ...rest } = options;
  const config = mkConfig({ showColumnHeaders, filename, ...rest });

  const csv = generateCsv(config)(
    data as {
      [k: string]: unknown;
      [k: number]: unknown;
    }[]
  );

  download(config)(csv);
};
