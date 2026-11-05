import GraphqlCtrl from './GraphqlCtrl.js';

export default class UserCtrl {
	static async register({ firstName, lastName, email }) {
		const data = await GraphqlCtrl.request(
			`#graphql
	        mutation {
	            registerUser(input: {
	                uuid: "${crypto.randomUUID()}",
	                firstName: "${GraphqlCtrl.escape(firstName)}",
	                lastName: "${GraphqlCtrl.escape(lastName)}",
	                email: "${GraphqlCtrl.escape(email)}"}
	            ) {
	                uuid
	                firstName
	                lastName
	                email
	                status
	            }
	        }
		`);
		return data.registerUser;
	}

	static async verifyEmail(token) {
		const data = await GraphqlCtrl.request(
			`#graphql
	        mutation {
	            verifyEmail(token: "${token}") {
	                uuid
	                firstName
	                email
	                status
	            }
	        }
		`);
		return data.verifyEmail;
	}

	static async resendVerificationEmail(email) {
		const data = await GraphqlCtrl.request(
			`#graphql
	        mutation {
	            resendVerificationEmail(email: "${GraphqlCtrl.escape(email)}")
	        }
		`);
		return data.resendVerificationEmail;
	}
}
