import request from 'supertest';

export default async (server, user) => {
  const res = await request.agent(server)
    .post('/sessions')
    .send({ form: { email: user.email, password: user.password } });
  const cookie = res.headers['set-cookie'];
  return cookie;
};
