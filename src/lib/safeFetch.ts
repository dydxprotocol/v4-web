async function throwIfNotOkResponse(response: Response) {
  if (!response.ok) {
    throw new Error(
      `Fetch request found non-200 response: ${JSON.stringify(await response.json())}`
    );
  }
}

export async function safeFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  const res = await fetch(...args);
  await throwIfNotOkResponse(res);
  return res;
}
