import _ from 'lodash';
import container from '../container';
import db from '../models';

const { Tag } = db;

const { logger } = container;

export const getById = async (id, Model, ctx) => {
  logger(`Getting ${Model.name} with id: ${id} from DB`);
  const status = await Model.findById(id);
  if (!status) {
    logger(`${Model.name} with id: ${id} not found`);
    ctx.throw(404);
  }
  return status;
};

export const isValidId = async (id, Model, ctx) => {
  const status = await Model.findById(Number(id));
  if (!status) {
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

// export const cleanTagsByTagNames = tagsNames => Promise.all(tagsNames
//   .map(name => ))
//   .then((results) => {});
