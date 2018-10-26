import faker from 'faker';

const password = faker.internet.password();

export const getFakeUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password,
  confirmPassword: password,
});

export const getFakeStatus = () => ({ name: faker.random.words() });
