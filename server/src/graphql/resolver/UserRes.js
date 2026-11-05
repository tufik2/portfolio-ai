import UserCtrl from '../../controllers/UserCtrl.js';

const UserRes = {
  // mutation registerUser(input: RegisterUserInput!): User!
  registerUser({ input }) {
    return UserCtrl.register(input);
  },
};

export default UserRes;
