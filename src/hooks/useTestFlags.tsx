import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';

class TestFlags {
  public queryParams: queryString.ParsedQuery<string>;

  constructor() {
    this.queryParams = {};
  }

  setQueryParams(flags: queryString.ParsedQuery<string>) {
    this.queryParams = flags;
  }

  get displayInitializingMarkets() {
    return !!this.queryParams.displayInitializingMarkets;
  }
}

export const testFlags = new TestFlags();

const useTestFlagsContext = () => {
  const [queryParams, setQueryParams] = useState<queryString.ParsedQuery<string>>({});
  const location = useLocation();

  useEffect(() => {
    const parsedQueryParams = queryString.parse(location.search.substring(-1));
    testFlags.setQueryParams(parsedQueryParams);
    setQueryParams(parsedQueryParams);
  }, []);

  return {
    ...queryParams,
  };
};

type TestFlagsContextType = ReturnType<typeof useTestFlagsContext>;
const TestFlagsContext = createContext<TestFlagsContextType>({} as TestFlagsContextType);
TestFlagsContext.displayName = 'TestFlags';

export const TestFlagsProvider = ({ ...props }) => (
  <TestFlagsContext.Provider value={useTestFlagsContext()} {...props} />
);

export const useTestFlags = () => useContext(TestFlagsContext);
