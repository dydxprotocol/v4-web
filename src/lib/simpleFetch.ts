export class SimpleFetchHttpError extends Error {
  constructor(public response: Response) {
    super(`HTTP error ${response.status}`);
  }
}

export const simpleFetch = async <ResponseType = any>(
  url: string,
  options: RequestInit = {}
): Promise<ResponseType> => {
  const response = await fetch(url, options);
  if (!response.ok) throw new SimpleFetchHttpError(response);
  const res = await response.json();
  return res;
};

export const isSimpleFetchError = (error: unknown): error is SimpleFetchHttpError => {
  return error instanceof SimpleFetchHttpError;
};
