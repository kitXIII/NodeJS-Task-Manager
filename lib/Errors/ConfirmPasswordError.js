export default class ConfirmPasswordError extends Error {
  constructor(message, ...rest) {
    super(message, ...rest);
    this.errors = [
      {
        message,
        path: 'confirmPassword',
      },
    ];
  }
}
