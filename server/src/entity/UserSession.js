/**
 * A row of the `user_session` table: one signed-in device. The refresh
 * token's `jti` is tracked only as a hash, which is never selected here.
 */
export default class UserSession {
  static TABLE = 'user_session';

  /** Columns read for a UserSession (never `refresh_jti_hash`). */
  static COLUMNS =
    '`id`, `user_id`, `refresh_token_expires_at`, `created_at`, `refreshed_at`';

  id = null;
  userId = null;
  /** UTC expiry of the current refresh token. */
  refreshTokenExpiresAt = null;
  createdAt = null;
  /** UTC date of the last refresh, or null. */
  refreshedAt = null;

  constructor(values = {}) {
    Object.assign(this, values);
  }

  /**
   * Builds a UserSession from a `user_session` row (snake_case columns).
   * @param {object} row
   * @returns {UserSession}
   */
  static fromRow(row) {
    return new UserSession({
      id: row.id,
      userId: row.user_id,
      refreshTokenExpiresAt: row.refresh_token_expires_at,
      createdAt: row.created_at,
      refreshedAt: row.refreshed_at ?? null,
    });
  }
}
