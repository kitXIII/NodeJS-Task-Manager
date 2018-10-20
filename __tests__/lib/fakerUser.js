import faker from 'faker';

const password = faker.internet.password();

export default () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password,
  confirmPassword: password,
});
