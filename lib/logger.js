// @flow

import debug from 'debug';
import Rollbar from 'rollbar';

const appName: string = 'application';
const logLevels: Array<string> = ['critical', 'error', 'warning', 'info', 'debug'];

const devLogger = logLevels.reduce((acc, level) => ({ [level]: debug(`${appName}:${level}:`), ...acc }), {});

const prodLogger = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export default (env: string): Object => (env === 'production' ? prodLogger : devLogger);
