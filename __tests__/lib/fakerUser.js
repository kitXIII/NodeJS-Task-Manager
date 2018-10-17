import faker from 'faker';

export default () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: '11qwertY',
  confirmPassword: '11qwertY',
});
