import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '..';
import db from '../models';
import encrypt from '../lib/secure';
import getCookie from './lib/authUser';

import { getFakeUser } from './lib/helpers';

const { sequelize, User } = db;

beforeAll(async () => {
  await sequelize.sync({ force: 'true' });
  jasmine.addMatchers(matchers);
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

describe('Users get edit form page', () => {
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

  it('GET /users/:id/edit', async () => {
    const res = await request.agent(server)
      .get(`/users/${user.id}/edit`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /users/:id/edit (fails without autority)', async () => {
    const res = await request.agent(server)
      .get(`/users/${user.id}/edit`);
    expect(res).toHaveHTTPStatus(401);
  });

  it('GET /users/:id/edit (fails with autority, another user)', async () => {
    const newUser = await User.create(getFakeUser());
    const res = await request.agent(server)
      .set('Cookie', cookie)
      .get(`/users/${newUser.id}/edit`);
    expect(res).toHaveHTTPStatus(401);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Users get change password form', () => {
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

  it('GET /users/:id/password/edit', async () => {
    const getRes = await request.agent(server)
      .get(`/users/${user.id}/password/edit`)
      .set('Cookie', cookie);
    expect(getRes).toHaveHTTPStatus(200);
  });

  it('GET /users/:id/password/edit (fails without autority)', async () => {
    const res = await request.agent(server)
      .get(`/users/${user.id}/password/edit`);
    expect(res).toHaveHTTPStatus(401);
  });

  it('GET /users/:id/password/edit (fails with someone else authorization)', async () => {
    const newUser = await User.create(getFakeUser());
    const res = await request.agent(server)
      .set('Cookie', cookie)
      .get(`/users/${newUser.id}/password/edit`);
    expect(res).toHaveHTTPStatus(401);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Users updade requests', () => {
  let server;
  let user;
  let cookie;

  let currentPassword;
  const password = '33Cy23Bn';
  const confirmPassword = '33Cy23Bn';

  beforeEach(async () => {
    server = app().listen();
    user = await User.create(getFakeUser());
    currentPassword = user.password;
    cookie = await getCookie(server, user);
  });

  it('PATCH /users/:id (firstName, lastName, email)', async () => {
    const { firstName, lastName, email } = getFakeUser();
    const res = await request.agent(server)
      .patch(`/users/${user.id}`)
      .set('Cookie', cookie)
      .send({ form: { firstName, lastName, email } });
    expect(res).toHaveHTTPStatus(302);

    const patchedUserFromDB = await User.findById(user.id);

    expect(patchedUserFromDB.firstName).toBe(firstName);
    expect(patchedUserFromDB.lastName).toBe(lastName);
    expect(patchedUserFromDB.email).toBe(email);
  });

  it('PATCH /users/:id/password', async () => {
    const res = await request.agent(server)
      .patch(`/users/${user.id}/password`)
      .set('Cookie', cookie)
      .send({ form: { currentPassword, password, confirmPassword } });
    expect(res).toHaveHTTPStatus(302);

    const patchedUserFromDB = await User.findById(user.id);
    expect(patchedUserFromDB.passwordDigest).toBe(encrypt(password));
  });

  it('PATCH /users/:id/password (fails without autority)', async () => {
    const delSessionRes = await request.agent(server)
      .delete('/sessions')
      .set('Cookie', cookie);
    expect(delSessionRes).toHaveHTTPStatus(302);

    const res = await request.agent(server)
      .patch(`/users/${user.id}/password`)
      .send({ form: { currentPassword, password, confirmPassword } });
    expect(res).toHaveHTTPStatus(401);

    const patchedUserFromDB = await User.findById(user.id);
    expect(patchedUserFromDB.passwordDigest).not.toBe(encrypt(password));
  });

  it('PATCH /users/:id/password (fails with someone else authorization)', async () => {
    const newUserFromDB = await User.create(getFakeUser());

    const res = await request.agent(server)
      .patch(`/users/${newUserFromDB.id}/password`)
      .set('Cookie', cookie)
      .send({ form: { currentPassword, password, confirmPassword } });
    expect(res).toHaveHTTPStatus(401);
  });

  it('PATCH /users/:id/password (fails with wrong current password', async () => {
    const res = await request.agent(server)
      .patch(`/users/${user.id}/password`)
      .set('Cookie', cookie)
      .send({ form: { currentPassword: '123wronG', password, confirmPassword } });
    expect(res).toHaveHTTPStatus(422);

    const patchedUserFromDB = await User.findById(user.id);
    expect(patchedUserFromDB.passwordDigest).not.toBe(encrypt(password));
  });

  it('PATCH /users/:id/password (fails with wrong confirm password', async () => {
    const res = await request.agent(server)
      .patch(`/users/${user.id}/password`)
      .set('Cookie', cookie)
      .send({ form: { currentPassword, password, confirmPassword: '123wronG' } });
    expect(res).toHaveHTTPStatus(422);
  });

  it('PATCH /users/:id/password (fails without confirm password', async () => {
    const res = await request.agent(server)
      .patch(`/users/${user.id}/password`)
      .set('Cookie', cookie)
      .send({ form: { currentPassword, password } });
    expect(res).toHaveHTTPStatus(422);
  });

  it('PATCH /users/:id/password (fails with easy password', async () => {
    const res = await request.agent(server)
      .patch(`/users/${user.id}/password`)
      .set('Cookie', cookie)
      .send({ form: { currentPassword, password: '123abc', confirmPassword: '123abc' } });
    expect(res).toHaveHTTPStatus(422);

    const patchedUserFromDB = await User.findById(user.id);
    expect(patchedUserFromDB.passwordDigest).not.toBe(encrypt(password));
  });

  it('PATCH /users/:id (fail where form data is not valid: firstName is empty string)', async () => {
    const { lastName } = getFakeUser();

    const res = await request.agent(server)
      .patch(`/users/${user.id}`)
      .set('Cookie', cookie)
      .send({ form: { firstName: '', lastName } });
    expect(res).toHaveHTTPStatus(422);

    const patchedUserFromDB = await User.findById(user.id);

    expect(patchedUserFromDB.firstName).toBe(user.firstName);
    expect(patchedUserFromDB.lastName).toBe(user.lastName);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

describe('Users delete requests', () => {
  let server;

  beforeEach(() => {
    server = app().listen();
  });

  it('DELETE /users/:id', async () => {
    const user = await User.create(getFakeUser());
    const cookie = await getCookie(server, user);
    const res = await request.agent(server)
      .delete(`/users/${user.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);

    const deletedUser = await User.findById(user.id);
    expect(deletedUser).toBeNull();
  });

  it('DELETE /users/:id (fails without autority)', async () => {
    const user = await User.create(getFakeUser());
    const res = await request.agent(server)
      .delete(`/users/${user.id}`);
    expect(res).toHaveHTTPStatus(401);
  });

  it('DELETE /users/:id (fails with someone else authorization)', async () => {
    const user = await User.create(getFakeUser());
    const cookie = await getCookie(server, user);

    const newUser = await User.create(getFakeUser());
    const res = await request.agent(server)
      .set('Cookie', cookie)
      .delete(`/users/${newUser.id}`);
    expect(res).toHaveHTTPStatus(401);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
