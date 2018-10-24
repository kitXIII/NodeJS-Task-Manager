import buildFormObj from '../lib/formObjectBuilder';
import getBodyFormValues from '../lib/bodyFormValues';
import hasChanges from '../lib/hasChanges';
import db from '../models';

const { Task, TaskStatus } = db;

const checkAuth = (ctx, logger) => {
  if (!ctx.state.isSignedIn()) {
    logger('Tasks: post /tasks is unauthorized');
    ctx.throw(401);
  }
  logger('Tasks: OK');
};

const getTaskById = async (id, ctx, logger) => {
  logger(`Tasks: getting satatus with id: ${id} from DB`);
  const task = await Task.findById(Number(id), { include: ['taskStatus'] });
  if (!task) {
    logger(`Tasks: task with id: ${id} not found`);
    ctx.throw(404);
  }
  return task;
};

const isValidTaskStatusId = async (id, ctx, logger) => {
  const status = await TaskStatus.findById(Number(id));
  if (!status) {
    logger(`Tasks: status with id: ${id} not found`);
    ctx.throw(404);
  }
  return true;
};

const prepareStatusList = (statusList, selectedId) => {
  const baseId = selectedId ? Number(selectedId) : 1;
  return statusList
    .map(({ id, name }) => (id === baseId ? { id, name, selected: true } : { id, name }));
};

export default (router, { logger }) => {
  router
    .get('tasks', '/tasks', async (ctx) => {
      logger('Tasks: try to get tasks list');
      const tasks = await Task.findAll({ include: ['taskStatus'] });
      logger('Tasks: tasks list success');
      ctx.render('tasks', { tasks });
    })
    .get('newTask', '/tasks/new', async (ctx) => {
      logger('Tasks: prepare data for new task form');
      const task = Task.build();
      const taskStatuses = await TaskStatus.findAll();
      const statusList = prepareStatusList(taskStatuses);
      ctx.render('tasks/new', { f: buildFormObj(task), statusList });
    })
    .get('task', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      logger('Tasks: task data prepared to view');
      ctx.render('tasks/task', { task });
    })
    .post('tasks', '/tasks', async (ctx) => {
      // checkAuth(ctx, logger);
      const { form } = ctx.request.body;
      logger('Tasks: got new task data');
      const task = Task.build(form);
      await isValidTaskStatusId(form.taskStatusId, ctx, logger);
      const taskStatuses = await TaskStatus.findAll();
      const statusList = prepareStatusList(taskStatuses, form.taskStatusId);
      logger('Tasks: try to validate new task data');
      try {
        await task.validate();
        logger('Tasks: validation success');
        await task.save();
        logger('Tasks: new satus has been created');
        ctx.flash.set({ message: `Task ${task.name} has been created`, type: 'success' });
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        ctx.status = 422;
        ctx.render('tasks/new', { f: buildFormObj(task, err), statusList });
      }
    })
    .get('editTask', '/tasks/:id/edit', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      // checkAuth(ctx, logger);
      const taskStatuses = await TaskStatus.findAll();
      const statusList = prepareStatusList(taskStatuses, task.taskStatusId);
      ctx.render('tasks/edit', { f: buildFormObj(task), statusList });
    })
    .patch('patchTask', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      // checkAuth(ctx, logger);
      const allowedFields = ['name', 'description', 'taskStatusId'];
      const data = getBodyFormValues(allowedFields, ctx);
      if (!hasChanges(data, task)) {
        logger(`Tasks: There was nothing to change task with id: ${task.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('task', task.id));
        return;
      }
      if (data.taskStatusId) {
        await isValidTaskStatusId(data.taskStatusId, ctx, logger);
      }
      const taskStatuses = await TaskStatus.findAll();
      const statusList = prepareStatusList(taskStatuses, data.taskStatusId || task.taskStatusId);
      logger(`Tasks: try to update task with id: ${task.id}`);
      try {
        await task.update({ ...data });
        logger(`Tasks: update task with id: ${task.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.redirect(router.url('task', task.id));
      } catch (err) {
        logger(`Tasks: patch task with id: ${task.id}, problem: ${err.message}`);
        ctx.task = 422;
        ctx.render('tasks/edit', { f: buildFormObj(task, err), statusList });
      }
    })
    .delete('deleteTask', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      // checkAuth(ctx, logger);
      logger(`Tasks: try to delete task with id: ${task.id}`);
      try {
        await task.destroy();
        const message = `Task #${task.id} ${task.name} was removed`;
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
