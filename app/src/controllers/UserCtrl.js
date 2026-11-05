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

export default class UserCtrl {
  static async register({ firstName, lastName, email }) {
    const data = await GraphqlCtrl.request(REGISTER_USER, {
      input: { uuid: crypto.randomUUID(), firstName, lastName, email },
    });
    return data.registerUser;
  }
}
