import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import ConfirmPasswordError from '../lib/Errors/ConfirmPasswordError';
import db from '../models';

const { User } = db;

const getUserById = async (id, ctx, logger = console.log) => {
  logger(`Users: getting user with id: ${id} from DB`);
  const user = await User.findOne({
    where: {
      id,
    },
  });
  if (!user) {
    logger(`User with userId: ${id} not found`);
    ctx.throw(404);
  }
  return user;
};

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
      const user = await getUserById(id, ctx, logger);
      logger('Users: user data prepared to view');
      ctx.render('users/user', { user });
    })
    .get('editUser', '/users/:id/edit', async (ctx) => {
      const id = Number(ctx.params.id);
      const user = await getUserById(id, ctx, logger);
      logger('Users: check that logged in user data is requested');
      if (!ctx.state.isSignedIn() || id !== ctx.state.userId) {
        ctx.throw(401);
      }
      logger('Users: OK');
      ctx.render('users/edit', { f: buildFormObj(user), id });
    })
    .patch('patchUser', '/users/:id', async (ctx) => {
      const id = Number(ctx.params.id);
      logger(`Users: request for patch user data: ${id}`);
      const user = await getUserById(id, ctx, logger);
      logger('Users: check that logged in user data is requested');
      if (!ctx.state.isSignedIn() || id !== ctx.state.userId) {
        ctx.throw(401);
      }
      logger('Users: OK');
      const { form: rawData } = ctx.request.body;
      const allowedFields = ['firstName', 'lastName', 'email'];
      const data = _.pickBy(_.pick(rawData, allowedFields), str => str);
      logger(`Users: try to update: ${data.firstName}, ${data.lastName}, ${data.email}`);
      try {
        await user.update({ ...data });
        logger(`Users: patch user with id: ${id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.session.userName = user.firstName;
        ctx.redirect(router.url('user', id));
      } catch (err) {
        logger(`Users: patch user with id: ${id}, problem: ${err.message}`);
        ctx.render('users/edit', { f: buildFormObj(user, err), id });
      }
    });
};
