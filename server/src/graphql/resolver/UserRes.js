import UserCtrl from '../../controllers/UserCtrl.js';

const UserRes = {
  // mutation registerUser(input: RegisterUserInput!): User!
  registerUser({ input }) {
    return UserCtrl.register(input);
  },

  // mutation verifyEmail(token: String!): User!
  verifyEmail({ token }) {
    return UserCtrl.verifyEmail(token);
  },

  // mutation resendVerificationEmail(email: String!): Boolean!
  resendVerificationEmail({ email }) {
    return UserCtrl.resendVerificationEmail(email);
  },
};

export default UserRes;
