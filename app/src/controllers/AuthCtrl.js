const TOKEN_KEY = 'token';

export default class AuthCtrl {
  static getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  }
}
