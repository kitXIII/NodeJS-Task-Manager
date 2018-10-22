import welcome from './welcome';
import users from './users';
import sessions from './sessions';
import statuses from './statuses';

const controllers = [welcome, users, sessions, statuses];

export default (router, container) => controllers.forEach(f => f(router, container));
