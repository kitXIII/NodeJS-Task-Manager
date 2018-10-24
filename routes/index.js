import welcome from './welcome';
import users from './users';
import sessions from './sessions';
import statuses from './statuses';
import tasks from './tasks';

const controllers = [welcome, users, sessions, statuses, tasks];

export default (router, container) => controllers.forEach(f => f(router, container));
