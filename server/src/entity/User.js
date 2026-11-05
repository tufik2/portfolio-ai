/**
 * A row of the `user` table. Properties are camelCase (GraphQL style);
 * columns are snake_case. Controllers keep the SQL and use this class to
 * read rows and refer to statuses.
 */
export default class User {
  static TABLE = 'user';

  static STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  });

  /**
   * Columns read for a User. Excludes `email_verification_hash`, which is
   * only used in WHERE clauses and must never leave the server.
   */
  static COLUMNS =
    '`id`, `uuid`, `first_name`, `last_name`, `email`, `status`, `email_verified_at`';

  /** Internal id; not exposed through GraphQL. */
  id = null;
  uuid = null;
  firstName = null;
  lastName = null;
  email = null;
  status = null;
  /** UTC date of email verification, or null while unverified. */
  emailVerifiedAt = null;

  constructor(values = {}) {
    Object.assign(this, values);
  }

  /**
   * Builds a User from a `user` row (snake_case columns).
   * @param {object} row
   * @returns {User}
   */
  static fromRow(row) {
    return new User({
      id: row.id ?? null,
      uuid: row.uuid,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      status: row.status,
      emailVerifiedAt: row.email_verified_at ?? null,
    });
  }

  get isActive() {
    return this.status === User.STATUS.ACTIVE;
  }

  get isInactive() {
    return this.status === User.STATUS.INACTIVE;
  }

  get isPendingVerification() {
    return this.status === User.STATUS.EMAIL_VERIFICATION;
  }
}
