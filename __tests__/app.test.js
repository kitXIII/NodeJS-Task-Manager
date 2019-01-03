import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import app from '..';
import db from '../models';

const { sequelize } = db;

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  // eslint-disable-next-line jest/no-jasmine-globals
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
