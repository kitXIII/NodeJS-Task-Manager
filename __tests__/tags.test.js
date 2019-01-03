import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import app from '..';
import db from '../models';

import {
  getFakeUser, getFakeTask, getFakeTaskTags,
} from './lib/helpers';

import getCookie from './lib/authUser';

const {
  sequelize, User, Tag, Task,
} = db;

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  // eslint-disable-next-line jest/no-jasmine-globals
  jasmine.addMatchers(matchers);
});

describe('Create tags', () => {
  it('POST /tasks | put tags into DB', async () => {
    const server = app().listen();
    const user = await User.create(getFakeUser());
    const cookie = await getCookie(server, user);

    const someTask = await getFakeTask();
    const tags = getFakeTaskTags(3);
    someTask.tags = tags.join(', ');

    const res = await request.agent(server)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({ form: someTask });
    expect(res).toHaveHTTPStatus(302);

    const tagsFromDB = await sequelize
      .query(`SELECT t.name FROM tags t
        JOIN TaskTags tt ON t.id = tt.tagId
        JOIN Tasks ts ON tt.taskId = ts.id
        WHERE ts.name = '${someTask.name}'`,
      { type: sequelize.QueryTypes.SELECT });

    expect(tagsFromDB.map(tag => tag.name).sort()).toEqual(tags.sort());

    server.close();
  });
});

describe('Change Tags', () => {
  let server;
  let user;
  let cookie;
  let task;
  let tags;

  beforeAll(async () => {
    user = await User.create(getFakeUser());
  });

  beforeEach(async () => {
    const someTask = await getFakeTask();
    task = await Task.create(someTask);
    const tagNames = getFakeTaskTags(3);
    tags = await Promise.all(tagNames.map(name => Tag.create({ name })))
      .then(results => results.filter(v => v));
    await task.setTags(tags);
    server = app().listen();
    cookie = await getCookie(server, user);
  });

  afterEach((done) => {
    server.close();
    done();
  });

  it('PATCH /tasks | put new tags into DB', async () => {
    const especialyTag = await Tag.create({ name: 'EspecialyTagNameForTestRemovingFromDB_1' });
    await task.addTag(especialyTag);
    const newTagsNames = getFakeTaskTags(3);
    const res = await request.agent(server)
      .patch(`/tasks/${task.id}`)
      .set('Cookie', cookie)
      .send({ form: { tags: newTagsNames.join(', ') } });
    expect(res).toHaveHTTPStatus(302);

    const tagsFromDB = await task.getTags();
    expect(tagsFromDB.map(tag => tag.name).sort()).toEqual(newTagsNames.sort());

    const tagFromDB = await Tag.findById(especialyTag.id);
    expect(tagFromDB).toBeNull();
  });

  it('DELETE /tasks/:id | remove tags from DB', async () => {
    const especialyTag = await Tag.create({ name: 'EspecialyTagNameForTestRemovingFromDB_2' });
    await task.addTag(especialyTag);
    const res = await request.agent(server)
      .delete(`/tasks/${task.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);

    const tagFromDB = await Tag.findById(especialyTag.id);
    expect(tagFromDB).toBeNull();
  });

  it('DELETE /tasks/:id | not remove tag from DB if it use', async () => {
    const especialyTag = await Tag.create({ name: 'EspecialyTagNameForTestRemovingFromDB_3' });
    const someTask = await getFakeTask();
    const task2 = await Task.create(someTask);
    await task2.setTags(tags);
    await task2.addTag(especialyTag);

    const res = await request.agent(server)
      .delete(`/tasks/${task2.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);

    const tagIds = tags.map(tag => tag.id);
    const tagsFromDB = await Tag.findAll({
      where: {
        id: {
          [sequelize.Op.in]: tagIds,
        },
      },
    });
    const tagsNames = tags.map(tag => tag.name);
    const tagsNamesFromDB = tagsFromDB.map(tag => tag.name);
    expect(tagsNamesFromDB.sort()).toEqual(tagsNames.sort());

    const tagFromDB = await Tag.findById(especialyTag.id);
    expect(tagFromDB).toBeNull();
  });
});
