import { GraphQLError } from 'graphql';
import pool from './db.js';
import EmailCtrl from './EmailCtrl.js';
import TokenCtrl from './TokenCtrl.js';
import UtilsCtrl from './UtilsCtrl.js';
import User from '../entity/User.js';
import UserSession from '../entity/UserSession.js';

const CODE_TTL_MINUTES = 10;
const RESEND_WAIT_MINUTES = 5;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_WAIT_MS = RESEND_WAIT_MINUTES * 60 * 1000;

function gqlError(message, code, field) {
	return new GraphQLError(message, {
		extensions: field ? { code, field } : { code },
	});
}

function normalizeEmail(email) {
	const address = String(email ?? '').trim().toLowerCase();
	if (!address || address.length > 255 || !UtilsCtrl.isEmail(address)) {
		throw gqlError('Enter a valid email address.', 'BAD_USER_INPUT', 'email');
	}
	return address;
}

// Reads a user with the extra sign-in code columns (never returned to clients).
async function findUserForLogin(email) {
	const [rows] = await pool.query(
		`SELECT ${User.COLUMNS},
		        \`login_code_hash\`,
		        \`login_code_attempts\`,
		        \`login_code_sent_at\` + INTERVAL ${RESEND_WAIT_MINUTES} MINUTE AS \`resend_available_at\`,
		        \`login_code_sent_at\` > UTC_TIMESTAMP() - INTERVAL ${RESEND_WAIT_MINUTES} MINUTE AS \`resend_too_soon\`,
		        \`login_code_expires_at\` <= UTC_TIMESTAMP() AS \`code_expired\`
		   FROM \`user\` WHERE \`email\` = ?`,
		[email],
	);
	if (!rows.length) return null;
	const row = rows[0];
	return {
		user: User.fromRow(row),
		codeHash: row.login_code_hash,
		attempts: row.login_code_attempts,
		resendAvailableAt: row.resend_available_at,
		resendTooSoon: Boolean(row.resend_too_soon),
		codeExpired: Boolean(row.code_expired),
	};
}

async function findSession(id) {
	const [rows] = await pool.query(
		`SELECT ${UserSession.COLUMNS}, \`refresh_jti_hash\` FROM \`user_session\` WHERE \`id\` = ?`,
		[id],
	);
	return rows.length
		? { session: UserSession.fromRow(rows[0]), jtiHash: rows[0].refresh_jti_hash }
		: null;
}

async function findUserById(id) {
	const [rows] = await pool.query(
		`SELECT ${User.COLUMNS} FROM \`user\` WHERE \`id\` = ?`,
		[id],
	);
	return rows.length ? User.fromRow(rows[0]) : null;
}

async function deleteSession(id) {
	await pool.query('DELETE FROM `user_session` WHERE `id` = ?', [id]);
}

// Signs the access + refresh pair for a session and returns the payload.
function issueTokens(user, sessionId, jti) {
	const access = TokenCtrl.signAccessToken({ userUuid: user.uuid, sessionId });
	const refresh = TokenCtrl.signRefreshToken({ userUuid: user.uuid, sessionId, jti });
	return {
		token: access.token,
		tokenExpiresAt: access.expiresAt,
		refreshToken: refresh.token,
		refreshTokenExpiresAt: refresh.expiresAt,
		user,
	};
}

// Creates a session row (one per signed-in device) and its token pair.
async function createSession(user) {
	const jti = UtilsCtrl.newVerificationToken();
	const [result] = await pool.query(
		'INSERT INTO `user_session` (`user_id`, `refresh_jti_hash`, `refresh_token_expires_at`) VALUES (?, ?, UTC_TIMESTAMP())',
		[user.id, UtilsCtrl.hashToken(jti)],
	);
	const payload = issueTokens(user, result.insertId, jti);
	await pool.query(
		'UPDATE `user_session` SET `refresh_token_expires_at` = ? WHERE `id` = ?',
		[payload.refreshTokenExpiresAt, result.insertId],
	);
	return payload;
}

