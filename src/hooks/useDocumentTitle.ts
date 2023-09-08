import { useEffect } from 'react';

import { DEFAULT_DOCUMENT_TITLE } from '@/constants/routes';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} · ${DEFAULT_DOCUMENT_TITLE}`;

    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, []);
};
