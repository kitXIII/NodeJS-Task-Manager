import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import { getChanges, pickFormValues } from '../lib/helpers';
import buildList from '../lib/selectionListBuilder';
import { checkSession, isValidId, getTaskById, getUserById } from './helpers'; //eslint-disable-line
import db from '../models';

const { Task, TaskStatus, User } = db;

export default (router, { logger }) => {
  const log = msg => logger(`Tasks: ${msg}`);
  router
    .get('tasks', '/tasks', async (ctx) => {
      log('Try to get tasks list');
      const tasks = await Task.findAll({ include: ['taskStatus', 'creator', 'assignedTo'] });
      log('Tasks list success');
      ctx.render('tasks', { tasks });
    })
    .get('newTask', '/tasks/new', async (ctx) => {
      checkSession(ctx);
      log('Prepare data for new task form');
      const task = Task.build();
      const taskStatuses = await TaskStatus.findAll();
      const statusList = buildList.status(taskStatuses);
      const users = await User.findAll();
      const userList = buildList.user(users, ctx.state.userId, 'nameWithEmail');
      ctx.render('tasks/new', { f: buildFormObj(task), statusList, userList });
    })
    .get('task', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx);
      log('Task data prepared to view');
      ctx.render('tasks/task', { task });
    })
    .post('tasks', '/tasks', async (ctx) => {
      checkSession(ctx);
      const { form } = ctx.request.body;
      log('Got new task data');
      const user = await getUserById(ctx.state.userId, ctx);
      await isValidId(form.taskStatusId, TaskStatus, ctx);
      await isValidId(form.assignedToId, User, ctx);
      const statusList = buildList.status(await TaskStatus.findAll(), form.taskStatusId);
      const userList = buildList.user(await User.findAll(), form.assignedToId, 'nameWithEmail');
      log('Try to validate new task data');
      try {
        const task = await user.createInitializedTask(form);
        log(`New task ${task.name} has been created`);
        ctx.flash.set({ message: `Task ${task.name} has been created`, type: 'success' });
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        ctx.status = 422;
        log(`Fail on task creation: ${err.message}`);
        ctx.render('tasks/new', { f: buildFormObj(form, err), statusList, userList });
      }
    })
    .get('editTask', '/tasks/:id/edit', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx);
      checkSession(ctx);
      const statusList = buildList.status(await TaskStatus.findAll(), task.taskStatusId);
      const userList = buildList.user(await User.findAll(), task.assignedToId, 'nameWithEmail');
      ctx.render('tasks/edit', { f: buildFormObj(task), statusList, userList });
    })
    .patch('patchTask', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx);
      checkSession(ctx);
      const allowedFields = ['name', 'description', 'taskStatusId', 'assignedToId'];
      const pickedFormData = pickFormValues(allowedFields, ctx);
      const changes = getChanges(pickedFormData, task);
      console.log(pickedFormData);
      console.log(changes);
      if (_.isEmpty(changes)) {
        log(`There was nothing to change task with id: ${task.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('task', task.id));
        return;
      }
      if (changes.taskStatusId) {
        await isValidId(changes.taskStatusId, TaskStatus, ctx);
      }
      if (changes.assignedToId) {
        await isValidId(changes.assignedToId, User, ctx);
      }
      const statusList = buildList
        .status(await TaskStatus.findAll(), changes.taskStatusId || task.taskStatusId);
      const userList = buildList
        .user(await User.findAll(), changes.assignedToId || task.assignedToId, 'nameWithEmail');
      log(`Try to update task with id: ${task.id}`);
      try {
        await task.update({ ...changes });
        log(`Update task with id: ${task.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.redirect(router.url('task', task.id));
      } catch (err) {
        log(`Patch task with id: ${task.id}, problem: ${err.message}`);
        ctx.task = 422;
        ctx.render('tasks/edit', { f: buildFormObj(task, err), statusList, userList });
      }
    })
    .delete('deleteTask', '/tasks/:id', async (ctx) => {
      const task = await getTaskById(ctx.params.id, ctx);
      checkSession(ctx);
      log(`Try to delete task with id: ${task.id}`);
      try {
        await task.destroy();
        const message = `Task #${task.id} ${task.name} was removed`;
        log(message);
        ctx.flash.set({ message, type: 'info' });
        ctx.redirect(router.url('tasks'));
      } catch (err) {
        log(`Delete task with id: ${task.id} problem: ${err.message}`);
        ctx.flash.set({ message: `Unable to delete task ${task.name}`, type: 'warning' });
        ctx.redirect(router.url('tasks'));
      }
    })
    .all('/tasks', (ctx) => {
      log('No such route');
      ctx.throw(404);
    });
};
