import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import app from '..';
import db from '../models';

import { getFakeUser, getFakeStatus } from './lib/helpers';

const { sequelize, User, TaskStatus } = db;

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  jasmine.addMatchers(matchers);
});

describe('Unauthorized requests', () => {
  let server;

  beforeEach(() => {
    server = app().listen();
  });

  afterEach((done) => {
    server.close();
    done();
  });

  it('GET /statuses', async () => {
    const res = await request.agent(server)
      .get('/statuses');
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /statuses/new (401)', async () => {
    const res = await request.agent(server)
      .get('/statuses/new');
    expect(res).toHaveHTTPStatus(401);
  });

  it('POST /statuses (401)', async () => {
    const someStatus = getFakeStatus();
    const res = await request.agent(server)
      .post('/statuses')
      .send({ form: someStatus });
    expect(res).toHaveHTTPStatus(401);
  });

  it('GET /statuses/:id/edit (401)', async () => {
    const someStatus = getFakeStatus();
    const statusFromDB = await TaskStatus.create(someStatus);
    const getRes = await request.agent(server)
      .get(`/statuses/${statusFromDB.id}/edit`);
    expect(getRes).toHaveHTTPStatus(401);
  });

  it('PATCH /statuses/:id (401)', async () => {
    const statusFromDB = await TaskStatus.create(getFakeStatus());
    const newStatus = getFakeStatus();
    const res = await request.agent(server)
      .patch(`/statuses/${statusFromDB.id}`)
      .send({ form: newStatus });
    expect(res).toHaveHTTPStatus(401);
  });

  it('DELETE /statuses/:id (401)', async () => {
    const statusFromDB = await TaskStatus.create(getFakeStatus());
    const res = await request.agent(server)
      .delete(`/statuses/${statusFromDB.id}`);
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
    const { email, password } = user;
    const res = await request.agent(server)
      .post('/sessions')
      .send({ form: { email, password } });
    expect(res).toHaveHTTPStatus(302);
    cookie = res.headers['set-cookie'];
  });

  afterEach((done) => {
    server.close();
    done();
  });

  it('GET /statuses/new', async () => {
    const res = await request.agent(server)
      .get('/statuses/new')
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /statuses', async () => {
    const someStatus = getFakeStatus();
    const res = await request.agent(server)
      .post('/statuses')
      .set('Cookie', cookie)
      .send({ form: someStatus });
    expect(res).toHaveHTTPStatus(302);

    const statusFromDB = await TaskStatus.findOne({
      where: {
        name: someStatus.name,
      },
    });
    expect(statusFromDB).toBeDefined();
  });

  it('GET /statuses/:id/edit', async () => {
    const someStatus = getFakeStatus();
    const statusFromDB = await TaskStatus.create(someStatus);
    const getRes = await request.agent(server)
      .get(`/statuses/${statusFromDB.id}/edit`)
      .set('Cookie', cookie);
    expect(getRes).toHaveHTTPStatus(200);
  });

  it('PATCH /statuses/:id', async () => {
    const statusFromDB = await TaskStatus.create(getFakeStatus());
    const newStatus = getFakeStatus();
    const res = await request.agent(server)
      .patch(`/statuses/${statusFromDB.id}`)
      .set('Cookie', cookie)
      .send({ form: newStatus });
    expect(res).toHaveHTTPStatus(302);

    const newStatusFromDB = await TaskStatus.findOne({
      where: {
        name: newStatus.name,
      },
    });
    expect(newStatusFromDB).toBeDefined();
  });

  it('DELETE /statuses/:id', async () => {
    const someStatus = getFakeStatus();
    const statusFromDB = await TaskStatus.create(someStatus);
    const res = await request.agent(server)
      .delete(`/statuses/${statusFromDB.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);

    const deletedStatusFromDB = await TaskStatus.findOne({
      where: {
        name: someStatus.name,
      },
    });
    expect(deletedStatusFromDB).toBeNull();
  });
});
