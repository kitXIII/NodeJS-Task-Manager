import debug from 'debug';
import Rollbar from 'rollbar';

const appName = 'application';
const logLevels = ['critical', 'error', 'warning', 'info', 'debug'];

const devLogger = logLevels.reduce((acc, level) => ({ [level]: debug(`${appName}:${level}:`), ...acc }), {});

const prodLogger = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export default env => (env === 'production' ? prodLogger : devLogger);
