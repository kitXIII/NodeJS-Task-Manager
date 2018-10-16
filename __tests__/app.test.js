import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '..';
import db from '../models';

const { sequelize, User } = db;

const getFakeUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  password: '11qwertY',
  confirmPassword: '11qwertY',
});

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  jasmine.addMatchers(matchers);
});

describe('Basic requests', () => {
  let server;

  beforeEach(() => {
    server = app().listen();
  });

  it('GET /', async () => {
    const res = await request.agent(server)
      .get('/');
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET 404', async () => {
    const res = await request.agent(server)
      .get('/wrong-path');
    expect(res).toHaveHTTPStatus(404);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Users requests', () => {
  let server;
  const user = getFakeUser();

  beforeEach(() => {
    server = app().listen();
  });

  it('GET /users', async () => {
    const res = await request.agent(server)
      .get('/users');
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /users/new', async () => {
    const res = await request.agent(server)
      .get('/users/new');
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /users', async () => {
    const someUser = getFakeUser();
    const res = await request.agent(server)
      .post('/users')
      .send({ form: someUser });
    expect(res).toHaveHTTPStatus(302);
    const url = res.headers.location;
    expect(url).toBe('/');

    const userFromDB = await User.findOne({
      where: {
        email: someUser.email,
      },
    });
    expect(userFromDB).toBeDefined();
  });

  it('GET /users/:id', async () => {
    const someUser = getFakeUser();
    const userFromDB = await User.create(someUser);

    const getRes = await request.agent(server)
      .get(`/users/${userFromDB.id}`);
    expect(getRes).toHaveHTTPStatus(200);
  });

  it('POST /users (email duplicate)', async () => {
    const someUser = getFakeUser();
    await User.create(someUser);

    const res = await request.agent(server)
      .post('/users')
      .send({ form: someUser });
    expect(res).toHaveHTTPStatus(422);
  });

  it('POST /users (email error)', async () => {
    const res = await request.agent(server)
      .post('/users')
      .send({ form: { ...user, email: 'not email' } });
    expect(res).toHaveHTTPStatus(422);
  });

  it('POST /users (firsName error)', async () => {
    const res = await request.agent(server)
      .post('/users')
      .send({ form: { ...user, firstName: '' } });
    expect(res).toHaveHTTPStatus(422);
  });

  it('POST /users (password error)', async () => {
    const res = await request.agent(server)
      .post('/users')
      .send({ form: { ...user, password: '12345', confirmPassword: '12345' } });
    expect(res).toHaveHTTPStatus(422);
  });

  it('POST /users (confirm password error)', async () => {
    const res = await request.agent(server)
      .post('/users')
      .send({ form: { ...user, confirmPassword: faker.internet.password() } });
    expect(res).toHaveHTTPStatus(422);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Sessions requests', () => {
  let server;
  let user;

  beforeAll(async () => {
    user = getFakeUser();
    await User.create(user);
  });

  beforeEach(() => {
    server = app().listen();
  });

  it('GET /sessions/new', async () => {
    const res = await request.agent(server)
      .get('/sessions/new');
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /sessions', async () => {
    const { email, password } = user;
    const res = await request.agent(server)
      .post('/sessions')
      .send({ form: { email, password } });
    expect(res).toHaveHTTPStatus(302);

    const url = res.headers.location;
    expect(url).toBe('/');
  });

  it('DELETE /sessions (with post _method: DELETE)', async () => {
    const { email, password } = user;
    const postRes = await request.agent(server)
      .post('/sessions')
      .send({ form: { email, password } });
    expect(postRes).toHaveHTTPStatus(302);
    const cookie = postRes.headers['set-cookie'];

    const delRes = await request.agent(server)
      .post('/sessions')
      .set('Cookie', cookie)
      .send({ _method: 'DELETE' });
      // .delete('/sessions');
    expect(delRes).toHaveHTTPStatus(302);

    const url = delRes.headers.location;
    expect(url).toBe('/');
  });

  it('POST /sessions (errors)', async () => {
    const res = await request.agent(server)
      .post('/sessions')
      .send({ form: { email: 'impossible@user.mail', password: '1qwertY1' } });
    expect(res).toHaveHTTPStatus(422);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
