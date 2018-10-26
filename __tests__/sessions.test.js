import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import app from '..';
import db from '../models';

import { getFakeUser } from './lib/helpers';

const { sequelize, User } = db;

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  jasmine.addMatchers(matchers);
});

describe('Sessions requests', () => {
  let server;
  let user;

  beforeEach(async () => {
    server = app().listen();
    user = getFakeUser();
    await User.create(user);
  });

  afterEach((done) => {
    server.close();
    done();
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
});
