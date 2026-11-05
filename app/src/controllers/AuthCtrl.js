import GraphqlCtrl from './GraphqlCtrl.js';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function read(key) {
	try {
		return localStorage.getItem(key) || null;
	} catch {
		return null;
	}
}

function write(key, value) {
	try {
		if (value) localStorage.setItem(key, value);
		else localStorage.removeItem(key);
	} catch {
		// Storage unavailable (private mode, blocked): nothing to do.
	}
}

// Only one refresh at a time: requests that find the token expired together
// share it. Two refreshes with the same refresh token would end the session.
let refreshing = null;

export default class AuthCtrl {
	static getToken() {
		return read(TOKEN_KEY);
	}

	static getRefreshToken() {
		return read(REFRESH_TOKEN_KEY);
	}

	static setTokens({ token, refreshToken }) {
		write(TOKEN_KEY, token);
		write(REFRESH_TOKEN_KEY, refreshToken);
	}

	static clearTokens() {
		write(TOKEN_KEY, null);
		write(REFRESH_TOKEN_KEY, null);
	}

	/**
	 * Asks the server to email a 6-digit sign-in code.
	 * @returns {Promise<Date>} when "Resend code" becomes available
	 */
	static async requestLoginCode(email) {
		const data = await GraphqlCtrl.request(
			`#graphql
	        mutation {
	            requestLoginCode(email: "${GraphqlCtrl.escape(email)}") {
	                resendAvailableAt
	            }
	        }
		`);
		return new Date(data.requestLoginCode.resendAvailableAt);
	}

	/**
	 * Checks the code; on success stores the token pair and returns the user.
	 */
	static async verifyLoginCode(email, code) {
		const data = await GraphqlCtrl.request(
			`#graphql
	        mutation {
	            verifyLoginCode(email: "${GraphqlCtrl.escape(email)}", code: "${code}") {
	                token
	                refreshToken
	                user {
	                    uuid
	                    firstName
	                    lastName
	                    email
	                    status
	                }
	            }
	        }
		`);
		AuthCtrl.setTokens(data.verifyLoginCode);
		return data.verifyLoginCode.user;
	}

	/**
	 * Exchanges the stored refresh token for a new pair. On failure both
	 * tokens are cleared and the error is thrown.
	 */
	static refresh() {
		refreshing ??= (async () => {
			const refreshToken = AuthCtrl.getRefreshToken();
			try {
				if (!refreshToken) throw new Error('No refresh token.');
				const data = await GraphqlCtrl.request(
					`#graphql
	                mutation {
	                    refreshToken(refreshToken: "${refreshToken}") {
	                        token
	                        refreshToken
	                    }
	                }
				`);
				AuthCtrl.setTokens(data.refreshToken);
			} catch (error) {
				AuthCtrl.clearTokens();
				throw error;
			}
		})().finally(() => {
			refreshing = null;
		});
		return refreshing;
	}

	/**
	 * Ends the session on the server, then always clears both tokens, even
	 * if the server can't be reached.
	 */
	static async logout() {
		try {
			await GraphqlCtrl.request(
				`#graphql
	            mutation {
	                logout
	            }
			`);
		} catch {
			// Signed out on this device regardless; the server session then
			// simply expires with its refresh token.
		} finally {
			AuthCtrl.clearTokens();
		}
	}
}