// Same answer for emails that get no code, so the form can't reveal which
// accounts exist. Remembered per address so repeated requests match.
const fakeResendAt = new Map();
function fakeResendAvailableAt(email) {
	const now = Date.now();
	const existing = fakeResendAt.get(email);
	if (existing && existing > now) return new Date(existing);
	if (fakeResendAt.size > 10_000) {
		for (const [key, value] of fakeResendAt) if (value <= now) fakeResendAt.delete(key);
	}
	const next = now + RESEND_WAIT_MS;
	fakeResendAt.set(email, next);
	return new Date(next);
}

export default class AuthCtrl {
	/**
	 * Emails a 6-digit sign-in code to an ACTIVE user, at most once every
	 * 5 minutes. Always resolves to the same shape, whether or not a code was
	 * sent.
	 * @returns {Promise<{resendAvailableAt: Date}>}
	 */
	static async requestLoginCode(email) {
		const address = normalizeEmail(email);

		try {
			const found = await findUserForLogin(address);
			if (!found || !found.user.isActive) {
				return { resendAvailableAt: fakeResendAvailableAt(address) };
			}
			if (found.resendTooSoon) {
				return { resendAvailableAt: found.resendAvailableAt };
			}

			const code = UtilsCtrl.newLoginCode();
			// Conditional on the 5-minute rule, so two simultaneous requests
			// can't both send a code.
			const [result] = await pool.query(
				`UPDATE \`user\`
				    SET \`login_code_hash\` = ?,
				        \`login_code_expires_at\` = UTC_TIMESTAMP() + INTERVAL ${CODE_TTL_MINUTES} MINUTE,
				        \`login_code_sent_at\` = UTC_TIMESTAMP(),
				        \`login_code_attempts\` = 0
				  WHERE \`id\` = ?
				    AND (\`login_code_sent_at\` IS NULL
				         OR \`login_code_sent_at\` <= UTC_TIMESTAMP() - INTERVAL ${RESEND_WAIT_MINUTES} MINUTE)`,
				[UtilsCtrl.hashLoginCode(found.user.uuid, code), found.user.id],
			);

			if (result.affectedRows > 0) {
				const { user } = found;
				Promise.resolve()
					.then(() => EmailCtrl.sendLoginCode(user, code, CODE_TTL_MINUTES))
					.catch((emailError) => {
						console.error(`Login code email to ${user.email} failed:`, emailError.message);
					});
			}

			const updated = await findUserForLogin(address);
			return { resendAvailableAt: updated.resendAvailableAt };
		} catch (error) {
			console.error('AuthCtrl.requestLoginCode failed:', error);
			throw gqlError('Could not send the code. Try again.', 'INTERNAL_SERVER_ERROR');
		}
	}

	/**
	 * Checks a sign-in code and, if it is right, creates a session and returns
	 * the access and refresh tokens. Only ACTIVE users can sign in.
	 * @returns {Promise<{token, tokenExpiresAt, refreshToken, refreshTokenExpiresAt, user}>}
	 */
	static async verifyLoginCode(email, code) {
		const address = normalizeEmail(email);
		const value = String(code ?? '').trim();
		if (!/^\d{6}$/.test(value)) {
			throw gqlError('Enter the 6-digit code.', 'BAD_USER_INPUT', 'code');
		}

		const found = await findUserForLogin(address);
		if (!found || !found.user.isActive || !found.codeHash) {
			throw gqlError('This code is invalid. Request a new one.', 'INVALID_CODE');
		}
		const { user, codeHash } = found;

		if (found.codeExpired) {
			await pool.query(
				'UPDATE `user` SET `login_code_hash` = NULL, `login_code_expires_at` = NULL WHERE `id` = ? AND `login_code_hash` = ?',
				[user.id, codeHash],
			);
			throw gqlError('This code has expired. Request a new one.', 'CODE_EXPIRED');
		}

		if (!UtilsCtrl.hashesEqual(UtilsCtrl.hashLoginCode(user.uuid, value), codeHash)) {
			await pool.query(
				'UPDATE `user` SET `login_code_attempts` = `login_code_attempts` + 1 WHERE `id` = ? AND `login_code_hash` = ?',
				[user.id, codeHash],
			);
			const [[{ attempts }]] = await pool.query(
				'SELECT `login_code_attempts` AS attempts FROM `user` WHERE `id` = ?',
				[user.id],
			);
			if (attempts >= MAX_CODE_ATTEMPTS) {
				await pool.query(
					'UPDATE `user` SET `login_code_hash` = NULL, `login_code_expires_at` = NULL WHERE `id` = ? AND `login_code_hash` = ?',
					[user.id, codeHash],
				);
				throw gqlError('Too many incorrect codes. Request a new one.', 'TOO_MANY_ATTEMPTS');
			}
			throw gqlError('This code is incorrect.', 'INVALID_CODE');
		}

		// Single use: conditional on the hash still matching, so the same code
		// can't create two sessions.
		const [cleared] = await pool.query(
			`UPDATE \`user\`
			    SET \`login_code_hash\` = NULL,
			        \`login_code_expires_at\` = NULL,
			        \`login_code_attempts\` = 0
			  WHERE \`id\` = ? AND \`login_code_hash\` = ?`,
			[user.id, codeHash],
		);
		if (cleared.affectedRows === 0) {
			throw gqlError('This code is invalid. Request a new one.', 'INVALID_CODE');
		}

		try {
			return await createSession(user);
		} catch (error) {
			console.error('AuthCtrl.verifyLoginCode failed:', error);
			throw gqlError('Could not sign you in. Try again.', 'INTERNAL_SERVER_ERROR');
		}
	}

