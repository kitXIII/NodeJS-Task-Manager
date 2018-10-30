import _ from 'lodash';
import container from '../container';
import db from '../models';

const { Tag } = db;

const { logger } = container;

const findByIdMakers = {
  User: (Model, id) => Model.findById(id),
  TaskStatus: (Model, id) => Model.findById(id),
  Task: (Model, id) => Model.scope('full').findById(id),
};

export const getById = async (id, Model, ctx) => {
  logger(`Getting ${Model.name} with id: ${id} from DB`);
  const result = findByIdMakers[Model.name](Model, id);
  if (!result) {
    logger(`${Model.name} with id: ${id} not found`);
    ctx.throw(404);
  }
  return result;
};

export const isValidId = async (id, Model, ctx) => {
  const result = await Model.findById(Number(id));
  if (!result) {
    logger(`Check is valid id: ${Model.name} with id: ${id} not found`);
    ctx.throw(404);
  }
  return true;
};

export const checkSession = (ctx) => {
  if (!ctx.state.isSignedIn()) {
    logger('Check is user signed in: FAIL');
    ctx.throw(401);
  }
  logger('Check is user signed in: OK');
};

export const checkAuth = (user, ctx) => {
  checkSession(ctx);
  if (user.id !== ctx.state.userId) {
    logger('Check is user authorized: FAIL');
    ctx.throw(401);
  }
  logger('Check is user authorized: OK');
};

export const parseTags = str => str.split(',').map(v => v.trim()).filter(v => v);
export const stringifyTags = tags => tags.map(tag => tag.name).join(', ');

export const getTagsByNames = tagsNames => Promise.all(tagsNames
  .map(name => Tag.find({ where: { name } })))
  .then((results) => {
    const foundTags = results.filter(v => v);
    const foundTagsNames = foundTags.map(tag => tag.name);
    return Promise.all(_.difference(tagsNames, foundTagsNames)
      .map(name => Tag.create({ name })))
      .then(createdTags => [...foundTags, ...createdTags]);
  });

export const cleanTagsByTagNames = tagsNames => Promise.all(tagsNames
  .map(name => Tag.find({
    where: { name },
    include: ['Tasks'],
  })))
  .then((results) => {
    const tags = results.filter(tag => _.isEmpty(tag.Tasks));
    return Promise.all(tags.map(tag => tag.destroy()));
  });

export const listBuilders = {
  status: items => items.map(item => _.pick(item, ['id', 'name'])),
  tag: (items, recivedItems) => {
    const recived = new Set();
    if (_.isArray(recivedItems)) {
      recivedItems.forEach(item => recived.add(Number(item)));
    } else {
      recived.add(Number(recivedItems));
    }
    return items.map(item => _.pick(item, ['id', 'name']))
      .map(item => (recived.has(item.id) ? { ...item, selected: true } : item));
  },
  user: (items, visibleField = 'fullName') => items.map(item => _.pick(item, ['id', visibleField]))
    .map(item => _.mapKeys(item, (value, key) => (key === visibleField ? 'name' : key))),
};

const queryDataHandlers = {
  myTasksOnly: {
    getValue: (value, ctx) => (ctx.state.isSignedIn() && value === 'on' ? Number(ctx.state.userId) : 0),
    getScope: id => (id !== 0 ? { method: ['filterByCreatorId', id] } : null),
  },
  taskStatusId: {
    getValue: value => Number(value),
    getScope: id => (id !== 0 ? { method: ['filterByTaskStatusId', id] } : null),
  },
  assignedToId: {
    getValue: value => Number(value),
    getScope: id => (id !== 0 ? { method: ['filterByAssignedToId', id] } : null),
  },
};

export const prepareTaskScopes = (query, ctx) => _.keys(query)
  .filter(key => queryDataHandlers[key])
  .map((key) => {
    const value = queryDataHandlers[key].getValue(query[key], ctx);
    return queryDataHandlers[key].getScope(value);
  })
  .filter(v => v);
