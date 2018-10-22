import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import getBodyFormValues from '../lib/bodyFormValues';
import db from '../models';

const { taskStatus } = db;

const checkAuth = (ctx, logger) => {
  if (!ctx.state.isSignedIn()) {
    logger('Statuses: post /statuses is unauthorized');
    ctx.throw(401);
  }
  logger('Statuses: OK');
};

const getStatusById = async (id, ctx, logger) => {
  logger(`c: getting satatus with id: ${id} from DB`);
  const status = await taskStatus.findOne({
    where: {
      id,
    },
  });
  if (!status) {
    logger(`Status with id: ${id} not found`);
    ctx.throw(404);
  }
  return status;
};

export default (router, { logger }) => {
  router
    .get('statuses', '/statuses', async (ctx) => {
      logger('Statuses: try to get statuses list');
      const statuses = await taskStatus.findAll();
      logger('Statuses: statuses list success');
      ctx.render('statuses', { statuses });
    })
    .get('newStatus', '/statuses/new', (ctx) => {
      logger('Statuses: prepare data for new status form');
      const status = taskStatus.build();
      ctx.render('statuses/new', { f: buildFormObj(status) });
    })
    .post('statuses', '/statuses', async (ctx) => {
      checkAuth(ctx, logger);
      const { form } = ctx.request.body;
      logger(`Statuses: got new tasks status data: ${form.name}`);
      const status = taskStatus.build(form);
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
      const status = await getStatusById(Number(ctx.params.id), ctx, logger);
      checkAuth(ctx, logger);
      ctx.render('statuses/edit', { f: buildFormObj(status) });
    })
    .patch('patchStatus', '/statuses/:id', async (ctx) => {
      const status = await getStatusById(Number(ctx.params.id), ctx, logger);
      checkAuth(ctx, logger);
      const allowedFields = ['name'];
      const data = getBodyFormValues(allowedFields, ctx);
      logger(`Statuses: try to update: ${data.name}`);
      try {
        const result = await status.update({ ...data });
        logger(`Statuses: update status with id: ${status.id}, is OK`);
        const flashMsg = _.isEmpty(result._changed) // eslint-disable-line
          ? { message: 'There was nothing to change', type: 'secondary' }
          : { message: 'Your data has been updated', type: 'success' };
        ctx.flash.set(flashMsg);
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        logger(`Statuses: patch status with id: ${status.id}, problem: ${err.message}`);
        ctx.status = 422;
        ctx.render('statuses/edit', { f: buildFormObj(status, err) });
      }
    })
    .delete('deleteStatus', '/statuses/:id', async (ctx) => {
      const status = await getStatusById(Number(ctx.params.id), ctx, logger);
      checkAuth(ctx, logger);
      logger(`Statuses: try to delete status with id: ${status.id}`);
      try {
        await status.destroy();
        const message = `Status ${status.name} was deleted`;
        logger(message);
        ctx.flash.set({ message, type: 'info' });
        ctx.redirect(router.url('statuses'));
      } catch (err) {
        logger(`Statuses: delete status ${status.name} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete staus ${status.name}`, type: 'warning' });
        ctx.redirect(router.url('statuses'));
      }
    })
    .all('/statuses', (ctx) => {
      ctx.throw(404);
    });
};
