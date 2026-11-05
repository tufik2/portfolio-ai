import AuthCtrl from './AuthCtrl.js';

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
   * Escapes free text (names, emails…) for use inside a quoted GraphQL
   * string: "${GraphqlCtrl.escape(firstName)}". Not needed for values that
   * can't contain quotes or backslashes, such as UUIDs or tokens.
   */
  static escape(value) {
    return String(value ?? '')
      .replaceAll('\\', '\\\\')
      .replaceAll('"', '\\"')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r')
      .replaceAll('\t', '\\t');
  }

  /**
   * Sends a query or mutation to the server, with the stored access token.
   * If the token has expired, refreshes it once and retries; if that fails,
   * clears the tokens and goes to /login.
   * @param {string} query the full GraphQL document, values included
   * @returns {Promise<object>} the `data` of the response
   * @throws {GraphqlError} the first GraphQL error, or a network error
   */
  static async request(query) {
    try {
      return await send(query);
    } catch (error) {
      if (error.code !== 'TOKEN_EXPIRED') throw error;
      try {
        await AuthCtrl.refresh();
      } catch {
        window.location.assign('/login');
        throw error;
      }
      return send(query);
    }
  }
}

// One POST to /graphql; throws the first GraphQL error as a GraphqlError.
async function send(query) {
  const headers = { 'Content-Type': 'application/json' };
  const token = AuthCtrl.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
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