	/**
	 * Rotates a refresh token: returns a new access + refresh pair for the
	 * same session. Reusing an old refresh token deletes the session.
	 */
	static async refresh(refreshToken) {
		const ended = () =>
			gqlError('Your session has ended. Sign in again.', 'INVALID_REFRESH_TOKEN');

		const claims = TokenCtrl.verifyRefreshToken(refreshToken);
		const found = await findSession(claims.sid);
		if (!found) throw ended();

		const jtiHash = UtilsCtrl.hashToken(claims.jti);
		if (!UtilsCtrl.hashesEqual(jtiHash, found.jtiHash)) {
			// An already-used refresh token: it may have been stolen.
			await deleteSession(found.session.id);
			throw ended();
		}

		const user = await findUserById(found.session.userId);
		if (!user || !user.isActive || user.uuid !== claims.sub) {
			await deleteSession(found.session.id);
			throw ended();
		}

		const newJti = UtilsCtrl.newVerificationToken();
		const payload = issueTokens(user, found.session.id, newJti);
		const [result] = await pool.query(
			`UPDATE \`user_session\`
			    SET \`refresh_jti_hash\` = ?,
			        \`refresh_token_expires_at\` = ?,
			        \`refreshed_at\` = UTC_TIMESTAMP()
			  WHERE \`id\` = ? AND \`refresh_jti_hash\` = ?`,
			[UtilsCtrl.hashToken(newJti), payload.refreshTokenExpiresAt, found.session.id, jtiHash],
		);
		if (result.affectedRows === 0) throw ended();
		return payload;
	}

	/**
	 * Resolves the `Authorization: Bearer <token>` header to the signed-in
	 * user. Returns null without a header.
	 * @returns {Promise<{user: User, session: UserSession} | null>}
	 * @throws TOKEN_EXPIRED / UNAUTHENTICATED
	 */
	static async authenticate(req) {
		const header = req.get?.('authorization') ?? req.headers?.authorization ?? '';
		const match = /^Bearer\s+(.+)$/i.exec(header);
		if (!match) return null;

		const claims = TokenCtrl.verifyAccessToken(match[1].trim());
		const unauthenticated = () => gqlError('You need to sign in.', 'UNAUTHENTICATED');

		const found = await findSession(claims.sid);
		if (!found) throw unauthenticated();
		const user = await findUserById(found.session.userId);
		if (!user || !user.isActive || user.uuid !== claims.sub) throw unauthenticated();

		return { user, session: found.session };
	}

	/**
	 * Ends the current session: deletes its `user_session` row, so both the
	 * access token and the refresh token stop working at once. Without a
	 * signed-in user there is nothing to do.
	 * @returns {Promise<true>}
	 * @throws TOKEN_EXPIRED (the app refreshes and retries) / UNAUTHENTICATED
	 */
	static async logout(context) {
		const auth = await context.getAuth();
		if (auth) await deleteSession(auth.session.id);
		return true;
	}
}
