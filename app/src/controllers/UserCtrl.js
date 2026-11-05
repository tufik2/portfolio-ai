import GraphqlCtrl from './GraphqlCtrl.js';

const REGISTER_USER = `#graphql
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      uuid
      firstName
      lastName
      email
      status
    }
  }
`;

const VERIFY_EMAIL = `#graphql
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      uuid
      firstName
      email
      status
    }
  }
`;

const RESEND_VERIFICATION_EMAIL = `#graphql
  mutation ResendVerificationEmail($email: String!) {
    resendVerificationEmail(email: $email)
  }
`;

export default class UserCtrl {
  static async register({ firstName, lastName, email }) {
    const data = await GraphqlCtrl.request(REGISTER_USER, {
      input: { uuid: crypto.randomUUID(), firstName, lastName, email },
    });
    return data.registerUser;
  }

  static async verifyEmail(token) {
    const data = await GraphqlCtrl.request(VERIFY_EMAIL, { token });
    return data.verifyEmail;
  }

  static async resendVerificationEmail(email) {
    const data = await GraphqlCtrl.request(RESEND_VERIFICATION_EMAIL, {
      email,
    });
    return data.resendVerificationEmail;
  }
}
