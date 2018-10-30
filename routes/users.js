import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';
import { hasChanges, pickFormValues } from '../lib/helpers';
import { ConfirmPasswordError, CurrentPasswordError, NewPasswordError } from '../lib/Errors';
import { checkAuth, getById } from '../lib/routesHelpers';
import db from '../models';

const { User } = db;

export default (router, { logger }) => {
  const log = msg => logger(`Users: ${msg}`);
  router
    .get('users', '/users', async (ctx) => {
      log('Try to get users list');
      const users = await User.findAll();
      log('Users list success');
      ctx.render('users', { users });
    })
    .get('newUser', '/users/new', (ctx) => {
      log('Prepare data for new user form');
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .post('users', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      log(`Got new user data: ${form.firstName} ${form.email}`);
      const user = User.build(form);
      try {
        log('Try to validate user data');
        await user.validate();
        if (form.password !== form.confirmPassword) {
          log('Password and confirm password not match');
          throw new ConfirmPasswordError('Values of entered passwords must match');
        }
        log('Try to create user (save to database) new user');
        await user.save();
        log('New user has been created');
        ctx.flash.set({ message: 'User has been created', type: 'success' });
        ctx.redirect(router.url('root'));
      } catch (err) {
        ctx.status = 422;
        ctx.render('users/new', { f: buildFormObj(user, err) });
      }
    })
    .get('user', '/users/:id', async (ctx) => {
      const { id } = ctx.params;
      const user = await getById(id, User, ctx);
      log('User data prepared to view');
      ctx.render('users/user', { user });
    })
    .get('editUser', '/users/:id/edit', async (ctx) => {
      const user = await getById(ctx.params.id, User, ctx);
      checkAuth(user, ctx);
      ctx.render('users/edit', { f: buildFormObj(user) });
    })
    .patch('patchUser', '/users/:id', async (ctx) => {
      const user = await getById(ctx.params.id, User, ctx);
      checkAuth(user, ctx);
      const allowedFields = ['firstName', 'lastName', 'email'];
      const data = pickFormValues(allowedFields, ctx);
      if (!hasChanges(data, user)) {
        log(`There was nothing to change user with id: ${user.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('user', user.id));
        return;
      }
      log(`Try to update: ${data.firstName}, ${data.lastName}, ${data.email}`);
      try {
        await user.update({ ...data });
        log(`update user with id: ${user.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.session.userName = user.firstName;
        ctx.redirect(router.url('user', user.id));
      } catch (err) {
        log(`patch user with id: ${user.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('users/edit', { f: buildFormObj(user, err) });
      }
    })
    .get('editUserPassword', '/users/:id/password/edit', async (ctx) => {
      const owner = await getById(ctx.params.id, User, ctx);
      checkAuth(owner, ctx);
      const user = _.pick(owner, ['id']);
      ctx.render('users/password', { f: buildFormObj(user) });
    })
    .patch('patchUserPassword', '/users/:id/password', async (ctx) => {
      const user = await getById(ctx.params.id, User, ctx);
      checkAuth(user, ctx);
      const allowedFields = ['currentPassword', 'password', 'confirmPassword'];
      const data = pickFormValues(allowedFields, ctx);
      if (_.isEmpty(data)) {
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('user', user.id));
        return;
      }
      log('Try to change password');
      try {
        if (!data.password) {
          log('Password error');
          throw new NewPasswordError("Password can't be empty");
        }
        if (!data.currentPassword || user.passwordDigest !== encrypt(data.currentPassword)) {
          log('Current password error');
          throw new CurrentPasswordError('Wrong value');
        }
        if (data.password !== data.confirmPassword) {
          log('Password not match');
          throw new ConfirmPasswordError('Values of entered passwords must match');
        }
        const { password } = data;
        await user.update({ password });
        log(`User with id: ${user.id} change password successful`);
        ctx.flash.set({ message: 'Your password has been changed.', type: 'success' });
        ctx.redirect(router.url('user', user.id));
      } catch (err) {
        log(`Patch user with id: ${user.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('users/password', { f: buildFormObj(user, err) });
      }
    })
    .delete('deleteUser', '/users/:id', async (ctx) => {
      const user = await getById(ctx.params.id, User, ctx);
      checkAuth(user, ctx);
      log(`Try to delete user with id: ${user.id}`);
      try {
        await user.destroy();
        log(`User with id: ${user.id} deleted`);
        ctx.session = {};
        ctx.flash.set({ message: 'Your user data has been completely deleted from the system. Farewell.', type: 'info' });
        ctx.redirect(router.url('root'));
      } catch (err) {
        log(`Delete user with id: ${user.id} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete user ${user.fullName}. This user probably has assigned tasks. Try reassigning them.`, type: 'warning' });
        ctx.redirect(router.url('user', user.id));
      }
    })
    .all('/users', (ctx) => {
      log('No such route');
      ctx.throw(404);
    });
};
