import container from '../container';
import db from '../models';

const { TaskStatus, Task, User } = db;
const { logger } = container;

export const getStatusById = async (id, ctx) => {
  logger(`Getting satatus with id: ${id} from DB`);
  const status = await TaskStatus.findById(id);
  if (!status) {
    logger(`Gtatus with id: ${id} not found`);
    ctx.throw(404);
  }
  return status;
};

export const getTaskById = async (id, ctx) => {
  logger(`Getting satatus with id: ${id} from DB`);
  const task = await Task.findById(Number(id), { include: ['taskStatus', 'creator', 'assignedTo'] });
  if (!task) {
    logger(`Task with id: ${id} not found`);
    ctx.throw(404);
  }
  return task;
};

export const getUserById = async (id, ctx) => {
  logger(`Getting user with id: ${id} from DB`);
  const user = await User.findById(Number(id));
  if (!user) {
    logger(`User with userId: ${id} not found`);
    ctx.throw(404);
  }
  return user;
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
