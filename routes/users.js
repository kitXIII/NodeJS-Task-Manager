import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import hasChanges from '../lib/changesQualifier';
import { ConfirmPasswordError, CurrentPasswordError, NewPasswordError } from '../lib/Errors';
import encrypt from '../lib/secure';
import pickFormValues from '../lib/bodyFormPicker';
import { checkAuth, getUserById } from './helpers';
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
      } catch (err) {
        ctx.status = 422;
        ctx.render('users/new', { f: buildFormObj(user, err) });
      }
    })
    .get('user', '/users/:id', async (ctx) => {
      const { id } = ctx.params;
      const user = await getUserById(id, ctx);
      logger('Users: user data prepared to view');
      ctx.render('users/user', { user });
    })
    .get('editUser', '/users/:id/edit', async (ctx) => {
      const user = await getUserById(ctx.params.id, ctx);
      checkAuth(user, ctx);
      ctx.render('users/edit', { f: buildFormObj(user) });
    })
    .patch('patchUser', '/users/:id', async (ctx) => {
      const user = await getUserById(ctx.params.id, ctx);
      checkAuth(user, ctx);
      const allowedFields = ['firstName', 'lastName', 'email'];
      const data = pickFormValues(allowedFields, ctx);
      if (!hasChanges(data, user)) {
        logger(`Users: There was nothing to change user with id: ${user.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('user', user.id));
        return;
      }
      logger(`Users: try to update: ${data.firstName}, ${data.lastName}, ${data.email}`);
      try {
        await user.update({ ...data });
        logger(`Users: update user with id: ${user.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.session.userName = user.firstName;
        ctx.redirect(router.url('user', user.id));
      } catch (err) {
        logger(`Users: patch user with id: ${user.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('users/edit', { f: buildFormObj(user, err) });
      }
    })
    .get('editUserPassword', '/users/:id/password/edit', async (ctx) => {
      const owner = await getUserById(ctx.params.id, ctx);
      checkAuth(owner, ctx);
      const user = _.pick(owner, ['id']);
      ctx.render('users/password', { f: buildFormObj(user) });
    })
    .patch('patchUserPassword', '/users/:id/password', async (ctx) => {
      const user = await getUserById(ctx.params.id, ctx);
      checkAuth(user, ctx);
      const allowedFields = ['currentPassword', 'password', 'confirmPassword'];
      const data = pickFormValues(allowedFields, ctx);
      if (_.isEmpty(data)) {
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('user', user.id));
        return;
      }
      logger('Users: try to change password');
      try {
        if (!data.password) {
          logger('Users: password error');
          throw new NewPasswordError("Password can't be empty");
        }
        if (!data.currentPassword || user.passwordDigest !== encrypt(data.currentPassword)) {
          logger('Users: current password error');
          throw new CurrentPasswordError('Wrong value');
        }
        if (data.password !== data.confirmPassword) {
          logger('Users: password not match');
          throw new ConfirmPasswordError('Values of entered passwords must match');
        }
        const { password } = data;
        await user.update({ password });
        logger(`Users: user with id: ${user.id} change password successful`);
        ctx.flash.set({ message: 'Your password has been changed.', type: 'success' });
        ctx.redirect(router.url('user', user.id));
      } catch (err) {
        logger(`Users: patch user with id: ${user.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('users/password', { f: buildFormObj(user, err) });
      }
    })
    .delete('deleteUser', '/users/:id', async (ctx) => {
      const user = await getUserById(ctx.params.id, ctx);
      checkAuth(user, ctx);
      logger(`Users: try to delete user with id: ${user.id}`);
      try {
        await user.destroy();
        logger(`Users: user with id: ${user.id} deleted`);
        ctx.session = {};
        ctx.flash.set({ message: 'Your user data has been completely deleted from the system. Farewell.', type: 'info' });
        ctx.redirect(router.url('root'));
      } catch (err) {
        logger(`Users: delete user with id: ${user.id} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete user ${user.fullName}`, type: 'warning' });
        ctx.redirect(router.url('user', user.id));
      }
    })
    .all('/users', (ctx) => {
      ctx.throw(404);
    });
};
