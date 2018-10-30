import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import { getChanges, pickFormValues } from '../lib/helpers';
import db from '../models';
import {
  checkSession,
  isValidId,
  getById,
  getTagsByNames,
  stringifyTags,
  parseTags,
  cleanTagsByTagNames,
  listBuilders,
  prepareTaskScopes,
} from '../lib/routesHelpers';

const {
  Task, TaskStatus, User, Tag,
} = db;

export default (router, { logger }) => {
  const log = msg => logger(`Tasks: ${msg}`);
  router
    .get('tasks', '/tasks', async (ctx) => {
      const { query } = ctx.request;
      log(`Got /tasks query: ${JSON.stringify(query)}`);
      const taskScopeFilters = prepareTaskScopes(query, ctx);
      log(`Try to get tasks list, use scope filters: ${JSON.stringify(taskScopeFilters)}`);
      const tasks = await Task.scope(taskScopeFilters)
        .findAll({ include: ['taskStatus', 'creator', 'assignedTo'] });

      log('Try to get lists for filters');
      const taskStatuses = await TaskStatus.findAll();
      const statusList = [{ id: 0, name: 'All' }, ...listBuilders.status(taskStatuses)];
      const users = await User.findAll();
      const userList = [{ id: 0, name: 'All' }, ...listBuilders.user(users, 'nameWithEmail')];

      const tags = await Tag.findAll();
      const tagList = listBuilders.tag(tags, query.tags);

      const f = buildFormObj({
        myTasksOnly: query.myTasksOnly || false,
        taskStatusId: query.taskStatusId || 0,
        assignedToId: query.assignedToId || 0,
      }, {}, true);
      ctx.render('tasks', {
        f, tasks, statusList, userList, tagList,
      });
    })
    .get('newTask', '/tasks/new', async (ctx) => {
      checkSession(ctx);
      log('Prepare data for new task form');
      const task = Task.build();
      task.statusId = 1;
      task.assignedToId = Number(ctx.state.userId);
      const taskStatuses = await TaskStatus.findAll();
      const statusList = listBuilders.status(taskStatuses);
      const users = await User.findAll();
      const userList = listBuilders.user(users, 'nameWithEmail');
      ctx.render('tasks/new', { f: buildFormObj(task), statusList, userList });
    })
    .get('task', '/tasks/:id', async (ctx) => {
      const task = await getById(ctx.params.id, Task, ctx);
      log('Task data prepared to view');
      ctx.render('tasks/task', { task });
    })
    .post('tasks', '/tasks', async (ctx) => {
      checkSession(ctx);
      const { form } = ctx.request.body;
      log(`Got new task data: ${JSON.stringify(form)}`);
      const user = await getById(ctx.state.userId, User, ctx);
      await isValidId(form.taskStatusId, TaskStatus, ctx);
      await isValidId(form.assignedToId, User, ctx);
      const statusList = listBuilders.status(await TaskStatus.findAll());
      const userList = listBuilders.user(await User.findAll(), 'nameWithEmail');
      log('Try to validate new task data');
      try {
        const task = await user.createInitializedTask(form);
        const tags = await getTagsByNames(parseTags(form.tags));
        await task.setTags(tags);
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
      const task = await getById(ctx.params.id, Task, ctx);
      checkSession(ctx);
      const statusList = listBuilders.status(await TaskStatus.findAll());
      const userList = listBuilders.user(await User.findAll(), 'nameWithEmail');
      task.tags = stringifyTags(task.Tags);
      ctx.render('tasks/edit', { f: buildFormObj(task), statusList, userList });
    })
    .patch('patchTask', '/tasks/:id', async (ctx) => {
      const task = await getById(ctx.params.id, Task, ctx);
      task.tags = stringifyTags(task.Tags);
      checkSession(ctx);
      const allowedFields = ['name', 'description', 'taskStatusId', 'assignedToId', 'tags'];
      const pickedFormData = pickFormValues(allowedFields, ctx);
      const changes = getChanges(pickedFormData, task);
      if (_.isEmpty(changes)) {
        log(`There was nothing to change task with id: ${task.id}`);
        ctx.flash.set({ message: 'There was nothing to change', type: 'secondary' });
        ctx.redirect(router.url('task', task.id));
        return;
      }
      log(`Task with id: ${task.id} changes: ${JSON.stringify(changes)}`);
      if (changes.taskStatusId) {
        await isValidId(changes.taskStatusId, TaskStatus, ctx);
      }
      if (changes.assignedToId) {
        await isValidId(changes.assignedToId, User, ctx);
      }
      const currentTagsNames = task.Tags.map(tag => tag.name);
      const recivedTagsNames = changes.tags ? parseTags(changes.tags) : [];
      const removedTagsNames = _.difference(currentTagsNames, recivedTagsNames);

      const statusList = listBuilders.status(await TaskStatus.findAll());
      const userList = listBuilders.user(await User.findAll(), 'nameWithEmail');
      log(`Try to update task with id: ${task.id}`);
      try {
        await task.update({ ...changes });
        log(`Try to get recived tags of changed task with id: ${task.id}`);
        const tags = await getTagsByNames(recivedTagsNames);
        log(`Try to set tags of task with id: ${task.id}`);
        await task.setTags(tags);
        log(`Update task with id: ${task.id}, is OK`);
        ctx.flash.set({ message: 'Your data has been updated', type: 'success' });
        ctx.redirect(router.url('task', task.id));
      } catch (err) {
        log(`Patch task with id: ${task.id}, problem: ${err.message}`);
        ctx.task = 422;
        if (changes.tags) {
          task.tags = changes.tags;
        }
        if (changes.taskStatusId) {
          task.taskStatusId = changes.taskStatusId;
        }
        if (changes.assignedToId) {
          task.assignedToId = changes.assignedToId;
        }
        log(`Task with id: ${task.id} changes: ${JSON.stringify(task)}`);
        ctx.render('tasks/edit', { f: buildFormObj(task, err), statusList, userList });
      }
      if (!_.isEmpty(removedTagsNames)) {
        log('Some tags have been removed, trying to clean the Tags table from entries with empty Task links');
        await cleanTagsByTagNames(removedTagsNames);
      }
    })
    .delete('deleteTask', '/tasks/:id', async (ctx) => {
      const task = await getById(ctx.params.id, Task, ctx);
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
