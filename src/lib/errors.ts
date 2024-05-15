/**
 * Error thrown if StatefulOrder includes an error code in it's response.
 */
export class StatefulOrderError extends Error {
  response: any;

  code: number;

  constructor(message: any, response: any) {
    super(message);
    this.name = 'StatefulOrderError';
    this.response = response;
    this.code = response.code;
  }
}
