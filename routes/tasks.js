import buildFormObj from '../lib/formObjectBuilder';
import pickFormValues from '../lib/bodyFormPicker';
import hasChanges from '../lib/changesQualifier';
import buildList from '../lib/selectionListBuilder';
import { checkAuth, isValidId, getTaskById, getUserById } from './helpers'; //eslint-disable-line
import db from '../models';

const { Task, TaskStatus, User } = db;

export default (router, { logger }) => {
  router
    .get('tasks', '/tasks', async (ctx) => {
      logger('Tasks: try to get tasks list');
      const tasks = await Task.findAll({ include: ['taskStatus', 'creator', 'assignedTo'] });
      logger('Tasks: tasks list success');
      ctx.render('tasks', { tasks });
    })
    .get('newTask', '/tasks/new', async (ctx) => {
      logger('Tasks: prepare data for new task form');
      const task = Task.build();
      const taskStatuses = await TaskStatus.findAll();
      const statusList = buildList.status(taskStatuses);
      const users = await User.findAll();
      const userList = buildList.user(users, ctx.state.userId, 'nameWithEmail');
      ctx.render('tasks/new', { f: buildFormObj(task), statusList, userList });
    })
    .get('task', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      logger('Tasks: task data prepared to view');
      ctx.render('tasks/task', { task });
    })
    .post('tasks', '/tasks', async (ctx) => {
      checkAuth(ctx, logger);
      const { form } = ctx.request.body;
      logger('Tasks: got new task data');
      const user = await getUserById(ctx.state.userId, ctx, logger);
      await isValidId(form.taskStatusId, TaskStatus, ctx, logger);
      await isValidId(form.assignedToId, User, ctx, logger);
      const statusList = buildList.status(await TaskStatus.findAll(), form.taskStatusId);
      const userList = buildList.user(await User.findAll(), form.assignedToId, 'nameWithEmail');
      logger('Tasks: try to validate new task data');
      try {
        const task = await user.createInitializedTask(form);
        logger(`Tasks: new task ${task.name} has been created`);
        ctx.flash.set({ message: `Task ${task.name} has been created`, type: 'success' });
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        ctx.status = 422;
        logger(`Tasks fial on task creation: ${err.message}`);
        ctx.render('tasks/new', { f: buildFormObj(form, err), statusList, userList });
      }
    })
    .get('editTask', '/tasks/:id/edit', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      // checkAuth(ctx, logger);
      const taskStatuses = await TaskStatus.findAll();
      const statusList = buildList.status(taskStatuses, task.taskStatusId);
      ctx.render('tasks/edit', { f: buildFormObj(task), statusList });
    })
    .patch('patchTask', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx, logger);
      // checkAuth(ctx, logger);
      const allowedFields = ['name', 'description', 'taskStatusId', 'assignedToId'];
      const data = pickFormValues(allowedFields, ctx);
      if (!hasChanges(data, task)) {
        logger(`Tasks: There was nothing to change task with id: ${task.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('task', task.id));
        return;
      }
      if (data.taskStatusId) {
        await isValidId(data.taskStatusId, TaskStatus, ctx, logger);
      }
      const taskStatuses = await TaskStatus.findAll();
      const statusList = buildList.status(taskStatuses, data.taskStatusId || task.taskStatusId);
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
