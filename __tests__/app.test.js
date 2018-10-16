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

describe('Main requests', () => {
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

describe('Users', () => {
  let server;
  const user = getFakeUser();
  const user2 = getFakeUser();

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

  it('POST /users && GET /users/:id', async () => {
    const postRes = await request.agent(server)
      .post('/users')
      .send({ form: user });
    expect(postRes).toHaveHTTPStatus(302);
    const url = postRes.headers.location;
    expect(url).toBe('/');

    const userFromDB = await User.findOne({
      where: {
        email: user.email,
      },
    });
    expect(userFromDB).toBeDefined();

    const getRes = await request.agent(server)
      .get(`/users/${userFromDB.id}`);
    expect(getRes).toHaveHTTPStatus(200);
  });

  it('POST /users (email error)', async () => {
    const res1 = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: { ...user2, email: 'not email' } });
    expect(res1).toHaveHTTPStatus(422);
  });

  it('POST /users (firsName error)', async () => {
    const res1 = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: { ...user2, firstName: '' } });
    expect(res1).toHaveHTTPStatus(422);
  });

  it('POST /users (password error)', async () => {
    const res1 = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: { ...user2, password: '12345', confirmPassword: '12345' } });
    expect(res1).toHaveHTTPStatus(422);
  });

  it('POST /users (confirm password error)', async () => {
    const res1 = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: { ...user2, confirmPassword: faker.internet.password() } });
    expect(res1).toHaveHTTPStatus(422);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Sessions', async () => {
  let server;
  const user = getFakeUser();

  beforeEach(() => {
    server = app().listen();
  });

  it('GET /sessions/new', async () => {
    const res = await request.agent(server)
      .get('/sessions/new');
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /sessions && POST /sessions with _method: DELETE', async () => {
    const postUserRes = await request.agent(server)
      .post('/users')
      .send({ form: user });
    expect(postUserRes).toHaveHTTPStatus(302);

    const url1 = postUserRes.headers.location;
    expect(url1).toBe('/');

    const { email, password } = user;
    const postSessionRes = await request.agent(server)
      .post('/sessions')
      .send({ form: { email, password } });
    expect(postSessionRes).toHaveHTTPStatus(302);

    const url2 = postSessionRes.headers.location;
    expect(url2).toBe('/');

    const delSessionRes = await request.agent(server)
      .post('/sessions')
      .send({ _method: 'DELETE' });
      // .delete('/sessions');
    expect(delSessionRes).toHaveHTTPStatus(302);

    const url3 = delSessionRes.headers.location;
    expect(url3).toBe('/');
  });

  it('POST /sessions (errors)', async () => {
    const res1 = await request.agent(server)
      .post('/sessions')
      .type('form')
      .send({ form: { email: 'impossible@user.mail', password: '1qwertY1' } });
    expect(res1).toHaveHTTPStatus(422);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
