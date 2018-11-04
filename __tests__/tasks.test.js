import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import _ from 'lodash';

import app from '..';
import db from '../models';

import { getFakeTask, getFakeTaskParts, getFakeUser } from './lib/helpers';
import getCookie from './lib/authUser';

const { sequelize, Task, User } = db;

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  jasmine.addMatchers(matchers);
});

describe('Unauthorized requests', () => {
  let server;
  let taskFromDB;

  beforeAll(async () => {
    const task = await getFakeTask();
    taskFromDB = await Task.create(task);
  });

  beforeEach(() => {
    server = app().listen();
  });

  afterEach((done) => {
    server.close();
    done();
  });

  it('GET /tasks', async () => {
    const res = await request.agent(server)
      .get('/tasks');
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /tasks/new (401)', async () => {
    const res = await request.agent(server)
      .get('/tasks/new');
    expect(res).toHaveHTTPStatus(401);
  });

  it('POST /tasks (401)', async () => {
    const someTask = await getFakeTask();
    const res = await request.agent(server)
      .post('/tasks')
      .send({ form: someTask });
    expect(res).toHaveHTTPStatus(401);
  });

  it('GET /tasks/:id (401)', async () => {
    const res = await request.agent(server)
      .get(`/tasks/${taskFromDB.id}`);
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /tasks/:id/edit (401)', async () => {
    const res = await request.agent(server)
      .get(`/tasks/${taskFromDB.id}/edit`);
    expect(res).toHaveHTTPStatus(401);
  });

  it('PATCH /tasks/:id (401)', async () => {
    const newTask = getFakeTask();
    const res = await request.agent(server)
      .patch(`/tasks/${taskFromDB.id}`)
      .send({ form: newTask });
    expect(res).toHaveHTTPStatus(401);
  });

  it('DELETE /tasks/:id (401)', async () => {
    const res = await request.agent(server)
      .delete(`/tasks/${taskFromDB.id}`);
    expect(res).toHaveHTTPStatus(401);
  });
});

describe('Authorized requests', () => {
  let server;
  let user;
  let cookie;

  beforeAll(async () => {
    user = await User.create(getFakeUser());
  });

  beforeEach(async () => {
    server = app().listen();
    cookie = await getCookie(server, user);
  });

  afterEach((done) => {
    server.close();
    done();
  });

  it('GET /tasks/new', async () => {
    const res = await request.agent(server)
      .get('/tasks/new')
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /tasks', async () => {
    const someTask = await getFakeTask();
    const res = await request.agent(server)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({ form: someTask });
    expect(res).toHaveHTTPStatus(302);

    const taskFromDB = await Task.findOne({
      where: {
        name: someTask.name,
        description: someTask.description,
      },
    });
    expect(taskFromDB.length).not.toBeNull();
  });

  it('GET /tasks/:id/edit', async () => {
    const someTask = await getFakeTask();
    const taskFromDB = await Task.create(someTask);
    const getRes = await request.agent(server)
      .get(`/tasks/${taskFromDB.id}/edit`)
      .set('Cookie', cookie);
    expect(getRes).toHaveHTTPStatus(200);
  });

  it('PATCH /tasks/:id', async () => {
    const someTask = await getFakeTask();
    const taskFromDB = await Task.create(someTask);
    const { name, description } = getFakeTaskParts();
    const res = await request.agent(server)
      .patch(`/tasks/${taskFromDB.id}`)
      .set('Cookie', cookie)
      .send({ form: { name, description } });
    expect(res).toHaveHTTPStatus(302);

    const newTaskFromDB = await Task.findOne({
      where: {
        id: taskFromDB.id,
      },
    });

    expect(newTaskFromDB.name).toBe(name);
    expect(newTaskFromDB.description).toBe(description);
  });

  it('PATCH /tasks/:id (full)', async () => {
    const someTask = await getFakeTask();
    const taskFromDB = await Task.create(someTask);
    const allowedFields = ['name', 'description', 'assignedToId', 'taskStatusId'];
    const newTask = _.pick(await getFakeTask(), allowedFields);
    const res = await request.agent(server)
      .patch(`/tasks/${taskFromDB.id}`)
      .set('Cookie', cookie)
      .send({ form: newTask });
    expect(res).toHaveHTTPStatus(302);

    const newTaskFromDB = await Task.findOne({
      where: {
        id: taskFromDB.id,
      },
    });

    allowedFields.forEach((key) => {
      expect(newTaskFromDB[key]).toBe(newTask[key]);
    });
  });

  it('DELETE /tasks/:id', async () => {
    const someTask = await getFakeTask();
    const taskFromDB = await Task.create(someTask);
    const res = await request.agent(server)
      .delete(`/tasks/${taskFromDB.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);

    const deletedTaskFromDB = await Task.findById(taskFromDB.id);
    expect(deletedTaskFromDB).toBeNull();
  });
});
