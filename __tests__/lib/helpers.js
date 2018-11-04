import faker from 'faker';
import db from '../../models';

const { User, TaskStatus } = db;

const password = faker.internet.password();

export const getFakeUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password,
  confirmPassword: password,
});

export const getFakeStatus = () => ({ name: faker.random.word() });

export const getFakeTaskTags = (n = 1) => {
  const tags = [];
  for (let i = 0; i < n; i += 1) {
    tags.push(faker.random.word().replace(/,/g, ''));
  }
  return tags;
};

export const getFakeTaskParts = () => ({
  name: faker.random.word(),
  description: faker.random.words(),
});

export const getFakeTask = async () => {
  const { id: taskStatusId } = await TaskStatus.create(getFakeStatus());
  const { id: creatorId } = await User.create(getFakeUser());
  const { id: assignedToId } = await User.create(getFakeUser());
  const fakeParts = getFakeTaskParts();
  return {
    ...fakeParts,
    taskStatusId,
    creatorId,
    assignedToId,
    tags: '',
  };
};
