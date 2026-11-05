import AuthCtrl from '../../controllers/AuthCtrl.js';

const AuthRes = {
	// mutation requestLoginCode(email: EmailAddress!): LoginCodeRequest!
	requestLoginCode({ email }) {
		return AuthCtrl.requestLoginCode(email);
	},

	// mutation verifyLoginCode(email: EmailAddress!, code: String!): AuthPayload!
	verifyLoginCode({ email, code }) {
		return AuthCtrl.verifyLoginCode(email, code);
	},

	// mutation refreshToken(refreshToken: String!): AuthPayload!
	refreshToken({ refreshToken }) {
		return AuthCtrl.refresh(refreshToken);
	},

	// mutation logout: Boolean!
	logout(_args, context) {
		return AuthCtrl.logout(context);
	},
};

export default AuthRes;
