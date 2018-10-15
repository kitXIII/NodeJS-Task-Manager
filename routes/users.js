import buildFormObj from '../lib/formObjectBuilder';
import ConfirmPasswordError from '../lib/Errors/ConfirmPasswordError';
import db from '../models';

const { User } = db;

export default (router, { logger }) => {
  router
    .get('users', '/users', async (ctx) => {
      logger('Users: try to get users list');
      const users = await User.findAll();
      logger('Users: users list success');
      ctx.render('users', { users });
    })
    .get('newUser', '/users/new', (ctx) => {
      logger('Users: prepare data for new user form');
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .post('users', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      logger(`Users: got new user data: ${form.firstName} ${form.email}`);
      const user = User.build(form);
      try {
        logger('Users: try to validate user data');
        await user.validate();
        logger('Users: compare password and confirm password');
        if (form.password !== form.confirmPassword) {
          logger('Users: password not match');
          throw new ConfirmPasswordError('Values of entered passwords must match');
        }
        logger('Users: try to create user (save to database) new user');
        await user.save();
        logger('Users: new user has been created');
        ctx.flash.set({ message: 'User has been created', type: 'success' });
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.status = 422;
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })
    .get('user', '/users/:id', async (ctx) => {
      const { id } = ctx.params;
      logger(`Users: getting user with id: ${id} from DB`);
      const user = await User.findOne({
        where: {
          id,
        },
      });
      if (!user) {
        logger('Users: user not found in DB');
        ctx.throw(404, `User with userId: ${id} not found`);
      }
      ctx.render('users/user', { user });
    });
};
