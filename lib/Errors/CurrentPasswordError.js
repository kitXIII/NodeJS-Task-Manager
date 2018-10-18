export default class CurrentPasswordError extends Error {
  constructor(message, ...rest) {
    super(message, ...rest);
    this.errors = [
      {
        message,
        path: 'currentPassword',
      },
    ];
  }
}
