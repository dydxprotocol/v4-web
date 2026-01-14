import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Variables } from 'graphql-request';

/**
 * Mock GraphQL client for testing
 */
export class MockGraphQLClient {
  private mockResponses: Map<string, unknown> = new Map();
  private requestLog: Array<{ query: string; variables?: Variables }> = [];

  /**
   * Mock a response for a specific query
   */
  mockResponse<TResult>(queryKey: string, response: TResult): void {
    this.mockResponses.set(queryKey, response);
  }

  /**
   * Get the request log for assertions
   */
  getRequestLog(): Array<{ query: string; variables?: Variables }> {
    return [...this.requestLog];
  }

  /**
   * Clear all mocks and logs
   */
  clear(): void {
    this.mockResponses.clear();
    this.requestLog = [];
  }

  /**
   * Mock GraphQL request method
   */
  async request<TResult, TVariables extends Variables = Variables>(
    document: string | TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const queryString = typeof document === 'string' ? document : document.toString();
    const queryKey = this.extractQueryName(queryString);

    this.requestLog.push({ query: queryString, variables });

    const mockResponse = this.mockResponses.get(queryKey);
    if (mockResponse === undefined) {
      throw new Error(`No mock response found for query: ${queryKey}`);
    }

    return mockResponse as TResult;
  }

  private extractQueryName(query: string): string {
    const match = query.match(/(?:query|mutation)\s+(\w+)/);
    return match ? match[1] : 'unknown';
  }
}

/**
 * Create a mock GraphQL client
 */
export function createMockGraphQLClient(): MockGraphQLClient {
  return new MockGraphQLClient();
}
