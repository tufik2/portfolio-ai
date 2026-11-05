const ENDPOINT = '/graphql';

/**
 * Error from a GraphQL request. `code` and `field` come from the server's
 * `extensions` (e.g. BAD_USER_INPUT / email), or NETWORK_ERROR when the
 * server can't be reached.
 */
export class GraphqlError extends Error {
  constructor(message, { code = 'UNKNOWN', field = null } = {}) {
    super(message);
    this.name = 'GraphqlError';
    this.code = code;
    this.field = field;
  }
}

export default class GraphqlCtrl {
  /**
   * Sends a query or mutation to the server.
   * @returns {Promise<object>} the `data` of the response
   * @throws {GraphqlError} the first GraphQL error, or a network error
   */
  static async request(query, variables = {}) {
    let body;
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      body = await response.json();
    } catch {
      throw new GraphqlError('Could not reach the server. Try again.', {
        code: 'NETWORK_ERROR',
      });
    }

    if (body.errors?.length) {
      const [first] = body.errors;
      throw new GraphqlError(first.message, {
        code: first.extensions?.code,
        field: first.extensions?.field,
      });
    }
    return body.data;
  }
}
