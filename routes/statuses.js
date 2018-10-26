import buildFormObj from '../lib/formObjectBuilder';
import pickFormValues from '../lib/bodyFormPicker';
import hasChanges from '../lib/changesQualifier';
import { getStatusById, checkAuth } from './helpers';
import db from '../models';

const { TaskStatus } = db;

export default (router, { logger }) => {
  router
    .get('statuses', '/statuses', async (ctx) => {
      const statuses = await TaskStatus.findAll();
      logger('Statuses: statuses list success');
      ctx.render('statuses', { statuses });
    })
    .get('newStatus', '/statuses/new', (ctx) => {
      logger('Statuses: prepare data for new status form');
      const status = TaskStatus.build();
      ctx.render('statuses/new', { f: buildFormObj(status) });
    })
    .post('statuses', '/statuses', async (ctx) => {
      checkAuth(ctx, logger);
      const { form } = ctx.request.body;
      logger(`Statuses: got new tasks status data: ${form.name}`);
      const status = TaskStatus.build(form);
      try {
        await status.validate();
        logger('Statuses: validation success');
        await status.save();
        logger('Statuses: new satus has been created');
        ctx.flash.set({ message: 'Satus has been created', type: 'success' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        ctx.status = 422;
        ctx.render('statuses/new', { f: buildFormObj(status, err) });
      }
    })
    .get('editStatus', '/statuses/:id/edit', async (ctx) => {
      const status = await getStatusById(Number(ctx.params.id), ctx);
      checkAuth(ctx, logger);
      ctx.render('statuses/edit', { f: buildFormObj(status) });
    })
    .patch('patchStatus', '/statuses/:id', async (ctx) => {
      const status = await getStatusById(Number(ctx.params.id), ctx);
      checkAuth(ctx, logger);
      const data = pickFormValues(['name'], ctx);
      if (!hasChanges(data, status)) {
        logger(`Statuses: There was nothing to change satatus with id: ${status.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('statuses'));
        return;
      }
      logger(`Statuses: try to update: ${data.name}`);
      try {
        await status.update({ ...data });
        logger(`Statuses: update status with id: ${status.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        logger(`Statuses: patch status with id: ${status.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('statuses/edit', { f: buildFormObj(status, err) });
      }
    })
    .delete('deleteStatus', '/statuses/:id', async (ctx) => {
      const status = await getStatusById(Number(ctx.params.id), ctx);
      checkAuth(ctx, logger);
      logger(`Statuses: try to delete status with id: ${status.id}`);
      try {
        await status.destroy();
        const message = `Status ${status.name} was removed`;
        logger(message);
        ctx.flash.set({ message, type: 'info' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        logger(`Statuses: delete status ${status.name} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete status ${status.name}`, type: 'warning' });
        ctx.redirect(router.url('statuses'));
      }
    })
    .all('/statuses', (ctx) => {
      ctx.throw(404);
    });
};
