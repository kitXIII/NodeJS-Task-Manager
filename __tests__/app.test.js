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
  password: faker.internet.password(),
});

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
});

describe('Main requests', () => {
  let server;
  beforeAll(() => {
    jasmine.addMatchers(matchers);
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

  afterAll((done) => {
    server.close();
    done();
  });
});

describe('Users', () => {
  let server;
  const user = getFakeUser();

  beforeAll(() => {
    jasmine.addMatchers(matchers);
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

  afterAll((done) => {
    server.close();
    done();
  });
});

describe('Sessions', async () => {
  let server;
  const user = getFakeUser();
  beforeAll(() => {
    jasmine.addMatchers(matchers);
    server = app().listen();
  });

  it('GET /session/new', async () => {
    const res = await request.agent(server)
      .get('/session/new');
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /session && POST /session with _method: DELETE', async () => {
    const postUserRes = await request.agent(server)
      .post('/users')
      .send({ form: user });
    expect(postUserRes).toHaveHTTPStatus(302);
    const url1 = postUserRes.headers.location;
    expect(url1).toBe('/');
    const { email, password } = user;
    const postSessionRes = await request.agent(server)
      .post('/session')
      .send({ form: { email, password } });
    expect(postSessionRes).toHaveHTTPStatus(302);
    const url2 = postSessionRes.headers.location;
    expect(url2).toBe('/');
    const delSessionRes = await request.agent(server)
      .post('/session')
      .send({ _method: 'DELETE' });
      // .delete('/session');
    expect(delSessionRes).toHaveHTTPStatus(302);
    const url3 = delSessionRes.headers.location;
    expect(url3).toBe('/');
  });

  afterAll((done) => {
    server.close();
    done();
  });
});
