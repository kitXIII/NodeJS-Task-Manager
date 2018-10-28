import buildFormObj from '../lib/formObjectBuilder';
import { hasChanges, pickFormValues } from '../lib/helpers';
import { getById, checkSession } from './helpers';
import db from '../models';

const { TaskStatus } = db;

export default (router, { logger }) => {
  const log = msg => logger(`Statuses: ${msg}`);
  router
    .get('statuses', '/statuses', async (ctx) => {
      const statuses = await TaskStatus.findAll();
      log('Statuses list success');
      ctx.render('statuses', { statuses });
    })
    .get('newStatus', '/statuses/new', (ctx) => {
      checkSession(ctx);
      log('Prepare data for new status form');
      const status = TaskStatus.build();
      ctx.render('statuses/new', { f: buildFormObj(status) });
    })
    .post('statuses', '/statuses', async (ctx) => {
      checkSession(ctx);
      const { form } = ctx.request.body;
      log(`Got new tasks status data: ${form.name}`);
      const status = TaskStatus.build(form);
      try {
        await status.validate();
        log('Validation success');
        await status.save();
        log('New satus has been created');
        ctx.flash.set({ message: 'Satus has been created', type: 'success' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        ctx.status = 422;
        ctx.render('statuses/new', { f: buildFormObj(status, err) });
      }
    })
    .get('editStatus', '/statuses/:id/edit', async (ctx) => {
      const status = await getById(ctx.params.id, TaskStatus, ctx);
      checkSession(ctx);
      ctx.render('statuses/edit', { f: buildFormObj(status) });
    })
    .patch('patchStatus', '/statuses/:id', async (ctx) => {
      const status = await getById(ctx.params.id, TaskStatus, ctx);
      checkSession(ctx);
      const data = pickFormValues(['name'], ctx);
      if (!hasChanges(data, status)) {
        log(`There was nothing to change satatus with id: ${status.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('statuses'));
        return;
      }
      log(`Try to update: ${data.name}`);
      try {
        await status.update({ ...data });
        log(`Update status with id: ${status.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        log(`Patch status with id: ${status.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('statuses/edit', { f: buildFormObj(status, err) });
      }
    })
    .delete('deleteStatus', '/statuses/:id', async (ctx) => {
      const status = await getById(ctx.params.id, TaskStatus, ctx);
      checkSession(ctx);
      log(`Try to delete status with id: ${status.id}`);
      try {
        await status.destroy();
        const message = `Status ${status.name} was removed`;
        log(message);
        ctx.flash.set({ message, type: 'info' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        log(`Delete status ${status.name} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete status ${status.name}`, type: 'warning' });
        ctx.redirect(router.url('statuses'));
      }
    })
    .all('/statuses', (ctx) => {
      log('No such route');
      ctx.throw(404);
    });
};
