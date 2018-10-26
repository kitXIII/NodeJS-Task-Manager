import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';
import db from '../models';

const { User } = db;

export default (router, { logger }) => {
  const log = msg => logger(`Sessions: ${msg}`);
  router
    .get('newSession', '/sessions/new', async (ctx) => {
      log('Prepare login form');
      const data = {};
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/sessions', async (ctx) => {
      const { email, password } = ctx.request.body.form;
      log(`Try to fing user with email ${email} in databse`);
      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        ctx.session.userId = user.id;
        ctx.session.userName = user.firstName;
        log(`User with email ${email} logged in`);
        ctx.flash.set({ message: `Hello, ${user.firstName}`, type: 'info' });
        ctx.redirect(router.url('root'));
        return;
      }
      const errors = [];
      if (!user) {
        errors.push({ message: 'Some problems with the entered Email', path: 'email' });
        log(`Email: ${email} wrong`);
      } else {
        errors.push({ message: 'Some problems with the entered password', path: 'password' });
        log('Password wrong');
      }
      ctx.status = 422;
      ctx.render('sessions/new', { f: buildFormObj({ email }, { errors }) });
    })
    .delete('session', '/sessions', (ctx) => {
      ctx.session = {};
      ctx.flash.set({ message: 'Bye!', type: 'info' });
      log('Session destroy');
      ctx.redirect(router.url('root'));
    })
    .all('/sessions', (ctx) => {
      log('No such route');
      ctx.throw(404);
    });
};
