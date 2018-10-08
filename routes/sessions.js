import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';
import db from '../models';

const { User } = db;

export default (router, { logger }) => {
  router
    .get('newSession', '/session/new', async (ctx) => {
      logger('Sessions: prepare login form');
      const data = {};
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/session', async (ctx) => {
      const { email, password } = ctx.request.body.form;
      logger(`Try to fing user with email ${email} in databse`);
      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        logger(`User with email ${email} logged in`);
        ctx.session.userId = user.id;
        ctx.redirect(router.url('root'));
        return;
      }
      logger(`Email: ${email} or password were wrong`);
      ctx.flash.set('email or password were wrong');
      ctx.render('sessions/new', { f: buildFormObj({ email }) });
    })
    .delete('session', '/session', (ctx) => {
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
