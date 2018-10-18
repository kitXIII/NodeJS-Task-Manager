export default class NewPasswordError extends Error {
  constructor(message, ...rest) {
    super(message, ...rest);
    this.errors = [
      {
        message,
        path: 'pssword',
      },
    ];
  }
}
