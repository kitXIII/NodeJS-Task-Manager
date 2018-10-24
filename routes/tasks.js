import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import getBodyFormValues from '../lib/bodyFormValues';
import db from '../models';

const { Task } = db;

const checkAuth = (ctx, logger) => {
  if (!ctx.state.isSignedIn()) {
    logger('Tasks: post /tasks is unauthorized');
    ctx.throw(401);
  }
  logger('Tasks: OK');
};

const getTaskById = async (id, ctx, logger) => {
  logger(`Tasks: getting satatus with id: ${id} from DB`);
  const task = await Task.findById(id, { include: ['taskStatus'] });
  if (!task) {
    logger(`Tasks: task with id: ${id} not found`);
    ctx.throw(404);
  }
  return task;
};

export default (router, { logger }) => {
  router
    .get('tasks', '/tasks', async (ctx) => {
      logger('Tasks: try to get tasks list');
      const tasks = await Task.findAll({ include: ['taskStatus'] });
      console.log(tasks[0]);
      logger('Tasks: tasks list success');
      ctx.render('tasks', { tasks });
    })
    .get('task', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(Number(ctx.params.id), ctx, logger);
      logger('Users: user data prepared to view');
      ctx.render('tasks/task', { task });
    })
    .get('newTask', '/tasks/new', (ctx) => {
      logger('Tasks: prepare data for new task form');
      const task = Task.build();
      ctx.render('tasks/new', { f: buildFormObj(task) });
    })
    .post('tasks', '/tasks', async (ctx) => {
      checkAuth(ctx, logger);
      const { form } = ctx.request.body;
      logger(`Tasks: got new tasks task data: ${form.name}`);
      const task = Task.build(form);
      try {
        await task.validate();
        logger('Tasks: validation success');
        await task.save();
        logger('Tasks: new satus has been created');
        ctx.flash.set({ message: 'Satus has been created', type: 'success' });
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        ctx.task = 422;
        ctx.render('tasks/new', { f: buildFormObj(task, err) });
      }
    })
    .get('editTask', '/tasks/:id/edit', async (ctx) => {
      const task = await getTaskById(Number(ctx.params.id), ctx, logger);
      checkAuth(ctx, logger);
      ctx.render('tasks/edit', { f: buildFormObj(task) });
    })
    .patch('patchTask', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(Number(ctx.params.id), ctx, logger);
      checkAuth(ctx, logger);
      const allowedFields = ['name'];
      const data = getBodyFormValues(allowedFields, ctx);
      logger(`Tasks: try to update: ${data.name}`);
      try {
        const result = await task.update({ ...data });
        logger(`Tasks: update task with id: ${task.id}, is OK`);
        const flashMsg = _.isEmpty(result._changed) // eslint-disable-line
          ? { message: 'There was nothing to change', type: 'secondary' }
          : { message: 'Your data has been updated', type: 'success' };
        ctx.flash.set(flashMsg);
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        logger(`Tasks: patch task with id: ${task.id}, problem: ${err.message}`);
        ctx.task = 422;
        ctx.render('tasks/edit', { f: buildFormObj(task, err) });
      }
    })
    .delete('deleteTaks', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(Number(ctx.params.id), ctx, logger);
      checkAuth(ctx, logger);
      logger(`Tasks: try to delete task with id: ${task.id}`);
      try {
        await task.destroy();
        const message = `Task with id ${task.id} was deleted`;
        logger(message);
        ctx.flash.set({ message, type: 'info' });
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        logger(`Tasks: delete task with id: ${task.id} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete task ${task.name}`, type: 'warning' });
        ctx.redirect(router.url('tasks'));
      }
    })
    .all('/tasks', (ctx) => {
      ctx.throw(404);
    });
};
